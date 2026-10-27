// ============================================================
// KWI - Krishi Weather Intelligence
// Recommendation Engine — generates prioritized, actionable
// recommendations from risk assessments, weather & crop calendar.
// ============================================================

import type {
  Recommendation,
  RecommendationPriority,
  RecommendationType,
  DailyPlan,
  WeeklyPlan,
  RiskDashboard,
  WeatherData,
  ActiveCrop,
  RiskAssessment,
  CropCalendarEntry,
} from '../types/index.js';
import { computeRiskDashboard } from './risk-engine.js';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Create a unique recommendation ID. */
export function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** ISO timestamp for "now". */
function nowISO(): string {
  return new Date().toISOString();
}

/** Hours-from-now ISO string. */
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 36e5).toISOString();
}

/** Map a risk score (0-100) to a recommendation priority. */
function scoreToPriority(score: number): RecommendationPriority {
  if (score > 75) return 'urgent';
  if (score > 50) return 'high';
  if (score > 30) return 'medium';
  return 'low';
}

/** Today's date string (YYYY-MM-DD). */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Find a risk assessment by category. */
function findRisk(risks: RiskAssessment[], category: string): RiskAssessment | undefined {
  return risks.find((r) => r.category === category);
}

/** Get the current growth stage's crop operation matching a given type. */
function findOperation(
  calendar: CropCalendarEntry[],
  opType: string,
): CropCalendarEntry['tasks'][number] | undefined {
  for (const entry of calendar) {
    const match = entry.tasks.find((t) => t.type === opType);
    if (match) return match;
  }
  return undefined;
}

// ────────────────────────────────────────────────────────────
// Recommendation Builders
// ────────────────────────────────────────────────────────────

function buildIrrigationRec(
  weather: WeatherData,
  crops: ActiveCrop[],
  risks: RiskAssessment[],
): Recommendation | null {
  const risk = findRisk(risks, 'irrigation');
  if (!risk || risk.score < 20) return null;

  const deficit = weather.agriculturalIndices.soilMoistureDeficit;
  const stage = crops[0]?.config.growthStages.find((s) => s.id === crops[0]?.currentStage);
  const waterReq = stage?.waterRequirementMm ?? 5;
  const priority = scoreToPriority(risk.score);
  const isUrgent = priority === 'urgent';
  const cropName = crops[0]?.config.name ?? 'crop';
  const cropNameBn = crops[0]?.config.nameBn ?? 'ফসল';

  return {
    id: generateId(),
    type: 'irrigation',
    priority,
    title: `Apply Irrigation${isUrgent ? ' Today' : ' Within 48 Hours'}`,
    titleBn: isUrgent ? 'আজ সেচ প্রয়োগ করুন' : '৪৮ ঘন্টার মধ্যে সেচ প্রয়োগ করুন',
    description: `Soil moisture deficit is ${deficit.toFixed(1)} mm. ${cropName} at ${stage?.name ?? 'current stage'} requires ~${waterReq} mm/day. Irrigate immediately to prevent yield loss.`,
    descriptionBn: `মাটির আর্দ্রতার ঘাটতি ${deficit.toFixed(1)} মিমি। ${cropNameBn} এর ${stage?.nameBn ?? 'বর্তমান পর্যায়'}-এ প্রতিদিন ~${waterReq} মিমি পানি প্রয়োজন। ফসলের ক্ষতি রোধে এখনই সেচ দিন।`,
    reason: `ET₀ deficit of ${weather.agriculturalIndices.et0.toFixed(1)} mm combined with low soil moisture signals critical water stress for ${cropName}.`,
    reasonBn: `${weather.agriculturalIndices.et0.toFixed(1)} মিমি ET₀ ঘাটতি এবং কম মাটির আর্দ্রতা ${cropNameBn}-এ গুরুতর পানি চাপের ইঙ্গিত দেয়।`,
    evidence: risk.evidence,
    confidence: risk.confidence,
    alternativeActions: [
      {
        action: 'Use drip irrigation to reduce water usage by 30%',
        actionBn: 'পানি সাশ্রয়ে ৩০% কম ব্যবহারে ড্রিপ সেচ ব্যবহার করুন',
        pros: ['Water efficient', 'Precise delivery'],
        cons: ['Requires setup', 'Higher initial cost'],
        effectiveness: 85,
      },
      {
        action: 'Apply light evening irrigation to reduce evaporation',
        actionBn: 'বাষ্পীভবন কমাতে সন্ধ্যায় হালকা সেচ দিন',
        pros: ['Lower evaporation loss', 'Easy to implement'],
        cons: ['Less precise', 'Possible fungal risk'],
        effectiveness: 70,
      },
    ],
    expectedOutcome: `Maintain optimal soil moisture for ${cropName}, preventing 5-15% yield loss from water stress.`,
    expectedOutcomeBn: `${cropNameBn}-এর জন্য সর্বোত্তম মাটির আর্দ্রতা বজায় রাখা হবে, পানি চাপে ৫-১৫% ফলন ক্ষতি প্রতিরোধ হবে।`,
    expectedYieldImpact: 12,
    costSavingEstimate: 2500,
    windowStart: isUrgent ? nowISO() : hoursFromNow(12),
    windowEnd: isUrgent ? hoursFromNow(24) : hoursFromNow(48),
    ignoreConsequence: `Ignoring will cause progressive water stress, reducing ${cropName} yield by up to 15% and grain quality significantly.`,
    ignoreConsequenceBn: `অবহেলা করলে ক্রমবর্ধমান পানি চাপ তৈরি হবে, ${cropNameBn} ফলন ১৫% পর্যন্ত কমে যেতে পারে এবং শস্যের গুণমান উল্লেখযোগ্যভাবে হ্রাস পাবে।`,
    relatedRisk: 'irrigation',
    relatedCropStage: crops[0]?.currentStage ?? null,
  };
}

