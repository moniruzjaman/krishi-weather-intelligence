// ============================================================
// KWI - Krishi Weather Intelligence
// Risk Engine — computes per-category risk scores (0–100)
// and assembles a full RiskDashboard for the active farm.
// ============================================================

import type {
  RiskAssessment,
  RiskDashboard,
  RiskAlert,
  RiskCategory,
  RiskLevel,
  WeatherData,
  ActiveCrop,
  GrowthStageId,
} from '../types/index.js';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Map a numeric score (0–100) to a RiskLevel. */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'very_high';
}

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** ISO timestamp for "now". */
function nowISO(): string {
  return new Date().toISOString();
}

/** Hours-from-now ISO string. */
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 36e5).toISOString();
}

/** Resolve a GrowthStageId to its full config for an ActiveCrop. */
function getStage(crop: ActiveCrop) {
  return crop.config.growthStages.find((s) => s.id === crop.currentStage);
}

/** Collect all unique current stages across active crops. */
function uniqueStages(crops: ActiveCrop[]): GrowthStageId[] {
  return Array.from(new Set(crops.map((c) => c.currentStage)));
}

/** Derive a confidence value (70–95) based on how many data points are available. */
function deriveConfidence(weather: WeatherData): number {
  let q = 70;
  if (weather.agriculturalIndices.leafWetnessHours > 0) q += 5;
  if (weather.current.soilMoisture != null) q += 5;
  if (weather.current.soilTemperature != null) q += 5;
  if (weather.hourly.length >= 24) q += 5;
  if (weather.daily.length >= 7) q += 5;
  return Math.min(q, 95);
}

// ────────────────────────────────────────────────────────────
// Individual risk assessors
// ────────────────────────────────────────────────────────────

function assessHeatStress(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const temp = weather.current.temperature;
  let maxScore = 0;
  const evidence: string[] = [];

  for (const crop of crops) {
    const stage = getStage(crop);
    if (!stage) continue;
    if (temp > stage.heatStressThreshold) {
      const score = clamp(50 + (temp - stage.heatStressThreshold) * 5, 0, 100);
      if (score > maxScore) maxScore = score;
      evidence.push(`${crop.config.name}: temp ${temp}°C exceeds threshold ${stage.heatStressThreshold}°C`);
    }
  }

  evidence.push(`Current temperature: ${temp}°C`);
  if (weather.agriculturalIndices.hni > 0) evidence.push(`Heat Stress Index: ${weather.agriculturalIndices.hni}`);

  return {
    category: 'heat_stress',
    score: maxScore,
    level: getRiskLevel(maxScore),
    confidence: conf,
    explanation: maxScore > 50
      ? `High heat stress risk with temperature at ${temp}°C, exceeding crop thresholds. Immediate shade and irrigation recommended.`
      : `Temperature at ${temp}°C is within tolerable range for current crop stages.`,
    explanationBn: maxScore > 50
      ? `তাপমাত্রা ${temp}°C যা ফসলের সহনশীলতার সীমা অতিক্রম করেছে। এখনই ছায়া ও সেচের ব্যবস্থা নিন।`
      : `বর্তমান তাপমাত্রা ${temp}°C, যা ফসলের জন্য গ্রহণযোগ্য পরিসরে।`,
    evidence,
    affectedStages: uniqueStages(crops),
    mitigationActions: ['Provide shade nets', 'Increase irrigation frequency', 'Apply foliar silica spray', 'Avoid midday field work'],
    mitigationActionsBn: ['ছায়া জাল ব্যবহার করুন', 'সেচের হার বাড়ান', 'ফলিয়ার সিলিকা স্প্রে প্রয়োগ করুন', 'দুপুরে মাঠে কাজ এড়িয়ে চলুন'],
    updatedAt: nowISO(),
  };
}

function assessColdStress(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const temp = weather.current.temperature;
  let maxScore = 0;
  const evidence: string[] = [];

  for (const crop of crops) {
    const stage = getStage(crop);
    if (!stage) continue;
    if (temp < stage.coldStressThreshold) {
      const score = clamp(30 + (stage.coldStressThreshold - temp) * 6, 0, 100);
      if (score > maxScore) maxScore = score;
      evidence.push(`${crop.config.name}: temp ${temp}°C below threshold ${stage.coldStressThreshold}°C`);
    }
  }

  evidence.push(`Current temperature: ${temp}°C`);
  if (weather.agriculturalIndices.cni > 0) evidence.push(`Cold Stress Index: ${weather.agriculturalIndices.cni}`);

  return {
    category: 'cold_stress',
    score: maxScore,
    level: getRiskLevel(maxScore),
    confidence: conf,
    explanation: maxScore > 50
      ? `Cold stress detected at ${temp}°C. Young and flowering crops are highly vulnerable to chilling injury.`
      : `Temperature ${temp}°C poses no significant cold stress for current crops.`,
    explanationBn: maxScore > 50
      ? `${temp}°C তাপমাত্রায় শীতল প্রতিকূলতা শনাক্ত হয়েছে। অল্পবয়সী ও ফুল ধরা ফসল অত্যন্ত ঝুঁকিপূর্ণ।`
      : `তাপমাত্রা ${temp}°C, বর্তমান ফসলের জন্য তাৎপর্যপূর্ণ শীতল ঝুঁকি নেই।`,
    evidence,
    affectedStages: uniqueStages(crops),
    mitigationActions: ['Apply mulch to conserve soil heat', 'Use frost covers or row tunnels', 'Avoid nitrogen application before frost', 'Ensure adequate soil moisture'],
    mitigationActionsBn: ['মাটির তাপ ধরে রাখতে মালচিং করুন', 'ফ্রস্ট কভার বা রো টানেল ব্যবহার করুন', 'ফ্রস্টের আগে নাইট্রোজেন সার প্রয়োগ এড়িয়ে চলুন', 'মাটিতে পর্যাপ্ত আর্দ্রতা নিশ্চিত করুন'],
    updatedAt: nowISO(),
  };
}

