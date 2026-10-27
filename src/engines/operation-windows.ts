import type { ActiveCrop, OperationWindow, WeatherData, WeatherWindows, WeatherHourly } from '../types/index.js';

// ────────────────────────────────────────────────────────────
// Operation-window engine
// ────────────────────────────────────────────────────────────
//
// Walks the next 48 hours of the hourly forecast and produces a list of
// `OperationWindow` objects per operation type. A window is "suitable" when
// its composite score is >= SUITABLE_THRESHOLD.
//
// Crop-aware scoring: previously this engine only inspected `crops[0]`,
// silently ignoring any additional active crops. We now compute the worst-case
// stage threshold across all active crops (a window is suitable only if *all*
// active crops find it acceptable), which is the safer failure mode for spray
// and harvest operations.

const SUITABLE_THRESHOLD = 70;

function make(
  type: OperationWindow['type'],
  h: WeatherHourly,
  crops: ActiveCrop[],
): OperationWindow {
  const rain = h.precipitationProbability;
  const wind = h.windSpeed;
  const temp = h.temperature;
  let score = 100;
  const reasons: string[] = [];
  const reasonsBn: string[] = [];

  if (rain > 60) {
    score -= 50;
    reasons.push(`Rain probability ${rain}%`);
    reasonsBn.push(`বৃষ্টির সম্ভাবনা ${rain}%`);
  } else if (rain > 30) {
    score -= 20;
    reasons.push(`Rain probability ${rain}%`);
    reasonsBn.push(`বৃষ্টির সম্ভাবনা ${rain}%`);
  }

  if (wind > 15) {
    score -= 35;
    reasons.push(`Wind ${wind} km/h`);
    reasonsBn.push(`বাতাস ${wind} কিমি/ঘণ্টা`);
  } else if (wind > 10) {
    score -= 15;
    reasons.push(`Moderate wind ${wind} km/h`);
    reasonsBn.push(`মাঝারি বাতাস ${wind} কিমি/ঘণ্টা`);
  }

  // Operation-specific adjustments
  if (type === 'spray' && rain < 30 && wind < 10) {
    reasons.push('Low rain and wind support spray operations');
    reasonsBn.push('কম বৃষ্টি ও বাতাস স্প্রে কাজের জন্য সহায়ক');
  }
  if (type === 'irrigation' && rain > 60) {
    score -= 25;
    reasons.push('Heavy rain expected — defer irrigation');
    reasonsBn.push('ভারী বৃষ্টির পূর্বাভাস — সেচ বিলম্বিত করুন');
  }
  if (type === 'field_access' && rain > 50) {
    score -= 20;
  }

  // Crop-aware temperature threshold: penalize if *any* active crop's current
  // stage marks this temperature as heat-stressful. Previously only crops[0]
  // was inspected, so a farmer with rice + jute active would have jute's
  // thresholds ignored.
  for (const crop of crops) {
    const stage = crop.config.growthStages.find(s => s.id === crop.currentStage);
    if (stage && temp > stage.heatStressThreshold) {
      score -= 10;
      reasons.push(`${crop.config.name}: ${temp}°C above ${stage.heatStressThreshold}°C stage threshold`);
      reasonsBn.push(`${crop.config.nameBn}: তাপমাত্রা ${temp}°C ফসলের পর্যায়ের সীমার ওপরে`);
      break; // one penalty is enough to surface the risk
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const end = new Date(new Date(h.time).getTime() + 3_600_000).toISOString();

  return {
    type,
    start: h.time,
    end,
    score,
    suitable: score >= SUITABLE_THRESHOLD,
    reasons,
    reasonsBn,
    confidence: 0.65,
  };
}

export function calculateOperationWindows(
  weather: WeatherData,
  crops: ActiveCrop[] = [],
): WeatherWindows {
  const out: WeatherWindows = {
    spray: [],
    irrigation: [],
    fertilizer: [],
    planting: [],
    harvest: [],
    fieldAccess: [],
  };
  const types: OperationWindow['type'][] = ['spray', 'irrigation', 'fertilizer', 'planting', 'harvest', 'field_access'];

  for (const h of weather.hourly.slice(0, 48)) {
    for (const type of types) {
      // Map `field_access` (the API type) to the `fieldAccess` key on WeatherWindows.
      const window = make(type, h, crops);
      if (!window.suitable) continue;

      if (type === 'field_access') {
        out.fieldAccess.push(window);
      } else {
        // `out[type]` is type-safe because `type` is one of the operation
        // keys of WeatherWindows at this point.
        (out[type] as OperationWindow[]).push(window);
      }
    }
  }

  return out;
}