function buildSprayRec(
  weather: WeatherData,
  crops: ActiveCrop[],
  risks: RiskAssessment[],
  calendar: CropCalendarEntry[],
): Recommendation | null {
  const diseaseRisk = findRisk(risks, 'disease');
  const sprayRisk = findRisk(risks, 'spray_window');
  const score = Math.max(diseaseRisk?.score ?? 0, sprayRisk?.score ?? 0);
  if (score < 25) return null;

  const priority = scoreToPriority(score);
  const cropName = crops[0]?.config.name ?? 'crop';
  const cropNameBn = crops[0]?.config.nameBn ?? 'ফসল';
  const windNow = weather.current.windSpeed;
  const humidity = weather.current.humidity;
  const sprayOp = findOperation(calendar, 'pesticide');

  return {
    id: generateId(),
    type: 'spray',
    priority,
    title: 'Apply Fungicide Spray',
    titleBn: 'ছত্রাকনাশক স্প্রে প্রয়োগ করুন',
    description: `Disease risk elevated to ${score}/100 with leaf wetness at ${weather.agriculturalIndices.leafWetnessHours}h and humidity ${humidity}%. Wind is ${windNow} km/h — ${windNow < 12 ? 'suitable for spraying' : 'wait for calmer conditions'}.`,
    descriptionBn: `রোগের ঝুঁকি ${score}/100 পর্যন্ত বেড়েছে, পাতার ভেজা থাকার সময় ${weather.agriculturalIndices.leafWetnessHours} ঘন্টা এবং আর্দ্রতা ${humidity}%। বাতাসের গতি ${windNow} কিমি/ঘণ্টা — ${windNow < 12 ? 'স্প্রে করার জন্য উপযুক্ত' : 'শান্ত পরিস্থিতির জন্য অপেক্ষা করুন'}।`,
    reason: `High humidity and leaf wetness favor fungal infection during ${cropName}'s susceptible growth stage.`,
    reasonBn: `উচ্চ আর্দ্রতা এবং পাতার ভেজা থাকা ${cropNameBn}-এর সংবেদনশীল বৃদ্ধি পর্যায়ে ছত্রাক সংক্রমণের অনুকূল পরিবেশ তৈরি করে।`,
    evidence: [...(diseaseRisk?.evidence ?? []), ...(sprayRisk?.evidence ?? [])],
    confidence: diseaseRisk?.confidence ?? sprayRisk?.confidence ?? 60,
    alternativeActions: [
      {
        action: 'Apply preventive bio-fungicide (Trichoderma)',
        actionBn: 'প্রতিরোধমূলক বায়ো-ফাঙ্গাসাইড (ট্রাইকোডারমা) প্রয়োগ করুন',
        pros: ['Organic', 'Low toxicity', 'Resistance builder'],
        cons: ['Slower action', 'May need repeat applications'],
        effectiveness: 65,
      },
      {
        action: 'Delay spray until wind drops below 10 km/h',
        actionBn: 'বাতাস ১০ কিমি/ঘণ্টার নিচে নামলে স্প্রে বিলম্ব করুন',
        pros: ['Better coverage', 'Less drift'],
        cons: ['Disease may advance', 'Narrower window'],
        effectiveness: 55,
      },
    ],
    expectedOutcome: `Fungal infection prevented or controlled, protecting ${cropName} yield potential by 8-20%.`,
    expectedOutcomeBn: `ছত্রাক সংক্রমণ প্রতিরোধ বা নিয়ন্ত্রণ করা হবে, ${cropNameBn} ফলনের সম্ভাবনা ৮-২০% রক্ষা করা হবে।`,
    expectedYieldImpact: 15,
    costSavingEstimate: 3500,
    windowStart: priority === 'urgent' ? nowISO() : hoursFromNow(6),
    windowEnd: priority === 'urgent' ? hoursFromNow(24) : hoursFromNow(48),
    ignoreConsequence: `Disease could spread rapidly under current conditions, causing 15-30% yield loss and requiring expensive curative treatment later.`,
    ignoreConsequenceBn: `বর্তমান অবস্থায় রোগ দ্রুত ছড়িয়ে পড়তে পারে, ১৫-৩০% ফলন ক্ষতি হতে পারে এবং পরে ব্যয়বহুল নিরাময়মূলক চিকিৎসা প্রয়োজন হবে।`,
    relatedRisk: 'disease',
    relatedCropStage: crops[0]?.currentStage ?? null,
  };
}