function assessDisease(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const humidity = weather.current.humidity;
  const temp = weather.current.temperature;
  const leafWetness = weather.agriculturalIndices.leafWetnessHours;
  let score = 0;
  const evidence: string[] = [];

  if (humidity > 85) { score += 30; evidence.push(`Humidity very high at ${humidity}%`); }
  else if (humidity > 70) { score += 15; evidence.push(`Humidity elevated at ${humidity}%`); }

  if (leafWetness > 10) { score += 25; evidence.push(`Leaf wetness ${leafWetness}h — prolonged foliage moisture`); }
  else if (leafWetness > 4) { score += 12; evidence.push(`Leaf wetness ${leafWetness}h`); }

  if (temp >= 20 && temp <= 30) { score += 20; evidence.push(`Temperature ${temp}°C is in the disease-favorable range (20–30°C)`); }
  else if (temp >= 15 && temp <= 35) { score += 8; evidence.push(`Temperature ${temp}°C is marginally favorable for disease`); }

  // Boost by max crop disease susceptibility in current stages
  let maxSusceptibility = 0;
  for (const crop of crops) {
    const stage = getStage(crop);
    if (stage && stage.diseaseSusceptibility > maxSusceptibility) {
      maxSusceptibility = stage.diseaseSusceptibility;
    }
  }
  score += (maxSusceptibility / 100) * 25;
  evidence.push(`Peak stage disease susceptibility: ${maxSusceptibility}%`);

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'disease',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Favorable conditions for fungal disease: high humidity (${humidity}%), leaf wetness ${leafWetness}h, and temperature ${temp}°C.`
      : `Current weather conditions are not highly conducive to disease outbreak.`,
    explanationBn: score > 50
      ? `ছত্রাকজনিত রোগের জন্য অনুকূল পরিস্থিতি: আর্দ্রতা ${humidity}%, পাতার ভেজাটে ${leafWetness} ঘণ্টা, তাপমাত্রা ${temp}°C।`
      : `বর্তমান আবহাওয়া রোগ বিস্তারের জন্য অনুকূল নয়।`,
    evidence,
    affectedStages: uniqueStages(crops),
    mitigationActions: ['Apply preventive fungicide spray', 'Improve field drainage and air circulation', 'Remove infected plant debris', 'Scout fields for early symptoms'],
    mitigationActionsBn: ['প্রতিরোধমূলক ছত্রাকনাশক স্প্রে করুন', 'মাঠের জল নিষ্কাশন ও বায়ু চলাচল উন্নত করুন', 'আক্রান্ত উদ্ভিদ অবশিষ্ট অপসারণ করুন', 'প্রাথমিক লক্ষণের জন্য মাঠ পর্যবেক্ষণ করুন'],
    updatedAt: nowISO(),
  };
}

function assessSprayWindow(weather: WeatherData, crops: ActiveCrop[], conf: number, diseaseScore: number): RiskAssessment {
  const wind = weather.current.windSpeed;
  const precipProb = weather.current.precipitationProbability;
  const precip = weather.current.precipitation;
  let score = 0;
  const evidence: string[] = [];

  // High score = BAD time to spray
  score += diseaseScore * 0.3; // urgency from disease pressure
  if (wind > 20) { score += 25; evidence.push(`Wind speed ${wind} km/h too high for spraying`); }
  else if (wind > 10) { score += 10; evidence.push(`Wind speed ${wind} km/h — moderate drift risk`); }

  if (precipProb > 60) { score += 25; evidence.push(`Rain probability ${precipProb}% — spray wash-off likely`); }
  else if (precipProb > 30) { score += 10; evidence.push(`Rain probability ${precipProb}%`); }

  if (precip > 2) { score += 15; evidence.push(`Active precipitation ${precip} mm`); }
  if (weather.current.humidity > 90) { score += 10; evidence.push(`Very high humidity may reduce spray efficacy`); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'spray_window',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Current conditions are unfavorable for spraying: wind ${wind} km/h, rain probability ${precipProb}%.`
      : `Window appears suitable for spraying operations. Low wind and minimal rain expected.`,
    explanationBn: score > 50
      ? `বর্তমান অবস্থায় স্প্রে করা অনুচিত: বাতাস ${wind} কিমি/ঘণ্টা, বৃষ্টির সম্ভাবনা ${precipProb}%।`
      : `স্প্রে করার জন্য পরিস্থিতি অনুকূল। কম বাতাস ও বৃষ্টির সম্ভাবনা কম।`,
    evidence,
    affectedStages: uniqueStages(crops),
    mitigationActions: ['Wait for wind to drop below 10 km/h', 'Ensure at least 4 dry hours after spraying', 'Use drift-reducing nozzles if spraying is urgent', 'Consider early morning or late evening application'],
    mitigationActionsBn: ['বাতাস ১০ কিমি/ঘণ্টার নিচে নামার জন্য অপেক্ষা করুন', 'স্প্রের পর কমপক্ষে ৪ ঘণ্টা শুকনো রাখুন', 'জরুরি হলে ড্রিফট-হ্রাসকারী নোজল ব্যবহার করুন', 'ভোর বা সন্ধ্যায় স্প্রে করার চেষ্টা করুন'],
    updatedAt: nowISO(),
  };
}

