// ============================================================
// KWI - Krishi Weather Intelligence
// Shared Type Definitions
// ============================================================

// --- Weather Types ---
export interface WeatherCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
  dewPoint: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  isDay: boolean;
  solarRadiation?: number;
  soilMoisture?: number;
  soilTemperature?: number;
  leafWetness?: number;
}

export interface WeatherHourly {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  uvIndex: number;
  dewPoint: number;
  weatherCode: number;
  pressure: number;
  visibility: number;
  evapotranspiration?: number;
}

export interface WeatherDaily {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  tempApparentMax: number;
  tempApparentMin: number;
  sunrise: string;
  sunset: string;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
  uvIndexMax: number;
  et0Sum?: number;
  growingDegreeDays?: number;
}

export interface AgriculturalIndices {
  et0: number;
  gdd: number;
  hni: number; // Heat Stress Index
  cni: number; // Cold Stress Index
  leafWetnessHours: number;
  soilMoistureDeficit: number;
  chillHours: number;
  dewPoint: number;
  vaporPressureDeficit: number;
  solarRadiation: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  agriculturalIndices: AgriculturalIndices;
  location: GeoLocation;
  fetchedAt: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name: string;
  district?: string;
  country: string;
}

// --- Crop Types ---
export type GrowthStageId =
  | 'sowing'
  | 'germination'
  | 'seedling'
  | 'vegetative'
  | 'tillering'
  | 'stem_elongation'
  | 'booting'
  | 'heading'
  | 'flowering'
  | 'grain_filling'
  | 'dough'
  | 'ripening'
  | 'harvest';

export interface GrowthStage {
  id: GrowthStageId;
  name: string;
  nameBn: string;
  durationDays: number;
  waterRequirementMm: number; // per day
  diseaseSusceptibility: number; // 0-100
  heatStressThreshold: number; // °C
  coldStressThreshold: number; // °C
  criticalOperations: CropOperation[];
  description: string;
  descriptionBn: string;
}

export interface CropOperation {
  id: string;
  name: string;
  nameBn: string;
  type: 'irrigation' | 'fertilizer' | 'pesticide' | 'weeding' | 'harvest' | 'planting' | 'monitoring' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  windowHours?: number; // preferred time window
  weatherConstraint?: WeatherConstraint;
  description: string;
  descriptionBn: string;
}

export interface WeatherConstraint {
  maxWindSpeed?: number;
  maxPrecipitationProbability?: number;
  minTemperature?: number;
  maxTemperature?: number;
  minHoursDry?: number;
  noRainForHours?: number;
}

export interface CropConfig {
  id: string;
  name: string;
  nameBn: string;
  growthStages: GrowthStage[];
  totalDurationDays: number;
  baseTemperature: number; // for GDD calculation
  optimalTempRange: [number, number];
  harvestWindow: { startDay: number; endDay: number };
  optimalSowingWindow: { startMonth: number; endMonth: number };
  waterRequirementTotal: number; // mm for full cycle
  icon: string;
  color: string;
}

export interface CropCalendarEntry {
  date: string;
  stage: GrowthStageId;
  dayInStage: number;
  dayOverall: number;
  tasks: CropOperation[];
  weatherAdjustments: string[];
  marketAdjustments: string[];
  isDelayed: boolean;
  completedTasks: string[];
}

// --- Risk Types ---
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type RiskCategory =
  | 'disease'
  | 'spray_window'
  | 'irrigation'
  | 'waterlogging'
  | 'flood'
  | 'heat_stress'
  | 'cold_stress'
  | 'wind_damage'
  | 'harvest'
  | 'lodging'
  | 'pollination'
  | 'seedling_stress'
  | 'nutrient_loss'
  | 'field_accessibility';

export interface RiskAssessment {
  category: RiskCategory;
  score: number; // 0-100
  level: RiskLevel;
  confidence: number; // 0-100
  explanation: string;
  explanationBn: string;
  evidence: string[];
  affectedStages: GrowthStageId[];
  mitigationActions: string[];
  mitigationActionsBn: string[];
  updatedAt: string;
}