function buildHarvestRec(
  weather: WeatherData,
  crops: ActiveCrop[],
  risks: RiskAssessment[],
): Recommendation | null {
  const risk = findRisk(risks, 'harvest');
  if (!risk || risk.score < 30) return null;

  const harvestCrops = crops.filter((c) => c.currentStage === 'ripening' || c.currentStage === 'harvest');
  if (harvestCrops.length === 0) return null;

  const crop = harvestCrops[0];
  const priority = scoreToPriority(risk.score);
  const precipProb = weather.daily[0]?.precipitationProbabilityMax ?? 0;

  return {
    id: generateId(),
    type: 'harvest',
    priority,
    title: priority === 'urgent' ? 'Harvest Immediately — Rain Expected' : 'Plan Harvest Tomorrow',
    titleBn: priority === 'urgent' ? 'দ্রুত ফসল কাটুন — বৃষ্টির পূর্বাভাস' : 'আগামীকাল ফসল কাটার পরিকল্পনা করুন',
    description: `${crop.config.name} is at ${crop.currentStage} stage. Precipitation probability in the next 24h is ${precipProb}%. Delaying harvest risks grain spoilage and lodging.`,
    descriptionBn: `${crop.config.nameBn} এর ${crop.currentStage} পর্যায়ে আছে। পরবর্তী ২৪ ঘন্টায় বৃষ্টির সম্ভাবনা ${precipProb}%। ফসল কাটতে বিলম্ব করলে শস্য নষ্ট হওয়া এবং লজিং-এর ঝুঁকি আছে।`,
    reason: `Impending rain with ${precipProb}% probability threatens ripe ${crop.config.name}. Harvest window is closing.`,
    reasonBn: `${precipProb}% সম্ভাবনাসহ আসন্ন বৃষ্টি পাকা ${crop.config.nameBn}-কে হুমকির মুখে ফেলছে। ফসল কাটার সময় কমে আসছে।`,
    evidence: risk.evidence,
    confidence: risk.confidence,
    alternativeActions: [
      {
        action: 'Harvest partial area now, rest later if weather clears',
        actionBn: 'এখন আংশিক এলাকার ফসল কাটুন, আবহাওয়া পরিষ্কার হলে বাকিটা পরে',
        pros: ['Reduces total loss', 'Flexible'],
        cons: ['Incomplete harvest', 'Two passes needed'],
        effectiveness: 75,
      },
      {
        action: 'Cover standing crop with tarpaulins if available',
        actionBn: 'দাঁড়ানো ফসল টারপলিন দিয়ে ঢেকে রাখুন যদি থাকে',
        pros: ['Protects grain', 'Buys time'],
        cons: ['Labor intensive', 'May not fully prevent damage'],
        effectiveness: 50,
      },
    ],
    expectedOutcome: `${crop.config.name} harvested safely before rain, preserving grain quality and 10-25% of yield.`,
    expectedOutcomeBn: `${crop.config.nameBn} বৃষ্টির আগে নিরাপদে কাটা হবে, শস্যের গুণমান এবং ১০-২৫% ফলন সংরক্ষিত থাকবে।`,
    expectedYieldImpact: 20,
    costSavingEstimate: 5000,
    windowStart: priority === 'urgent' ? nowISO() : hoursFromNow(12),
    windowEnd: priority === 'urgent' ? hoursFromNow(12) : hoursFromNow(36),
    ignoreConsequence: `Rain on ripe grain causes sprouting, discoloration, and fungal growth — market price can drop 30-50%.`,
    ignoreConsequenceBn: `পাকা শস্যে বৃষ্টি হলে অঙ্কুরোদ্গম, বর্ণহানি এবং ছত্রাক সৃষ্টি হয় — বাজার মূল্য ৩০-৫০% কমে যেতে পারে।`,
    relatedRisk: 'harvest',
    relatedCropStage: crop.currentStage,
  };
}