function assessIrrigation(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const et0 = weather.agriculturalIndices.et0;
  const soilMoisture = weather.current.soilMoisture;
  const deficit = weather.agriculturalIndices.soilMoistureDeficit;
  const dailyRain = weather.daily[0]?.precipitationSum ?? 0;
  let score = 0;
  const evidence: string[] = [];

  // High score = irrigation urgently needed
  if (deficit > 20) { score += 40; evidence.push(`Soil moisture deficit high: ${deficit} mm`); }
  else if (deficit > 10) { score += 20; evidence.push(`Soil moisture deficit: ${deficit} mm`); }

  if (et0 > 5) { score += 20; evidence.push(`ET0 ${et0} mm/day — high evapotranspiration`); }
  else if (et0 > 3) { score += 10; evidence.push(`ET0 ${et0} mm/day`); }

  if (dailyRain < 1) { score += 15; evidence.push('No meaningful rainfall forecast today'); }
  if (soilMoisture != null && soilMoisture < 30) { score += 20; evidence.push(`Soil moisture ${soilMoisture}% — critically low`); }

  // Check crop water requirements
  let maxReq = 0;
  for (const crop of crops) {
    const stage = getStage(crop);
    if (stage && stage.waterRequirementMm > maxReq) maxReq = stage.waterRequirementMm;
  }
  if (maxReq > 5) { score += 10; evidence.push(`Peak crop water requirement: ${maxReq} mm/day`); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'irrigation',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Irrigation needed: soil moisture deficit ${deficit} mm, ET0 ${et0} mm/day with no rain expected.`
      : `Soil moisture and rainfall are adequate. No immediate irrigation required.`,
    explanationBn: score > 50
      ? `সেচ প্রয়োজন: মাটির আর্দ্রতা ঘাটতি ${deficit} মিমি, ET0 ${et0} মিমি/দিন, বৃষ্টির সম্ভাবনা নেই।`
      : `মাটির আর্দ্রতা ও বৃষ্টিপাত পর্যাপ্ত। এখনই সেচের প্রয়োজন নেই।`,
    evidence,
    affectedStages: uniqueStages(crops),
    mitigationActions: ['Schedule irrigation within 24 hours', 'Prioritize fields with higher water requirement stages', 'Use deficit irrigation if water is scarce', 'Monitor soil moisture sensors closely'],
    mitigationActionsBn: ['২৪ ঘণ্টার মধ্যে সেচের ব্যবস্থা করুন', 'বেশি পানি চাহিদার পর্যায়ের মাঠ অগ্রাধিকার দিন', 'পানি কম হলে ঘাটতিমূলক সেচ ব্যবহার করুন', 'মাটির আর্দ্রতা সেন্সর নিবিড়ভাবে পর্যবেক্ষণ করুন'],
    updatedAt: nowISO(),
  };
}

function assessWaterlogging(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const precip = weather.current.precipitation;
  const humidity = weather.current.humidity;
  const soilMoisture = weather.current.soilMoisture;
  let score = 0;
  const evidence: string[] = [];

  // Clay soil assumption boosts base risk
  const clayBoost = 10;
  if (precip > 15) { score += 35; evidence.push(`Heavy precipitation: ${precip} mm`); }
  else if (precip > 5) { score += 15; evidence.push(`Moderate precipitation: ${precip} mm`); }

  if (humidity > 90) { score += 20; evidence.push(`Very high humidity: ${humidity}%`); }
  else if (humidity > 75) { score += 10; evidence.push(`Elevated humidity: ${humidity}%`); }

  if (soilMoisture != null) {
    if (soilMoisture > 80) { score += 25; evidence.push(`Soil moisture saturated: ${soilMoisture}%`); }
    else if (soilMoisture > 60) { score += 12; evidence.push(`Soil moisture high: ${soilMoisture}%`); }
  }

  score = clamp(Math.round(score + clayBoost), 0, 100);

  return {
    category: 'waterlogging',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Waterlogging risk elevated: heavy rain (${precip} mm), high humidity, and clay-type soil limiting drainage.`
      : `Drainage conditions appear adequate. No significant waterlogging risk.`,
    explanationBn: score > 50
      ? `পানি জমে থাকার ঝুঁকি বেশি: ভারী বৃষ্টি (${precip} মিমি), উচ্চ আর্দ্রতা ও মাটির ধরন নিষ্কাশন সীমিত করছে।`
      : `নিষ্কাশন ব্যবস্থা পর্যাপ্ত। তাৎপর্যপূর্ণ পানি জমার ঝুঁকি নেই।`,
    evidence,
    affectedStages: ['seedling', 'vegetative', 'tillering', 'flowering', 'grain_filling'],
    mitigationActions: ['Open drainage channels immediately', 'Avoid irrigation until water recedes', 'Apply potassium silicate to improve root aeration', 'Monitor for root rot symptoms'],
    mitigationActionsBn: ['অবিলম্বে নিষ্কাশন খাল খুলুন', 'পানি কমে না যাওয়া পর্যন্ত সেচ বন্ধ রাখুন', 'মূলের বায়ু সঞ্চালন উন্নত করতে পটাসিয়াম সিলিকেট প্রয়োগ করুন', 'মূল পচার লক্ষণের জন্য পর্যবেক্ষণ করুন'],
    updatedAt: nowISO(),
  };
}