export interface RiskDashboard {
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  risks: RiskAssessment[];
  alerts: RiskAlert[];
}

export interface RiskAlert {
  id: string;
  category: RiskCategory;
  level: RiskLevel;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  actionable: boolean;
  actionRequired?: string;
  actionRequiredBn?: string;
  expiresAt: string;
}

// --- Recommendation Types ---
export type RecommendationPriority = 'urgent' | 'high' | 'medium' | 'low';
export type RecommendationType =
  | 'irrigation'
  | 'spray'
  | 'fertilizer'
  | 'harvest'
  | 'drainage'
  | 'protection'
  | 'planting'
  | 'monitoring'
  | 'market';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  reason: string;
  reasonBn: string;
  evidence: string[];
  confidence: number;
  alternativeActions: AlternativeAction[];
  expectedOutcome: string;
  expectedOutcomeBn: string;
  expectedYieldImpact: number; // percentage
  costSavingEstimate: number; // in local currency
  windowStart: string;
  windowEnd: string;
  ignoreConsequence: string;
  ignoreConsequenceBn: string;
  relatedRisk: RiskCategory | null;
  relatedCropStage: GrowthStageId | null;
}

export interface AlternativeAction {
  action: string;
  actionBn: string;
  pros: string[];
  cons: string[];
  effectiveness: number; // 0-100
}

export interface DailyPlan {
  date: string;
  priorities: Recommendation[];
  completedTasks: string[];
  weatherNote: string;
  weatherNoteBn: string;
}

export interface WeeklyPlan {
  weekStart: string;
  weekEnd: string;
  days: DailyPlan[];
  bestWindows: {
    spray: { start: string; end: string; confidence: number } | null;
    irrigation: { start: string; end: string; confidence: number } | null;
    fertilizer: { start: string; end: string; confidence: number } | null;
    harvest: { start: string; end: string; confidence: number } | null;
  };
}

// --- Disease Types ---
export type DiseaseSeverity = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export interface DiseaseInfo {
  id: string;
  name: string;
  nameBn: string;
  cropIds: string[];
  affectedStages: GrowthStageId[];
  favorabilityFactors: DiseaseFavorabilityFactor[];
  symptoms: string[];
  symptomsBn: string[];
  preventiveActions: string[];
  preventiveActionsBn: string[];
  curativeActions: string[];
  curativeActionsBn: string[];
  economicThreshold: string;
}

export interface DiseaseFavorabilityFactor {
  factor: string;
  condition: string;
  weight: number;
}

export interface DiseaseForecast {
  diseases: DiseaseRiskAssessment[];
  overallFavorability: number; // 0-100
  spreadRisk: RiskLevel;
  confidence: number;
}

export interface DiseaseRiskAssessment {
  disease: DiseaseInfo;
  risk: number; // 0-100
  level: RiskLevel;
  confidence: number;
  contributingFactors: string[];
  preventiveActions: string[];
  curativeActions: string[];
}

// --- Market Types ---
export type MarketAction = 'harvest_now' | 'store' | 'wait' | 'sell';

export interface MarketPrice {
  commodity: string;
  commodityBn: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  high52w: number;
  low52w: number;
  date: string;
}

export interface MarketAdvice {
  commodity: string;
  commodityBn: string;
  action: MarketAction;
  currentPrice: number;
  expectedPriceOpportunity: number;
  expectedPriceRange: [number, number];
  reason: string;
  reasonBn: string;
  confidence: number;
  harvestWindowImpact: string;
  weatherImpact: string;
  timeHorizon: string;
}

// --- Farm Types ---
export interface FarmProfile {
  id: string;
  name: string;
  nameBn: string;
  location: GeoLocation;
  area: number; // hectares
  areaUnit: string;
  soilType: string;
  primaryCrops: ActiveCrop[];
  irrigationType: 'rainfed' | 'surface' | 'sprinkler' | 'drip';
  createdAt: string;
}

export interface ActiveCrop {
  cropId: string;
  config: CropConfig;
  sowingDate: string;
  expectedHarvestDate: string;
  currentStage: GrowthStageId;
  stageStartDate: string;
  area: number;
  fieldId: string;
  fieldName: string;
}