function buildProtectionRec(
  weather: WeatherData,
  crops: ActiveCrop[],
  risks: RiskAssessment[],
): Recommendation | null {
  const heatRisk = findRisk(risks, 'heat_stress');
  const coldRisk = findRisk(risks, 'cold_stress');
  const windRisk = findRisk(risks, 'wind_damage');
  const risk = heatRisk ?? coldRisk ?? windRisk;
  if (!risk || risk.score < 30) return null;

  const priority = scoreToPriority(risk.score);
  const cropName = crops[0]?.config.name ?? 'crop';
  const cropNameBn = crops[0]?.config.nameBn ?? 'ফসল';
  const category = risk.category;
  const temp = weather.current.temperature;

  const titlesEN: Record<string, string> = {
    heat_stress: 'Protect Crops from Extreme Heat',
    cold_stress: 'Protect Crops from Cold Stress',
    wind_damage: 'Secure Crops Against Wind Damage',
  };
  const titlesBN: Record<string, string> = {
    heat_stress: 'ফসল তাপ প্রবাহ থেকে রক্ষা করুন',
    cold_stress: 'ফসল শীতল চাপ থেকে রক্ষা করুন',
    wind_damage: 'বাতাসের ক্ষয়ক্ষতি থেকে ফসল সুরক্ষিত করুন',
  };

  return {
    id: generateId(),
    type: 'protection',
    priority,
    title: titlesEN[category] ?? 'Protect Crops from Extreme Weather',
    titleBn: titlesBN[category] ?? 'চরম আবহাওয়া থেকে ফসল রক্ষা করুন',
    description: `${category === 'heat_stress' ? `Temperature at ${temp}°C exceeds stress threshold` : category === 'cold_stress' ? `Temperature dropped to ${temp}°C, approaching cold stress` : `Wind gusts at ${weather.current.windGusts} km/h risk crop damage`}. Immediate protective measures recommended for ${cropName}.`,
    descriptionBn: `${category === 'heat_stress' ? `তাপমাত্রা ${temp}°C-তে চাপের সীমা অতিক্রম করেছে` : category === 'cold_stress' ? `তাপমাত্রা ${temp}°C-এ নেমে এসেছে, শীতল চাপের কাছাকাছি` : `বাতাসের ঝোড়ো ${weather.current.windGusts} কিমি/ঘণ্টায় ফসলের ক্ষতির ঝুঁকি`}. ${cropNameBn}-এর জন্য অবিলম্বে সুরক্ষামূলক ব্যবস্থা গ্রহণ করুন।`,
    reason: `Extreme weather event (${category}) detected with risk score ${risk.score}/100 for current crop stages.`,
    reasonBn: `চরম আবহাওয়ার ঘটনা (${category}) সনাক্ত হয়েছে, বর্তমান ফসলের পর্যায়ে ঝুঁকির স্কোর ${risk.score}/100।`,
    evidence: risk.evidence,
    confidence: risk.confidence,
    alternativeActions: [
      {
        action: 'Apply mulching to regulate soil temperature',
        actionBn: 'মাটির তাপমাত্রা নিয়ন্ত্রণে মালচিং প্রয়োগ করুন',
        pros: ['Improves soil moisture', 'Reduces temperature fluctuation'],
        cons: ['Labor cost', 'Material needed'],
        effectiveness: 70,
      },
      {
        action: 'Install temporary shade nets or windbreaks',
        actionBn: 'অস্থায়ী ছায়া জাল বা বাতাসরোধী বাড়ি স্থাপন করুন',
        pros: ['Direct protection', 'Reusable'],
        cons: ['Installation effort', 'Cost'],
        effectiveness: 80,
      },
    ],
    expectedOutcome: `Reduce ${category.replace('_', ' ')} impact on ${cropName}, preserving 5-18% of potential yield.`,
    expectedOutcomeBn: `${cropNameBn}-এ ${category.replace('_', ' ')} প্রভাব হ্রাস করা হবে, ৫-১৮% সম্ভাব্য ফলন সংরক্ষিত থাকবে।`,
    expectedYieldImpact: 12,
    costSavingEstimate: 2000,
    windowStart: nowISO(),
    windowEnd: hoursFromNow(priority === 'urgent' ? 12 : 48),
    ignoreConsequence: `Unprotected exposure could cause irreversible damage to flowers, grains, or plant structure, reducing yield and quality.`,
    ignoreConsequenceBn: `অরক্ষিত এক্সপোজার ফুল, শস্য বা উদ্ভিদ কাঠামোর অপূরণীয় ক্ষতি করতে পারে, ফলন এবং গুণমান হ্রাস পাবে।`,
    relatedRisk: category as RiskAssessment['category'],
    relatedCropStage: crops[0]?.currentStage ?? null,
  };
}