function assessFlood(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const precipProb = weather.current.precipitationProbability;
  let cumulativeRain = 0;
  for (const d of weather.daily.slice(0, 3)) cumulativeRain += d.precipitationSum;
  let score = 0;
  const evidence: string[] = [];

  if (precipProb > 80) { score += 30; evidence.push(`Very high precipitation probability: ${precipProb}%`); }
  else if (precipProb > 50) { score += 15; evidence.push(`Precipitation probability: ${precipProb}%`); }

  if (cumulativeRain > 50) { score += 40; evidence.push(`3-day cumulative rainfall: ${cumulativeRain.toFixed(1)} mm — flood risk`); }
  else if (cumulativeRain > 25) { score += 20; evidence.push(`3-day cumulative rainfall: ${cumulativeRain.toFixed(1)} mm`); }

  const maxWind = weather.daily[0]?.windSpeedMax ?? 0;
  if (maxWind > 40) { score += 15; evidence.push(`Strong winds may compound flood damage`); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'flood',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Flood risk significant: ${cumulativeRain.toFixed(1)} mm rain expected over 3 days with ${precipProb}% probability.`
      : `Flood risk is low based on current precipitation forecasts.`,
    explanationBn: score > 50
      ? `বন্যার ঝুঁকি যথেষ্ট: পরবর্তী ৩ দিনে ${cumulativeRain.toFixed(1)} মিমি বৃষ্টির পূর্বাভাস, সম্ভাবনা ${precipProb}%।`
      : `বর্তমান বৃষ্টিপাতের পূর্বাভাস অনুযায়ী বন্যার ঝুঁকি কম।`,
    evidence,
    affectedStages: ['seedling', 'vegetative', 'tillering', 'flowering'],
    mitigationActions: ['Prepare raised beds or move seedlings to higher ground', 'Ensure field bunds and embankments are intact', 'Harvest mature crops if safe to do so', 'Coordinate with local disaster management'],
    mitigationActionsBn: ['উঁচু বেড তৈরি করুন বা চারা উঁচু জমিতে সরান', 'মাঠের বাঁধ ও পাড় ঠিক আছে তা নিশ্চিত করুন', 'নিরাপদ হলে পাকা ফসল কাটুন', 'স্থানীয় দুর্যোগ ব্যবস্থাপনার সাথে সমন্বয় করুন'],
    updatedAt: nowISO(),
  };
}

function assessWindDamage(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const wind = weather.current.windSpeed;
  const gusts = weather.current.windGusts;
  let score = 0;
  const evidence: string[] = [];

  if (wind > 50) { score += 50; evidence.push(`Extreme wind: ${wind} km/h`); }
  else if (wind > 30) { score += 30 + (wind - 30) * 2; evidence.push(`High wind speed: ${wind} km/h`); }
  else if (wind > 20) { score += 15; evidence.push(`Moderate wind: ${wind} km/h`); }

  if (gusts > 60) { score += 25; evidence.push(`Dangerous gusts up to ${gusts} km/h`); }
  else if (gusts > 40) { score += 12; evidence.push(`Gusts up to ${gusts} km/h`); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'wind_damage',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Wind damage likely: sustained ${wind} km/h with gusts ${gusts} km/h. Physical damage to crops expected.`
      : `Wind conditions are manageable with no significant damage risk.`,
    explanationBn: score > 50
      ? `বাতাসের ক্ষয়ক্ষতি সম্ভব: টেকসই ${wind} কিমি/ঘণ্টা, ঝোড়ো ${gusts} কিমি/ঘণ্টা। ফসলের ক্ষয়ক্ষতি হতে পারে।`
      : `বাতাসের অবস্থা নিয়ন্ত্রণযোগ্য, তাৎপর্যপূর্ণ ক্ষয়ক্ষতির ঝুঁকি নেই।`,
    evidence,
    affectedStages: ['flowering', 'grain_filling', 'ripening', 'harvest'],
    mitigationActions: ['Install windbreaks or temporary barriers', 'Avoid spraying or fertilizer application', 'Harvest ripe crops immediately if safe', 'Reinforce staking for tall crops'],
    mitigationActionsBn: ['বাঁধ বা অস্থায়ী বাধা স্থাপন করুন', 'স্প্রে বা সার প্রয়োগ এড়িয়ে চলুন', 'নিরাপদ হলে পাকা ফসল সাথে সাথে কাটুন', 'লম্বা ফসলের জন্য খুঁটি মজবুত করুন'],
    updatedAt: nowISO(),
  };
}

