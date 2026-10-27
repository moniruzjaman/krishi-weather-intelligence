// ============================================================
// KWI - Krishi Weather Intelligence
// Disease Engine — forecasts crop disease risk based on weather
// conditions, crop growth stage, and known pathogen profiles.
// ============================================================

import type {
  DiseaseForecast,
  DiseaseRiskAssessment,
  DiseaseInfo,
  DiseaseFavorabilityFactor,
  WeatherData,
  ActiveCrop,
  RiskLevel,
  GrowthStageId,
} from '../types/index.js';

// ────────────────────────────────────────────────────────────
// Bangladesh Crop Disease Database
// ────────────────────────────────────────────────────────────

const DISEASES: DiseaseInfo[] = [
  {
    id: 'rice_blast',
    name: 'Rice Blast',
    nameBn: 'ধানের ব্লাস্ট',
    cropIds: ['rice'],
    affectedStages: ['seedling', 'vegetative', 'tillering', 'heading', 'flowering'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '25-30°C', weight: 30 },
      { factor: 'humidity', condition: '>89%', weight: 25 },
      { factor: 'leafWetness', condition: '>8h', weight: 20 },
      { factor: 'precipitation', condition: 'frequent drizzle', weight: 15 },
      { factor: 'cropStage', condition: 'heading/flowering', weight: 10 },
    ],
    symptoms: [
      'Diamond-shaped lesions on leaves',
      'Wilting and drying of leaf tips',
      'Neck rot at panicle base',
      'Spindle-shaped spots with grey centers',
    ],
    symptomsBn: [
      'পাতায় হীরার আকৃতির দাগ',
      'পাতার ডগা শুকিয়ে যাওয়া',
      'শঙ্কুর গোড়ায় ঘাড় পচা',
      'ধূসর কেন্দ্রসহ কাঁচির মত দাগ',
    ],
    preventiveActions: [
      'Use resistant varieties (BRRI dhan47, dhan58)',
      'Avoid excess nitrogen application',
      'Maintain proper plant spacing',
      'Apply Tricyclazole at heading stage',
    ],
    preventiveActionsBn: [
      'রোগ প্রতিরোধী জাত ব্যবহার করুন (ব্রিধান ৪৭, ৫৮)',
      'অতিরিক্ত নাইট্রোজেন সার পরিহার করুন',
      'সঠিক দূরত্বে চারা রোপণ করুন',
      'শির বের হওয়ার সময় ট্রাইসাইক্লাজোল স্প্রে করুন',
    ],
    curativeActions: [
      'Spray Tricyclazole 75WP @ 0.6g/L',
      'Remove and destroy infected plant debris',
      'Apply Potassium silicate as foliar spray',
    ],
    curativeActionsBn: [
      'ট্রাইসাইক্লাজোল ৭৫WP @ ০.৬ গ্রাম/লিটার স্প্রে করুন',
      'আক্রান্ত উদ্ভিদ অপসারণ ও ধ্বংস করুন',
      'পটাশিয়াম সিলিকেট পাতায় স্প্রে করুন',
    ],
    economicThreshold: '5-10% leaf area affected or neck blast symptoms on 1% of panicles',
  },
  {
    id: 'bacterial_leaf_blight',
    name: 'Bacterial Leaf Blight',
    nameBn: 'ব্যাকটেরিয়াল পাতা পোড়া',
    cropIds: ['rice'],
    affectedStages: ['vegetative', 'tillering', 'booting', 'heading'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '27-33°C', weight: 30 },
      { factor: 'humidity', condition: '>85%', weight: 25 },
      { factor: 'leafWetness', condition: '>10h', weight: 20 },
      { factor: 'precipitation', condition: 'heavy rain with wind', weight: 15 },
      { factor: 'cropStage', condition: 'booting/heading', weight: 10 },
    ],
    symptoms: [
      'Water-soaked yellowish stripes along leaf margins',
      'Lesions turn white to yellow as they enlarge',
      'Leaves dry out and wilt from tips',
      'Milky bacterial ooze on leaves in morning',
    ],
    symptomsBn: [
      'পাতার কিনারা বরাবর পানি-ভেজা হলুদ ডোরা',
      'দাগ বড় হলে সাদা থেকে হলুদ হয়',
      'পাতার ডগা থেকে শুকিয়ে যায়',
      'সকালে পাতায় দুগ্ধজাত ব্যাকটেরিয়াল নির্যাস',
    ],
    preventiveActions: [
      'Use BLB-resistant varieties (BRRI dhan54, dhan63)',
      'Avoid clipping of seedling tips during transplanting',
      'Balanced fertilization — avoid excess N',
      'Drain fields during high humidity periods',
    ],
    preventiveActionsBn: [
      'ব্যাকটেরিয়াল পাতা পোড়া প্রতিরোধী জাত ব্যবহার করুন',
      'রোপণের সময় চারার ডগা না কাটা',
      'সুষম সার প্রয়োগ — অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন',
      'উচ্চ আর্দ্রতার সময় ক্ষেত শুকান',
    ],
    curativeActions: [
      'Spray Streptocycline + Copper oxychloride',
      'Remove affected leaves to reduce inoculum',
      'Apply bactericidal spray at 10-day intervals',
    ],
    curativeActionsBn: [
      'স্ট্রেপ্টোসাইক্লিন + কপার অক্সিক্লোরাইড স্প্রে করুন',
      'জীবাণু কমাতে আক্রান্ত পাতা সরান',
      '১০ দিন অন্তর ব্যাকটেরিয়ানাশক স্প্রে করুন',
    ],
    economicThreshold: '10-15% leaf area with lesions during tillering stage',
  },
  {
    id: 'sheath_blight',
    name: 'Sheath Blight',
    nameBn: 'পাতার আবরণ পোড়া',
    cropIds: ['rice'],
    affectedStages: ['tillering', 'stem_elongation', 'booting', 'heading'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '28-32°C', weight: 25 },
      { factor: 'humidity', condition: '>90%', weight: 25 },
      { factor: 'leafWetness', condition: '>12h', weight: 20 },
      { factor: 'precipitation', condition: 'continuous rain', weight: 20 },
      { factor: 'cropStage', condition: 'booting/heading', weight: 10 },
    ],
    symptoms: [
      'Oval greenish-grey lesions on leaf sheaths',
      'Lesions enlarge and coalesce, girdling the stem',
      'White mycelial mat at water level',
      'Infected tillers produce unfilled grains',
    ],
    symptomsBn: [
      'পাতার আবরণে ডিম্বাকৃতি সবুজ-ধূসর দাগ',
      'দাগ বড় হয়ে কাণ্ড পরিবেষ্টন করে',
      'পানির স্তরে সাদা ছত্রাকের আস্তরণ',
      'আক্রান্ত কুলায় অপূর্ণ দানা হয়',
    ],
    preventiveActions: [
      'Avoid dense planting and excess nitrogen',
      'Maintain proper water management — avoid continuous flooding',
      'Use resistant varieties when available',
      'Apply Tricyclazole or Propiconazole preventively',
    ],
    preventiveActionsBn: [
      'ঘন রোপণ ও অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন',
      'সঠিক পানি ব্যবস্থাপনা — অবিরাম প্লাবন এড়ান',
      'সম্ভব হলে প্রতিরোধী জাত ব্যবহার করুন',
      'প্রতিরোধমূলক ট্রাইসাইক্লাজোল বা প্রোপিকোনাজোল প্রয়োগ',
    ],
    curativeActions: [
      'Spray Propiconazole 25EC @ 1ml/L',
      'Remove infected lower leaves',
      'Improve field drainage immediately',
    ],
    curativeActionsBn: [
      'প্রোপিকোনাজোল ২৫ইসি @ ১ মিলি/লিটার স্প্রে করুন',
      'আক্রান্ত নিচের পাতা সরান',
      'অবিলম্বে ক্ষেতের নিকাশ ব্যবস্থা উন্নত করুন',
    ],
    economicThreshold: 'Lesions reaching 2nd-3rd leaf from flag leaf at booting',
  },
  {
    id: 'wheat_rust',
    name: 'Wheat Rust',
    nameBn: 'গমের মরিচা',
    cropIds: ['wheat'],
    affectedStages: ['vegetative', 'stem_elongation', 'heading', 'flowering', 'grain_filling'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '15-25°C', weight: 30 },
      { factor: 'humidity', condition: '>80%', weight: 25 },
      { factor: 'leafWetness', condition: '>6h', weight: 20 },
      { factor: 'precipitation', condition: 'moderate rain/dew', weight: 15 },
      { factor: 'cropStage', condition: 'stem elongation/heading', weight: 10 },
    ],
    symptoms: [
      'Orange-brown pustules on leaves and stems',
      'Yellow stripe patterns on leaf blades',
      'Premature leaf drying',
      'Reduced grain filling and shriveled grains',
    ],
    symptomsBn: [
      'পাতা ও কাণ্ডে কমলা-বাদামি ফুসকুড়ি',
      'পাতায় হলুদ ডোরাকাটা নকশা',
      'অকালে পাতা শুকিয়ে যাওয়া',
      'দানা ভরাট কমে যাওয়া ও রুগ্ন দানা',
    ],
    preventiveActions: [
      'Grow rust-resistant varieties (BARI Gom 24, 27)',
      'Timely sowing within recommended window',
      'Balanced NPK fertilization',
      'Apply Propiconazole at first sign of infection',
    ],
    preventiveActionsBn: [
      'মরিচা প্রতিরোধী জাত চাষ করুন (বারি গম ২৪, ২৭)',
      'সুপারিশকৃত সময়ে সময়মতো বুনন',
      'সুষম এনপিকে সার প্রয়োগ',
      'সংক্রমণের প্রথম লক্ষণে প্রোপিকোনাজোল প্রয়োগ',
    ],
    curativeActions: [
      'Spray Mancozeb 75WP @ 2.5g/L or Propiconazole 25EC @ 1ml/L',
      'Remove heavily infected plants if localized',
      'Increase potassium application for plant vigor',
    ],
    curativeActionsBn: [
      'ম্যাংকোজেব ৭৫WP @ ২.৫ গ্রাম/লিটার অথবা প্রোপিকোনাজোল স্প্রে করুন',
      'স্থানীয়ভাবে ঘন সংক্রমিত গাছ সরান',
      'গাছের শক্তি বাড়াতে পটাশ প্রয়োগ বৃদ্ধি করুন',
    ],
    economicThreshold: '5% leaf area with pustules at flag leaf stage',
  },
  {
    id: 'powdery_mildew',
    name: 'Powdery Mildew',
    nameBn: 'ধুলো ছাতা রোগ',
    cropIds: ['wheat'],
    affectedStages: ['vegetative', 'stem_elongation', 'heading', 'grain_filling'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '15-22°C', weight: 30 },
      { factor: 'humidity', condition: '70-85%', weight: 25 },
      { factor: 'leafWetness', condition: '4-8h', weight: 20 },
      { factor: 'precipitation', condition: 'low rainfall, cloudy days', weight: 15 },
      { factor: 'cropStage', condition: 'heading/grain filling', weight: 10 },
    ],
    symptoms: [
      'White powdery patches on upper leaf surface',
      'Patches enlarge and coalesce covering entire leaf',
      'Leaves turn yellow and die prematurely',
      'Black fruiting bodies appear on older lesions',
    ],
    symptomsBn: [
      'পাতার উপরিভাগে সাদা গুঁড়োর মত দাগ',
      'দাগ বড় হয়ে পুরো পাতা ঢেকে ফেলে',
      'পাতা হলুদ হয়ে অকালে মারা যায়',
      'পুরনো দাগে কালো ফলিঙ্গ বডি দেখা যায়',
    ],
    preventiveActions: [
      'Use tolerant varieties (BARI Gom 26, 28)',
      'Avoid excessive nitrogen — favors lush growth',
      'Maintain adequate plant spacing for air circulation',
      'Apply Sulphur dust or wettable Sulphur preventively',
    ],
    preventiveActionsBn: [
      'সহনশীল জাত ব্যবহার করুন (বারি গম ২৬, ২৮)',
      'অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন',
      'বায়ু চলাচলের জন্য পর্যাপ্ত দূরত্ব রাখুন',
      'প্রতিরোধমূলক সালফার ডাস্ট বা ভেজ্যাবল সালফার প্রয়োগ',
    ],
    curativeActions: [
      'Spray Propiconazole 25EC @ 1ml/L',
      'Apply Dinocap 48EC @ 1ml/L as contact fungicide',
      'Remove severely infected lower leaves',
    ],
    curativeActionsBn: [
      'প্রোপিকোনাজোল ২৫ইসি @ ১ মিলি/লিটার স্প্রে করুন',
      'ডাইনোক্যাপ ৪৮ইসি @ ১ মিলি/লিটার স্প্রে করুন',
      'তীব্রভাবে আক্রান্ত নিচের পাতা সরান',
    ],
    economicThreshold: 'Powdery mildew covering 5% of flag leaf area',
  },
  {
    id: 'jute_stem_rot',
    name: 'Stem Rot',
    nameBn: 'পাটের কাণ্ড পচা',
    cropIds: ['jute'],
    affectedStages: ['vegetative', 'stem_elongation'],
    favorabilityFactors: [
      { factor: 'temperature', condition: '28-35°C', weight: 30 },
      { factor: 'humidity', condition: '>85%', weight: 25 },
      { factor: 'leafWetness', condition: '>10h', weight: 20 },
      { factor: 'precipitation', condition: 'heavy monsoon rain', weight: 15 },
      { factor: 'cropStage', condition: 'vegetative/fiber development', weight: 10 },
    ],
    symptoms: [
      'Brown to black lesions at base of stem',
      'Soft rotting of stem base with foul smell',
      'Yellowing and wilting of lower leaves',
      'Stem becomes weak and may lodge easily',
    ],
    symptomsBn: [
      'কাণ্ডের গোড়ায় বাদামি থেকে কালো দাগ',
      'কাণ্ডের গোড়া নরম পচা ও দুর্গন্ধ',
      'নিচের পাতা হলুদ হয়ে শুকিয়ে যায়',
      'কাণ্ড দুর্বল হয়ে সহজেই হেলে পড়ে',
    ],
    preventiveActions: [
      'Treat seeds with Trichoderma viride before sowing',
      'Avoid waterlogging — ensure proper drainage',
      'Crop rotation with non-host crops',
      'Remove and burn infected plant debris after harvest',
    ],
    preventiveActionsBn: [
      'বুননের আগে ট্রাইকোডার্মা ভিরিডি দিয়ে বীজ শোধন',
      'পানি জমে থাকা এড়ান — সঠিক নিকাশ নিশ্চিত করুন',
      'অ-আশ্রয়কারী ফসলের সাথে ফসল পরিবর্তন',
      'ফসল কাটার পর আক্রান্ত অবশিষ্ট পোড়ান',
    ],
    curativeActions: [
      'Drench with Carbendazim 50WP @ 2g/L at stem base',
      'Improve field drainage immediately',
      'Apply Trichoderma-based bio-fungicide to soil',
    ],
    curativeActionsBn: [
      'কার্বেন্ডাজিম ৫০WP @ ২ গ্রাম/লিটার কাণ্ডের গোড়ায় ঢেলে দিন',
      'অবিলম্বে ক্ষেতের নিকাশ ব্যবস্থা উন্নত করুন',
      'মাটিতে ট্রাইকোডার্মা-ভিত্তিক বায়ো-ফাঙ্গাসাইড প্রয়োগ',
    ],
    economicThreshold: 'Stem rot lesions on >3% of plants at vegetative stage',
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'very_high';
}