function buildDrainageRec(
  weather: WeatherData,
  risks: RiskAssessment[],
): Recommendation | null {
  const waterlogRisk = findRisk(risks, 'waterlogging');
  const floodRisk = findRisk(risks, 'flood');
  const risk = waterlogRisk ?? floodRisk;
  if (!risk || risk.score < 30) return null;

  const priority = scoreToPriority(risk.score);
  const precipSum = weather.daily[0]?.precipitationSum ?? 0;

  return {
    id: generateId(),
    type: 'drainage',
    priority,
    title: 'Clear Drainage Channels Immediately',
    titleBn: 'অবিলম্বে নিষ্কাশন নালা পরিষ্কার করুন',
    description: `Waterlogging/flood risk at ${risk.score}/100. Expected precipitation: ${precipSum} mm in next 24h. Soil moisture is already elevated.`,
    descriptionBn: `জলাবদ্ধতা/বন্যার ঝুঁকি ${risk.score}/100। পরবর্তী ২৪ ঘন্টায় প্রত্যাশিত বৃষ্টিপাত: ${precipSum} মিমি। মাটির আর্দ্রতা ইতিমধ্যেই বেশি।`,
    reason: `Saturated soil and forecast rainfall create standing water risk that can drown root systems within 24-48 hours.`,
    reasonBn: `পূর্ণ সংযত মাটি এবং বৃষ্টির পূর্বাভাস ২৪-৪৮ ঘন্টার মধ্যে দাঁড়ানো পানির ঝুঁকি তৈরি করে যা মূল ব্যবস্থা ডুবিয়ে দিতে পারে।`,
    evidence: risk.evidence,
    confidence: risk.confidence,
    alternativeActions: [
      {
        action: 'Create temporary furrows to channel excess water',
        actionBn: 'অতিরিক্ত পানি সরাতে অস্থায়ী নালা তৈরি করুন',
        pros: ['Quick implementation', 'Low cost'],
        cons: ['May not handle heavy flood', 'Labor needed'],
        effectiveness: 60,
      },
    ],
    expectedOutcome: 'Prevent waterlogging damage, saving 10-30% of yield in low-lying areas.',
    expectedOutcomeBn: 'জলাবদ্ধতার ক্ষয়ক্ষতি প্রতিরোধ করা হবে, নিচু এলাকায় ১০-৩০% ফলন সংরক্ষিত থাকবে।',
    expectedYieldImpact: 20,
    costSavingEstimate: 4000,
    windowStart: nowISO(),
    windowEnd: hoursFromNow(priority === 'urgent' ? 6 : 24),
    ignoreConsequence: 'Standing water for >24h causes root asphyxiation, nutrient leaching, and promotes root rot diseases.',
    ignoreConsequenceBn: '২৪ ঘন্টার বেশি দাঁড়ানো পানি মূলে শ্বাসরোধ, পুষ্টি ক্ষয় এবং মূল পচা রোগ সৃষ্টি করে।',
    relatedRisk: risk.category,
    relatedCropStage: null,
  };
}