// --- Gamification Types ---
export interface GamificationState {
  points: number;
  level: number;
  streak: number;
  lastCheckIn: string | null;
  achievements: Achievement[];
  dailyTasks: DailyTask[];
  weeklyProgress: number;
}

export interface Achievement {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  unlockedAt: string | null;
  points: number;
  category: 'weather' | 'advisory' | 'task' | 'calendar' | 'disease' | 'streak';
}

export interface DailyTask {
  id: string;
  name: string;
  nameBn: string;
  completed: boolean;
  points: number;
  category: string;
}

// --- Explanation Types ---
export interface Explanation {
  recommendationId: string;
  why: string;
  whyBn: string;
  dataUsed: string[];
  confidence: number;
  confidenceReason: string;
  confidenceReasonBn: string;
  alternativeActions: AlternativeAction[];
  expectedOutcome: string;
  expectedOutcomeBn: string;
  whatIfIgnored: string;
  whatIfIgnoredBn: string;
}

// --- Farm Summary Types ---
export interface FarmSummary {
  weatherIntelligenceScore: number;
  farmHealthScore: number;
  overallRiskLevel: RiskLevel;
  topPriorities: Recommendation[];
  alerts: RiskAlert[];
  upcomingRisks: RiskAssessment[];
  todayTasks: CropOperation[];
  weatherSummary: string;
  weatherSummaryBn: string;
  lastUpdated: string;
}

// --- SDK Types ---
export interface KWISdkConfig {
  farmProfile: FarmProfile;
  apiBaseUrl?: string;
  language?: 'en' | 'bn';
  theme?: 'light' | 'dark' | 'system';
  onError?: (error: Error) => void;
}

// --- AI Skill Types ---
export type SkillId =
  | 'interpret_weather'
  | 'disease_prediction'
  | 'spray_advisor'
  | 'harvest_advisor'
  | 'market_advisor'
  | 'crop_calendar_advisor'
  | 'heat_stress_advisor'
  | 'flood_advisor'
  | 'fertilizer_advisor'
  | 'irrigation_advisor'
  | 'weekly_planner'
  | 'govt_advisory_interpreter'
  | 'ndvi_interpreter'
  | 'satellite_interpreter'
  | 'generate_report';

export interface AISkillInput {
  skillId: SkillId;
  context: Record<string, unknown>;
  question?: string;
  language?: 'en' | 'bn';
}

export interface AISkillOutput {
  skillId: SkillId;
  response: string;
  responseBn: string;
  confidence: number;
  dataUsed: string[];
  followUpQuestions?: string[];
}

export type IntelligenceConfidence = 'low' | 'moderate' | 'high';
export interface EvidenceMetric { value:number; unit:string; source:string; method:string; confidence:number; confidenceLevel:IntelligenceConfidence; }
export type WeatherWindowType = 'spray'|'irrigation'|'fertilizer'|'planting'|'harvest'|'field_access';
export interface OperationWindow { type:WeatherWindowType; start:string; end:string; score:number; suitable:boolean; reasons:string[]; reasonsBn:string[]; confidence:number; }
export interface WeatherWindows { spray:OperationWindow[]; irrigation:OperationWindow[]; fertilizer:OperationWindow[]; planting:OperationWindow[]; harvest:OperationWindow[]; fieldAccess:OperationWindow[]; }
export interface IntelligenceMetadataV2 { provider:string; providerVersion?:string; fetchedAt:string; generatedAt:string; forecastDays:number; hourlyPoints:number; dailyPoints:number; schemaVersion:string; cacheHit:boolean; cacheTtlSeconds:number; stale:boolean; methodologyVersion:string; metrics:Record<string,EvidenceMetric>; }
export interface WeatherIntelligenceQuery { location:GeoLocation; activeCrops?:ActiveCrop[]; cropId?:string; growthStage?:GrowthStageId; now?:string; }
export interface IntelligenceEnvelope<T> { data:T; metadata:{requestId:string; generatedAt:string; validUntil:string; schemaVersion:string}; }