function assessHarvest(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const precipProb = weather.current.precipitationProbability;
  const wind = weather.current.windSpeed;
  const precip = weather.current.precipitation;
  let score = 0;
  const evidence: string[] = [];

  // High score = bad time to harvest
  if (precipProb > 60) { score += 35; evidence.push(`High rain probability: ${precipProb}%`); }
  else if (precipProb > 30) { score += 15; evidence.push(`Rain probability: ${precipProb}%`); }

  if (wind > 25) { score += 25; evidence.push(`Wind too strong for harvest: ${wind} km/h`); }
  else if (wind > 15) { score += 10; evidence.push(`Moderate wind: ${wind} km/h`); }

  if (precip > 5) { score += 20; evidence.push(`Active rainfall: ${precip} mm`); }
  if (weather.current.humidity > 85) { score += 15; evidence.push(`High humidity may affect grain moisture at harvest`); }

  // Check if any crop is in harvest stage
  const harvestCrops = crops.filter((c) => c.currentStage === 'harvest');
  if (harvestCrops.length > 0) score += 10;

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'harvest',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Harvest conditions are poor: rain probability ${precipProb}%, wind ${wind} km/h. Delay harvest if possible.`
      : `Weather conditions are favorable for harvest operations.`,
    explanationBn: score > 50
      ? `ফসল কাটার অবস্থা খারাপ: বৃষ্টির সম্ভাবনা ${precipProb}%, বাতাস ${wind} কিমি/ঘণ্টা। সম্ভব হলে বিলম্ব করুন।`
      : `আবহাওয়া ফসল কাটার জন্য অনুকূল।`,
    evidence,
    affectedStages: ['ripening', 'harvest'],
    mitigationActions: ['Delay harvest until dry window opens', 'Pre-arrange mechanical drying if grain gets wet', 'Harvest early morning to avoid heat and rain', 'Cover harvested produce immediately'],
    mitigationActionsBn: ['শুকনো সময় না পাওয়া পর্যন্ত ফসল কাটা বিলম্ব করুন', 'দানা ভিজলে যান্ত্রিক শুকানোর ব্যবস্থা করুন', 'তাপ ও বৃষ্টি এড়াতে ভোরে ফসল কাটুন', 'কাটা ফসল সাথে সাথে ঢেকে রাখুন'],
    updatedAt: nowISO(),
  };
}

function assessLodging(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const wind = weather.current.windSpeed;
  const precip = weather.current.precipitation;
  let score = 0;
  const evidence: string[] = [];

  if (wind > 30) { score += 25; evidence.push(`High wind: ${wind} km/h promotes lodging`); }
  else if (wind > 20) { score += 10; evidence.push(`Moderate wind: ${wind} km/h`); }

  if (precip > 10) { score += 20; evidence.push(`Heavy rain softens soil: ${precip} mm`); }
  else if (precip > 3) { score += 10; evidence.push(`Rainfall: ${precip} mm`); }

  // Crops in tall/stem-elongation phases are most vulnerable
  const vulnerableStages: GrowthStageId[] = ['stem_elongation', 'booting', 'heading', 'grain_filling'];
  const hasVulnerable = crops.some((c) => vulnerableStages.includes(c.currentStage));
  if (hasVulnerable) { score += 25; evidence.push('Active crops are in lodging-vulnerable growth stages'); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'lodging',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Lodging risk is high due to wind (${wind} km/h), rain (${precip} mm), and vulnerable crop stages.`
      : `Conditions do not pose significant lodging risk for current crops.`,
    explanationBn: score > 50
      ? `বাতাস (${wind} কিমি/ঘণ্টা), বৃষ্টি (${precip} মিমি) ও সংবেদনশীল পর্যায়ের কারণে শল্কমোচনের ঝুঁকি বেশি।`
      : `বর্তমান পরিস্থিতিতে শল্কমোচনের তাৎপর্যপূর্ণ ঝুঁকি নেই।`,
    evidence,
    affectedStages: vulnerableStages,
    mitigationActions: ['Apply plant growth regulators to strengthen stems', 'Reduce nitrogen rate to avoid excessive vegetative growth', 'Ensure proper plant population density', 'Use windbreaks in exposed fields'],
    mitigationActionsBn: ['কাণ্ড শক্ত করতে উদ্ভিদ বৃদ্ধি নিয়ন্ত্রক প্রয়োগ করুন', 'অতিরিক্ত উদ্ভিদ বৃদ্ধি এড়াতে নাইট্রোজেন কমান', 'সঠিক উদ্ভিদ ঘনত্ব নিশ্চিত করুন', 'উন্মুক্ত মাঠে বাঁধ ব্যবহার করুন'],
    updatedAt: nowISO(),
  };
}