function buildFertilizerRec(
  crops: ActiveCrop[],
  calendar: CropCalendarEntry[],
  risks: RiskAssessment[],
): Recommendation | null {
  const fertOp = findOperation(calendar, 'fertilizer');
  const nutrientRisk = findRisk(risks, 'nutrient_loss');
  const score = fertOp ? Math.max(nutrientRisk?.score ?? 0, fertOp.priority === 'critical' ? 70 : fertOp.priority === 'high' ? 55 : 35) : 0;
  if (score < 25) return null;

  const priority = scoreToPriority(score);
  const cropName = crops[0]?.config.name ?? 'crop';
  const cropNameBn = crops[0]?.config.nameBn ?? 'ফসল';
  const stage = crops[0]?.config.growthStages.find((s) => s.id === crops[0]?.currentStage);

  return {
    id: generateId(),
    type: 'fertilizer',
    priority,
    title: `Apply ${fertOp?.name ?? 'Recommended'} Fertilizer`,
    titleBn: `${fertOp?.nameBn ?? 'প্রস্তাবিত'} সার প্রয়োগ করুন`,
    description: `${cropName} at ${stage?.name ?? 'current stage'} stage requires fertilizer application. ${nutrientRisk ? `Nutrient loss risk at ${nutrientRisk.score}/100 due to weather conditions.` : 'Current growth stage demands timely nutrient supply.'}`,
    descriptionBn: `${stage?.nameBn ?? 'বর্তমান পর্যায়'} পর্যায়ে ${cropNameBn}-এ সার প্রয়োগ প্রয়োজন। ${nutrientRisk ? `আবহাওয়ার কারণে পুষ্টি ক্ষয়ের ঝুঁকি ${nutrientRisk.score}/100।` : 'বর্তমান বৃদ্ধি পর্যায়ে সময়মত পুষ্টি সরবরাহ প্রয়োজন।'}`,
    reason: `${cropName} crop calendar indicates fertilizer application is due at the ${stage?.name ?? 'current'} stage for optimal growth.`,
    reasonBn: `${cropNameBn} ফসল ক্যালেন্ডারে ${stage?.nameBn ?? 'বর্তমান'} পর্যায়ে সার প্রয়োগের সময় নির্দেশ করা হয়েছে।`,
    evidence: nutrientRisk?.evidence ?? [fertOp?.description ?? 'Crop stage operation scheduled'],
    confidence: nutrientRisk?.confidence ?? 75,
    alternativeActions: [
      {
        action: 'Apply foliar spray for quicker nutrient uptake',
        actionBn: 'দ্রুত পুষ্টি গ্রহণের জন্য পাতায় স্প্রে প্রয়োগ করুন',
        pros: ['Fast absorption', 'Lower quantity needed'],
        cons: ['Temporary effect', 'More frequent application'],
        effectiveness: 72,
      },
    ],
    expectedOutcome: `Optimal nutrient supply at ${stage?.name ?? 'current'} stage boosts ${cropName} yield potential by 5-12%.`,
    expectedOutcomeBn: `${stage?.nameBn ?? 'বর্তমান'} পর্যায়ে সর্বোত্তম পুষ্টি সরবরাহ ${cropNameBn} ফলনের সম্ভাবনা ৫-১২% বাড়ায়।`,
    expectedYieldImpact: 10,
    costSavingEstimate: 1800,
    windowStart: priority === 'urgent' ? nowISO() : hoursFromNow(12),
    windowEnd: hoursFromNow(priority === 'urgent' ? 24 : 72),
    ignoreConsequence: `Delayed fertilization at ${stage?.name ?? 'this stage'} causes stunted growth, lower tiller count, and reduced grain filling.`,
    ignoreConsequenceBn: `${stage?.nameBn ?? 'এই পর্যায়ে'} সার প্রয়োগ বিলম্বিত হলে বৃদ্ধি কমে যায়, কম কুশি সংখ্যা এবং কম শস্য ভরাট হয়।`,
    relatedRisk: nutrientRisk?.category ?? null,
    relatedCropStage: crops[0]?.currentStage ?? null,
  };
}

function buildMonitoringRec(
  weather: WeatherData,
  risks: RiskAssessment[],
): Recommendation | null {
  const moderateRisks = risks.filter((r) => r.score >= 20 && r.score <= 60);
  if (moderateRisks.length === 0) return null;

  const topModerate = moderateRisks.sort((a, b) => b.score - a.score)[0];
  const categoryLabel = topModerate.category.replace(/_/g, ' ');
  const vpds = weather.agriculturalIndices.vaporPressureDeficit;

  return {
    id: generateId(),
    type: 'monitoring',
    priority: 'medium',
    title: `Monitor ${categoryLabel} Conditions Closely`,
    titleBn: `${categoryLabel} অবস্থা ঘনিষ্ঠভাবে পর্যবেক্ষণ করুন`,
    description: `${categoryLabel} risk is at ${topModerate.score}/100 — not yet critical but trending. VPD at ${vpds.toFixed(1)} kPa. Continue monitoring for 48h before taking action.`,
    descriptionBn: `${categoryLabel} ঝুঁকি ${topModerate.score}/100-এ আছে — এখনও সমালোচনামূলক নয় কিন্তু বাড়ছে। VPD ${vpds.toFixed(1)} কেপিএ-তে। ব্যবস্থা নেওয়ার আগে ৪৮ ঘন্টা পর্যবেক্ষণ চালিয়ে যান।`,
    reason: `Early detection allows preventive action at lower cost. ${topModerate.explanation}`,
    reasonBn: `প্রাথমিক সনাক্তকরণ কম খরচে প্রতিরোধমূলক ব্যবস্থা নিতে দেয়। ${topModerate.explanationBn}`,
    evidence: topModerate.evidence,
    confidence: topModerate.confidence,
    alternativeActions: [
      {
        action: 'Set up field scouting every 12 hours',
        actionBn: 'প্রতি ১২ ঘন্টায় মাঠ পরিদর্শন ব্যবস্থা করুন',
        pros: ['Early symptom detection', 'Low cost'],
        cons: ['Labor intensive', 'Subjective assessment'],
        effectiveness: 60,
      },
    ],
    expectedOutcome: `Early intervention if conditions worsen, potentially saving 5-10% yield at minimal cost.`,
    expectedOutcomeBn: `পরিস্থিতি খারাপ হলে প্রাথমিক হস্তক্ষেপ, ন্যূনতম খরচে ৫-১০% ফলন সাশ্রয় সম্ভব।`,
    expectedYieldImpact: 7,
    costSavingEstimate: 500,
    windowStart: nowISO(),
    windowEnd: hoursFromNow(48),
    ignoreConsequence: 'Risk may escalate silently. Late response costs 3-5x more than early preventive action.',
    ignoreConsequenceBn: 'ঝুঁকি নীরবে বাড়তে পারে। বিলম্বিত প্রতিক্রিয়ার খরচ প্রাথমিক প্রতিরোধমূলক ব্যবস্থার চেয়ে ৩-৫ গুণ বেশি।',
    relatedRisk: topModerate.category,
    relatedCropStage: null,
  };
}