/** Parse a temperature range string like "25-30°C" into [min, max]. */
function parseTempRange(condition: string): [number, number] | null {
  const match = condition.match(/(\d+)-(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

/** Calculate temperature score (0-30) based on disease favorability range. */
function scoreTemperature(
  temp: number,
  factors: DiseaseFavorabilityFactor[],
): number {
  for (const f of factors) {
    if (f.factor === 'temperature') {
      const range = parseTempRange(f.condition);
      if (!range) return 0;
      const [min, max] = range;
      const optimal = (min + max) / 2;
      const spread = (max - min) / 2;
      const distance = Math.abs(temp - optimal);
      if (distance <= spread) {
        return Math.round(30 * (1 - distance / spread));
      }
      return 0;
    }
  }
  return 0;
}

/** Calculate humidity score (0-25). Humidity > 80% triggers scoring. */
function scoreHumidity(
  humidity: number,
  factors: DiseaseFavorabilityFactor[],
): number {
  const ff = factors.find((f) => f.factor === 'humidity');
  if (!ff) return 0;
  const match = ff.condition.match(/>(\d+)/);
  if (!match) return 0;
  const threshold = Number(match[1]);
  if (humidity < threshold) return 0;
  const excess = humidity - threshold;
  return Math.round(clamp(25 * (excess / (100 - threshold)), 0, 25));
}

/** Calculate leaf wetness score (0-20). */
function scoreLeafWetness(
  wetnessHours: number,
  factors: DiseaseFavorabilityFactor[],
): number {
  const ff = factors.find((f) => f.factor === 'leafWetness');
  if (!ff) return 0;
  const match = ff.condition.match(/>(\d+)/);
  if (!match) return 0;
  const threshold = Number(match[1]);
  if (wetnessHours < threshold) return 0;
  const excess = wetnessHours - threshold;
  return Math.round(clamp(20 * (excess / 12), 0, 20));
}

/** Calculate precipitation score (0-15). */
function scorePrecipitation(precipMm: number): number {
  if (precipMm <= 0) return 0;
  return Math.round(clamp(15 * (precipMm / 20), 0, 15));
}

/** Calculate crop stage susceptibility score (0-10). */
function scoreCropStage(
  currentStage: GrowthStageId,
  disease: DiseaseInfo,
): number {
  const cropConfig = disease.affectedStages.find((s) => s === currentStage);
  if (!cropConfig) return 0;
  // Later stages are generally more susceptible
  const stageOrder: GrowthStageId[] = [
    'seedling', 'vegetative', 'tillering', 'stem_elongation',
    'booting', 'heading', 'flowering', 'grain_filling',
  ];
  const idx = stageOrder.indexOf(currentStage);
  if (idx < 0) return 2;
  return Math.round(clamp(2 + idx * 1.1, 0, 10));
}

// ────────────────────────────────────────────────────────────
// Main Forecast Function
// ────────────────────────────────────────────────────────────

export function generateDiseaseForecast(
  weather: WeatherData,
  activeCrops: ActiveCrop[],
): DiseaseForecast {
  const activeCropIds = new Set(activeCrops.map((c) => c.cropId));
  const relevantDiseases = DISEASES.filter((d) =>
    d.cropIds.some((cid) => activeCropIds.has(cid)),
  );

  const assessments: DiseaseRiskAssessment[] = relevantDiseases.map(
    (disease) => {
      // Find matching active crops for this disease
      const matchingCrops = activeCrops.filter((c) =>
        disease.cropIds.includes(c.cropId),
      );

      // Calculate max scores across all matching crop instances
      let maxRisk = 0;
      const allContributing: string[] = [];

      for (const crop of matchingCrops) {
        const tempScore = scoreTemperature(
          weather.current.temperature,
          disease.favorabilityFactors,
        );
        const humidityScore = scoreHumidity(
          weather.current.humidity,
          disease.favorabilityFactors,
        );
        const leafWetnessScore = scoreLeafWetness(
          weather.agriculturalIndices.leafWetnessHours,
          disease.favorabilityFactors,
        );
        const precipScore = scorePrecipitation(weather.current.precipitation);
        const stageScore = scoreCropStage(crop.currentStage, disease);

        const cropRisk = tempScore + humidityScore + leafWetnessScore + precipScore + stageScore;

        if (cropRisk > maxRisk) {
          maxRisk = cropRisk;
          if (tempScore > 10) allContributing.push(`Temperature ${weather.current.temperature}°C favors ${disease.name}`);
          if (humidityScore > 10) allContributing.push(`High humidity ${weather.current.humidity}% promotes spread`);
          if (leafWetnessScore > 8) allContributing.push(`Leaf wetness ${weather.agriculturalIndices.leafWetnessHours}h supports infection`);
          if (precipScore > 5) allContributing.push(`Recent precipitation ${weather.current.precipitation}mm`);
          if (stageScore > 5) allContributing.push(`Current crop stage (${crop.currentStage}) is highly susceptible`);
        }
      }

      const confidence = clamp(
        60 + Math.abs(weather.current.humidity - 75) * 0.4,
        60,
        92,
      );

      return {
        disease,
        risk: maxRisk,
        level: getRiskLevel(maxRisk),
        confidence: Math.round(confidence),
        contributingFactors: allContributing,
        preventiveActions: disease.preventiveActions,
        curativeActions: disease.curativeActions,
      };
    },
  );

  // Sort by risk descending
  assessments.sort((a, b) => b.risk - a.risk);

  const overallFavorability =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.risk, 0) / assessments.length)
      : 0;

  const spreadRisk = getRiskLevel(overallFavorability);
  const confidence =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((s, a) => s + a.confidence, 0) / assessments.length,
        )
      : 0;

  return {
    diseases: assessments,
    overallFavorability,
    spreadRisk,
    confidence,
  };
}