function assessPollination(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const temp = weather.current.temperature;
  const precip = weather.current.precipitation;
  let score = 0;
  const evidence: string[] = [];

  const floweringCrops = crops.filter((c) => c.currentStage === 'flowering');

  if (floweringCrops.length === 0) {
    return {
      category: 'pollination',
      score: 0, level: 'low', confidence: conf,
      explanation: 'No crops are currently in the flowering stage.',
      explanationBn: 'বর্তমানে কোনো ফসল ফুল ধরার পর্যায়ে নেই।',
      evidence: [], affectedStages: ['flowering'],
      mitigationActions: [], mitigationActionsBn: [],
      updatedAt: nowISO(),
    };
  }

  if (precip > 5) { score += 35; evidence.push(`Rain during flowering (${precip} mm) washes away pollen`); }
  else if (precip > 1) { score += 15; evidence.push(`Light rain during flowering: ${precip} mm`); }

  if (temp > 35) { score += 35; evidence.push(`Extreme heat ${temp}°C damages pollen viability`); }
  else if (temp > 32) { score += 15; evidence.push(`High temperature ${temp}°C may reduce pollen viability`); }

  if (weather.current.humidity > 90) { score += 15; evidence.push('Very high humidity interferes with pollen release'); }
  if (weather.current.cloudCover > 80) { score += 10; evidence.push(`Heavy cloud cover may reduce pollinator activity`); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'pollination',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Pollination at risk: ${temp}°C and ${precip} mm rain during critical flowering stage.`
      : `Weather conditions are favorable for pollination.`,
    explanationBn: score > 50
      ? `পরাগায়ন ঝুঁকিতে: ফুল ধরার সময় ${temp}°C তাপমাত্রা ও ${precip} মিমি বৃষ্টি।`
      : `পরাগায়নের জন্য আবহাওয়া অনুকূল।`,
    evidence,
    affectedStages: ['flowering'],
    mitigationActions: ['Consider supplementary pollination if feasible', 'Ensure adequate irrigation to counter heat stress', 'Avoid spraying insecticides during flowering', 'Plant bee-attracting border crops for future seasons'],
    mitigationActionsBn: ['সম্ভব হলে পরিপূরক পরাগায়ন বিবেচনা করুন', 'তাপ প্রতিকূলতা মোচাতে পর্যাপ্ত সেচ দিন', 'ফুল ধরার সময় কীটনাশক স্প্রে এড়িয়ে চলুন', 'ভবিষ্যতের জন্য মৌমাছি আকৃষ্টকারী সীমান্ত ফসল লাগান'],
    updatedAt: nowISO(),
  };
}

function assessSeedlingStress(weather: WeatherData, crops: ActiveCrop[], conf: number): RiskAssessment {
  const temp = weather.current.temperature;
  let score = 0;
  const evidence: string[] = [];

  const seedlingCrops = crops.filter((c) => c.currentStage === 'seedling' || c.currentStage === 'germination');

  if (seedlingCrops.length === 0) {
    return {
      category: 'seedling_stress',
      score: 0, level: 'low', confidence: conf,
      explanation: 'No crops are in the seedling or germination stage.',
      explanationBn: 'কোনো ফসল চারা বা অঙ্কুরোদ্গম পর্যায়ে নেই।',
      evidence: [], affectedStages: ['seedling', 'germination'],
      mitigationActions: [], mitigationActionsBn: [],
      updatedAt: nowISO(),
    };
  }

  if (temp > 40) { score += 50; evidence.push(`Extreme heat ${temp}°C — lethal for seedlings`); }
  else if (temp > 35) { score += 30; evidence.push(`Very high temperature ${temp}°C stresses seedlings`); }
  else if (temp > 32) { score += 15; evidence.push(`Temperature ${temp}°C moderately high for seedlings`); }

  if (temp < 10) { score += 40; evidence.push(`Cold temperature ${temp}°C — seedling growth inhibited`); }
  else if (temp < 15) { score += 15; evidence.push(`Cool temperature ${temp}°C slows seedling development`); }

  if (weather.current.precipitation > 20) { score += 20; evidence.push('Heavy rain may physically damage seedlings'); }
  if (weather.current.windSpeed > 25) { score += 15; evidence.push('Strong wind may uproot tender seedlings'); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'seedling_stress',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Seedling stress is severe at ${temp}°C. Young plants are highly vulnerable to extreme temperatures.`
      : `Conditions are acceptable for seedling growth and development.`,
    explanationBn: score > 50
      ? `${temp}°C তাপমাত্রায় চারার প্রতিকূলতা তীব্র। অল্পবয়সী গাছ চরম তাপমাত্রায় অত্যন্ত সংবেদনশীল।`
      : `চারার বৃদ্ধি ও বিকাশের জন্য পরিস্থিতি গ্রহণযোগ্য।`,
    evidence,
    affectedStages: ['seedling', 'germination'],
    mitigationActions: ['Provide shade nets over nursery beds', 'Use row covers for cold protection', 'Apply light irrigation to cool soil temperature', 'Transplant only after hardening off'],
    mitigationActionsBn: ['নার্সারি বেডের ওপর ছায়া জাল দিন', 'শীতল সুরক্ষার জন্য রো কভার ব্যবহার করুন', 'মাটির তাপমাত্রা কমাতে হালকা সেচ দিন', 'হার্ডেনিং শেষে রোপণ করুন'],
    updatedAt: nowISO(),
  };
}