// ────────────────────────────────────────────────────────────
// Main Exports
// ────────────────────────────────────────────────────────────

/**
 * Generate 5–12 prioritized recommendations from risk, weather, and
 * crop calendar data.
 */
export function generateRecommendations(
  weather: WeatherData,
  activeCrops: ActiveCrop[],
  risks: RiskDashboard,
  calendar: CropCalendarEntry[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const riskList = risks.risks;

  // --- Build candidate recommendations ---
  const irrigation = buildIrrigationRec(weather, activeCrops, riskList);
  if (irrigation) recs.push(irrigation);

  const spray = buildSprayRec(weather, activeCrops, riskList, calendar);
  if (spray) recs.push(spray);

  const harvest = buildHarvestRec(weather, activeCrops, riskList);
  if (harvest) recs.push(harvest);

  const protection = buildProtectionRec(weather, activeCrops, riskList);
  if (protection) recs.push(protection);

  const drainage = buildDrainageRec(weather, riskList);
  if (drainage) recs.push(drainage);

  const fertilizer = buildFertilizerRec(activeCrops, calendar, riskList);
  if (fertilizer) recs.push(fertilizer);

  const monitoring = buildMonitoringRec(weather, riskList);
  if (monitoring) recs.push(monitoring);

  // --- Sort by priority (urgent first), then confidence descending ---
  const priorityOrder: Record<RecommendationPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  recs.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.confidence - a.confidence;
  });

  // --- Ensure 5–12 recommendations ---
  if (recs.length < 5 && activeCrops.length > 0) {
    const crop = activeCrops[0];
    const stage = crop.config.growthStages.find((s) => s.id === crop.currentStage);
    recs.push({
      id: generateId(),
      type: 'monitoring',
      priority: 'low',
      title: 'Continue Regular Field Monitoring',
      titleBn: 'নিয়মিত মাঠ পর্যবেক্ষণ চালিয়ে যান',
      description: `No critical risks detected for ${crop.config.name} at ${stage?.name ?? 'current stage'}. Maintain regular observation schedule.`,
      descriptionBn: `${stage?.nameBn ?? 'বর্তমান পর্যায়ে'} ${crop.config.nameBn}-এ কোনো সমালোচনামূলক ঝুঁকি সনাক্ত হয়নি। নিয়মিত পর্যবেক্ষণ চালিয়ে যান।`,
      reason: 'Routine monitoring ensures early detection of any emerging issues.',
      reasonBn: 'নিয়মিত পর্যবেক্ষণ যেকোনো নতুন সমস্যার প্রাথমিক সনাক্তকরণ নিশ্চিত করে।',
      evidence: ['Overall risk score is within acceptable range'],
      confidence: 80,
      alternativeActions: [],
      expectedOutcome: 'Maintain crop health through proactive observation.',
      expectedOutcomeBn: 'সক্রিয় পর্যবেক্ষণের মাধ্যমে ফসলের স্বাস্থ্য বজায় রাখুন।',
      expectedYieldImpact: 3,
      costSavingEstimate: 200,
      windowStart: nowISO(),
      windowEnd: hoursFromNow(72),
      ignoreConsequence: 'Skipping monitoring risks missing early warning signs of pest or disease outbreaks.',
      ignoreConsequenceBn: 'পর্যবেক্ষণ এড়ালে পোকামাকড় বা রোগ প্রাদুর্ভাবের প্রাথমিক সতর্কতা মিস হতে পারে।',
      relatedRisk: null,
      relatedCropStage: crop.currentStage,
    });
  }

  return recs.slice(0, 12);
}

/**
 * Generate a daily plan for today, filtering recommendations that
 * fall within today's action window.
 */
export function generateDailyPlan(
  weather: WeatherData,
  recommendations: Recommendation[],
): DailyPlan {
  const today = todayStr();
  const todayRecs = recommendations.filter((r) => {
    const start = new Date(r.windowStart);
    const end = new Date(r.windowEnd);
    const now = new Date();
    // Include recs whose window overlaps with the next 24 hours
    return start <= new Date(now.getTime() + 24 * 36e5) && end >= now;
  });

  const temp = weather.current.temperature;
  const precip = weather.current.precipitationProbability;
  const weatherNote = `Today: ${temp}°C, ${precip}% rain chance. Wind ${weather.current.windSpeed} km/h. ET₀ ${weather.agriculturalIndices.et0.toFixed(1)} mm.`;
  const weatherNoteBn = `আজ: ${temp}°C, বৃষ্টির সম্ভাবনা ${precip}%। বাতাস ${weather.current.windSpeed} কিমি/ঘণ্টা। ET₀ ${weather.agriculturalIndices.et0.toFixed(1)} মিমি।`;

  return {
    date: today,
    priorities: todayRecs,
    completedTasks: [],
    weatherNote,
    weatherNoteBn,
  };
}

/**
 * Generate a 7-day weekly plan identifying the best spray, irrigation,
 * fertilizer, and harvest windows from the hourly forecast.
 */
export function generateWeeklyPlan(
  weather: WeatherData,
  recommendations: Recommendation[],
  risks: RiskDashboard,
): WeeklyPlan {
  const hourly = weather.hourly;
  const now = new Date();

  // Compute week range
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // --- Find best 24-48h window for a given condition ---
  function findBestWindow(
    filter: (h: (typeof hourly)[number]) => boolean,
    minConsecutiveHours: number,
  ): { start: string; end: string; confidence: number } | null {
    let bestStart = -1;
    let bestLen = 0;

    for (let i = 0; i < hourly.length; i++) {
      if (!filter(hourly[i])) continue;
      // Count consecutive qualifying hours from i
      let len = 0;
      for (let j = i; j < hourly.length && filter(hourly[j]); j++) {
        len++;
      }
      if (len > bestLen) {
        bestLen = len;
        bestStart = i;
      }
      i += len; // skip ahead
    }

    if (bestLen < minConsecutiveHours || bestStart < 0) return null;

    const windowHours = Math.min(bestLen, 48);
    return {
      start: hourly[bestStart].time,
      end: hourly[bestStart + windowHours - 1].time,
      confidence: Math.min(95, 50 + bestLen * 2),
    };
  }

  // Best spray window: dry, low wind (< 12 km/h), no rain
  const sprayWindow = findBestWindow(
    (h) => h.precipitationProbability < 20 && h.windSpeed < 12 && h.humidity < 85,
    6,
  );

  // Best irrigation window: low wind, low ET₀ period (evening/night preferred)
  const irrigationWindow = findBestWindow(
    (h) => h.windSpeed < 15 && h.precipitationProbability < 30,
    8,
  );

  // Best fertilizer window: dry, moderate temp, no heavy rain for 24h+
  const fertilizerWindow = findBestWindow(
    (h) => h.precipitationProbability < 15 && h.temperature > 20 && h.temperature < 35,
    6,
  );

  // Best harvest window: dry, low wind, no rain for 24h+
  const harvestWindow = findBestWindow(
    (h) => h.precipitationProbability < 10 && h.windSpeed < 20,
    12,
  );

  // --- Build daily plans for each day of the week ---
  const days: DailyPlan[] = [];
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + d);
    const dayStr = dayDate.toISOString().slice(0, 10);
    const dayStart = dayDate.getTime();
    const dayEnd = dayStart + 24 * 36e5;

    const dayRecs = recommendations.filter((r) => {
      const rStart = new Date(r.windowStart).getTime();
      const rEnd = new Date(r.windowEnd).getTime();
      return rStart < dayEnd && rEnd > dayStart;
    });

    const dailyData = weather.daily[d];
    const weatherNote = dailyData
      ? `${dayStr}: ${dailyData.tempMin}–${dailyData.tempMax}°C, rain ${dailyData.precipitationProbabilityMax}%. Wind ${dailyData.windSpeedMax} km/h.`
      : `Weather data unavailable for ${dayStr}.`;
    const weatherNoteBn = dailyData
      ? `${dayStr}: ${dailyData.tempMin}–${dailyData.tempMax}°C, বৃষ্টি ${dailyData.precipitationProbabilityMax}%। বাতাস ${dailyData.windSpeedMax} কিমি/ঘণ্টা।`
      : `${dayStr}-এর জন্য আবহাওয়ার তথ্য নেই।`;

    days.push({
      date: dayStr,
      priorities: dayRecs,
      completedTasks: [],
      weatherNote,
      weatherNoteBn,
    });
  }

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    days,
    bestWindows: {
      spray: sprayWindow,
      irrigation: irrigationWindow,
      fertilizer: fertilizerWindow,
      harvest: harvestWindow,
    },
  };
}