function assessNutrientLoss(weather: WeatherData, _crops: ActiveCrop[], conf: number): RiskAssessment {
  let cumulativeRain = 0;
  for (const d of weather.daily.slice(0, 3)) cumulativeRain += d.precipitationSum;
  const precip = weather.current.precipitation;
  let score = 0;
  const evidence: string[] = [];

  if (cumulativeRain > 60) { score += 40; evidence.push(`Heavy 3-day rain ${cumulativeRain.toFixed(1)} mm — significant leaching expected`); }
  else if (cumulativeRain > 30) { score += 25; evidence.push(`Moderate 3-day rain ${cumulativeRain.toFixed(1)} mm — some nutrient leaching`); }
  else if (cumulativeRain > 10) { score += 10; evidence.push(`3-day rainfall ${cumulativeRain.toFixed(1)} mm`); }

  if (precip > 20) { score += 25; evidence.push(`Intense current rainfall ${precip} mm accelerates runoff`); }
  else if (precip > 10) { score += 12; evidence.push(`Current rainfall ${precip} mm`); }

  if (weather.current.windSpeed > 20) { score += 10; evidence.push('Wind may increase surface runoff'); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'nutrient_loss',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Heavy rainfall forecast will likely leach nitrogen and other soluble nutrients from the root zone.`
      : `Nutrient loss risk is low with current rainfall levels.`,
    explanationBn: score > 50
      ? `ভারী বৃষ্টির পূর্বাভাসে নাইট্রোজেন ও অন্যান্য দ্রবণীয় পুষ্টি উপাদান মূলের অঞ্চল থেকে ধুয়ে যেতে পারে।`
      : `বর্তমান বৃষ্টিপাতে পুষ্টি ক্ষয়ের ঝুঁকি কম।`,
    evidence,
    affectedStages: ['vegetative', 'tillering', 'stem_elongation', 'grain_filling'],
    mitigationActions: ['Apply split doses of nitrogen rather than single large dose', 'Use slow-release fertilizer formulations', 'Consider foliar application to bypass soil leaching', 'Add organic matter to improve nutrient retention'],
    mitigationActionsBn: ['একক বড় মাত্রার বদলে নাইট্রোজেন বিভক্ত মাত্রায় দিন', 'স্লো-রিলিজ সার ব্যবহার করুন', 'মাটির লিচিং এড়াতে ফলিয়ার প্রয়োগ বিবেচনা করুন', 'পুষ্টি ধরে রাখতে জৈব পদার্থ যোগ করুন'],
    updatedAt: nowISO(),
  };
}

function assessFieldAccessibility(weather: WeatherData, _crops: ActiveCrop[], conf: number): RiskAssessment {
  const precip = weather.current.precipitation;
  const precipProb = weather.current.precipitationProbability;
  const soilMoisture = weather.current.soilMoisture;
  let score = 0;
  const evidence: string[] = [];

  if (precip > 15) { score += 30; evidence.push(`Heavy rain ${precip} mm — fields may be inaccessible`); }
  else if (precip > 5) { score += 15; evidence.push(`Rain ${precip} mm — some field access difficulty`); }

  if (precipProb > 70) { score += 20; evidence.push(`High rain probability ${precipProb}%`); }
  else if (precipProb > 40) { score += 10; evidence.push(`Rain probability ${precipProb}%`); }

  if (soilMoisture != null) {
    if (soilMoisture > 85) { score += 30; evidence.push(`Soil saturated at ${soilMoisture}% — heavy machinery will cause compaction`); }
    else if (soilMoisture > 65) { score += 15; evidence.push(`Soil moisture ${soilMoisture}% — moderate access risk`); }
  }

  if (weather.current.visibility < 2) { score += 15; evidence.push('Poor visibility restricts field operations'); }

  score = clamp(Math.round(score), 0, 100);

  return {
    category: 'field_accessibility',
    score,
    level: getRiskLevel(score),
    confidence: conf,
    explanation: score > 50
      ? `Field access is restricted due to wet conditions. Machinery use may cause soil compaction.`
      : `Fields are accessible for normal operations.`,
    explanationBn: score > 50
      ? `ভেজা অবস্থার কারণে মাঠে প্রবেশ সীমিত। যন্ত্রের ব্যবহারে মাটি চাপা পড়তে পারে।`
      : `স্বাভাবিক কাজের জন্য মাঠে প্রবেশ সম্ভব।`,
    evidence,
    affectedStages: ['sowing', 'vegetative', 'tillering', 'harvest'],
    mitigationActions: ['Use lighter equipment or manual labor', 'Wait for soil to dry before machinery entry', 'Plan access routes on higher ground', 'Use permanent raised beds for improved access'],
    mitigationActionsBn: ['হালকা যন্ত্র বা হাতে কাজ ব্যবহার করুন', 'যন্ত্র নেওয়ার আগে মাটি শুকানোর জন্য অপেক্ষা করুন', 'উঁচু জমি দিয়ে প্রবেশ পথ পরিকল্পনা করুন', 'উন্নত প্রবেশযোগ্যতার জন্য স্থায়ী উঁচু বেড ব্যবহার করুন'],
    updatedAt: nowISO(),
  };
}

// ────────────────────────────────────────────────────────────
// Alert generation
// ────────────────────────────────────────────────────────────

const ALERT_META: Record<RiskCategory, { title: string; titleBn: string }> = {
  disease:            { title: 'Disease Risk Alert',             titleBn: 'রোগের ঝুঁকি সতর্কতা' },
  spray_window:       { title: 'Spray Window Alert',            titleBn: 'স্প্রে উইন্ডো সতর্কতা' },
  irrigation:         { title: 'Irrigation Alert',              titleBn: 'সেচ সতর্কতা' },
  waterlogging:       { title: 'Waterlogging Alert',            titleBn: 'পানি জমার সতর্কতা' },
  flood:              { title: 'Flood Risk Alert',              titleBn: 'বন্যার ঝুঁকি সতর্কতা' },
  heat_stress:        { title: 'Heat Stress Alert',             titleBn: 'তাপ প্রতিকূলতা সতর্কতা' },
  cold_stress:        { title: 'Cold Stress Alert',             titleBn: 'শীতল প্রতিকূলতা সতর্কতা' },
  wind_damage:        { title: 'Wind Damage Alert',             titleBn: 'বাতাসের ক্ষয়ক্ষতি সতর্কতা' },
  harvest:            { title: 'Harvest Condition Alert',       titleBn: 'ফসল কাটার অবস্থা সতর্কতা' },
  lodging:            { title: 'Lodging Risk Alert',            titleBn: 'শল্কমোচনের ঝুঁকি সতর্কতা' },
  pollination:        { title: 'Pollination Risk Alert',        titleBn: 'পরাগায়নের ঝুঁকি সতর্কতা' },
  seedling_stress:    { title: 'Seedling Stress Alert',         titleBn: 'চারার প্রতিকূলতা সতর্কতা' },
  nutrient_loss:      { title: 'Nutrient Loss Alert',           titleBn: 'পুষ্টি ক্ষয়ের সতর্কতা' },
  field_accessibility: { title: 'Field Accessibility Alert',    titleBn: 'মাঠে প্রবেশ সতর্কতা' },
};

function generateAlerts(risks: RiskAssessment[]): RiskAlert[] {
  return risks
    .filter((r) => r.score > 50)
    .map((r) => ({
      id: `alert-${r.category}-${Date.now()}`,
      category: r.category,
      level: r.level,
      title: ALERT_META[r.category].title,
      titleBn: ALERT_META[r.category].titleBn,
      message: r.explanation,
      messageBn: r.explanationBn,
      actionable: true,
      actionRequired: r.mitigationActions[0],
      actionRequiredBn: r.mitigationActionsBn[0],
      expiresAt: hoursFromNow(12),
    }));
}

// ────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────

/**
 * Compute the full RiskDashboard for a given weather snapshot and set of
 * active crops.
 *
 * - Evaluates all 14 risk categories.
 * - Overall score = weighted average of the top 5 highest-scoring risks.
 * - Generates alerts for every risk scoring above 50.
 */
export function computeRiskDashboard(weather: WeatherData, activeCrops: ActiveCrop[]): RiskDashboard {
  const conf = deriveConfidence(weather);

  // Compute disease first (needed by spray_window)
  const disease = assessDisease(weather, activeCrops, conf);

  // Compute all 14 risk assessments
  const risks: RiskAssessment[] = [
    disease,
    assessSprayWindow(weather, activeCrops, conf, disease.score),
    assessIrrigation(weather, activeCrops, conf),
    assessWaterlogging(weather, activeCrops, conf),
    assessFlood(weather, activeCrops, conf),
    assessHeatStress(weather, activeCrops, conf),
    assessColdStress(weather, activeCrops, conf),
    assessWindDamage(weather, activeCrops, conf),
    assessHarvest(weather, activeCrops, conf),
    assessLodging(weather, activeCrops, conf),
    assessPollination(weather, activeCrops, conf),
    assessSeedlingStress(weather, activeCrops, conf),
    assessNutrientLoss(weather, activeCrops, conf),
    assessFieldAccessibility(weather, activeCrops, conf),
  ];

  // Overall risk = weighted average of top 5 risks
  const sorted = [...risks].sort((a, b) => b.score - a.score);
  const top5 = sorted.slice(0, 5);
  const weights = [0.30, 0.25, 0.20, 0.15, 0.10]; // descending weight
  const overallScore = Math.round(
    top5.reduce((sum, r, i) => sum + r.score * weights[i], 0)
  );

  const alerts = generateAlerts(risks);

  return {
    overallRiskScore: overallScore,
    overallRiskLevel: getRiskLevel(overallScore),
    risks,
    alerts,
  };
}