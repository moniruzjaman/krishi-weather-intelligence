import type {
  ActiveCrop, CropConfig, DiseaseForecast, GeoLocation, RiskDashboard,
  WeatherData, Recommendation, CropCalendarEntry, DailyPlan, WeeklyPlan,
  Explanation, WeatherWindows, GrowthStageId,
} from './types/index.js';
import { createWeatherAdapter, type WeatherAdapter } from './providers/open-meteo.js';
import { LruCache, validateLocation, validateIsoDate } from './utils/cache.js';
import { computeRiskDashboard } from './engines/risk-engine.js';
import { generateDiseaseForecast } from './engines/disease-engine.js';
import {
  generateRecommendations, generateDailyPlan, generateWeeklyPlan,
} from './engines/recommendation-engine.js';
import {
  generateCropCalendar, getCropProgress, getExpectedHarvestDate, getNext7DaysCalendar,
} from './engines/calendar-engine.js';
import { generateExplanation } from './engines/explanation-engine.js';
import { getCropConfig, getAllCropConfigs } from './engines/crop-configs.js';
import { calculateOperationWindows } from './engines/operation-windows.js';

export * from './types/index.js';
export * from './providers/open-meteo.js';
export * from './engines/risk-engine.js';
export * from './engines/disease-engine.js';
export * from './engines/recommendation-engine.js';
export * from './engines/calendar-engine.js';
export * from './engines/explanation-engine.js';
export * from './engines/crop-configs.js';
export * from './engines/operation-windows.js';

// ────────────────────────────────────────────────────────────
// Public facade types
// ────────────────────────────────────────────────────────────

export interface WeatherIntelligenceInput {
  location: GeoLocation;
  activeCrops?: ActiveCrop[];
}

export interface AnalyzeInput extends WeatherIntelligenceInput {
  weather?: WeatherData;
}

export interface WeatherIntelligenceResult {
  weather: WeatherData;
  risks: RiskDashboard;
  disease: DiseaseForecast;
  recommendations: Recommendation[];
  calendar: CropCalendarEntry[];
  dailyPlan: DailyPlan;
  weeklyPlan: WeeklyPlan;
  operationWindows: WeatherWindows;
  metadata: IntelligenceMetadata;
}

export interface IntelligenceMetadata {
  provider: string;
  providerVersion?: string;
  fetchedAt: string;
  generatedAt: string;
  forecastDays: number;
  hourlyPoints: number;
  dailyPoints: number;
  schemaVersion: '1.1';
  cacheHit: boolean;
  cacheTtlSeconds: number;
  stale: boolean;
  methodologyVersion: string;
  metrics: Record<string, {
    value: number;
    unit: string;
    source: string;
    method: string;
    confidence: number;
    confidenceLevel: 'low' | 'moderate' | 'high';
  }>;
}

export interface KWIOptions {
  adapter?: WeatherAdapter;
  cacheTtlSeconds?: number;
  /** Maximum number of locations to keep in the LRU cache (default 256). */
  cacheMaxEntries?: number;
}

// Cache stores WeatherData directly; the LRU entry's `expiresAt` doubles as
// the TTL expiry timestamp.

// ────────────────────────────────────────────────────────────
// WeatherIntelligence facade
// ────────────────────────────────────────────────────────────

export class WeatherIntelligence {
  private readonly adapter: WeatherAdapter;
  private readonly cacheTtlMs: number;
  private readonly cache: LruCache<string, WeatherData>;

  constructor(options: KWIOptions = {}) {
    this.adapter = options.adapter ?? createWeatherAdapter('open-meteo');
    this.cacheTtlMs = Math.max(0, (options.cacheTtlSeconds ?? 600) * 1000);
    this.cache = new LruCache<string, WeatherData>(options.cacheMaxEntries ?? 256);
  }

  private cacheKey(location: GeoLocation): string {
    return `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
  }

  /**
   * Fetch weather for `location`, returning a cache hit when fresh.
   *
   * The returned tuple is `[weather, cacheHit]` so callers (notably `analyze`)
   * can populate the `cacheHit` flag in `IntelligenceMetadata` truthfully.
   * The previous implementation hard-coded `cacheHit:false` regardless of
   * whether the cache was actually hit, which made the metadata misleading.
   */
  async getWeather(location: GeoLocation): Promise<WeatherData> {
    return (await this.getWeatherWithCacheFlag(location)).weather;
  }

  private async getWeatherWithCacheFlag(location: GeoLocation): Promise<{ weather: WeatherData; cacheHit: boolean }> {
    validateLocation(location);
    const key = this.cacheKey(location);
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { weather: hit.value, cacheHit: true };
    }
    const weather = await this.adapter.fetchWeather(location);
    if (this.cacheTtlMs > 0) {
      this.cache.set(key, { value: weather, expiresAt: Date.now() + this.cacheTtlMs });
    }
    return { weather, cacheHit: false };
  }

  getOperationWindows(weather: WeatherData, crops: ActiveCrop[] = []): WeatherWindows {
    return calculateOperationWindows(weather, crops);
  }

  async getOperationWindowsFor(input: WeatherIntelligenceInput): Promise<WeatherWindows> {
    const weather = (await this.getWeatherWithCacheFlag(input.location)).weather;
    return this.getOperationWindows(weather, input.activeCrops ?? []);
  }

  async analyze(input: AnalyzeInput): Promise<WeatherIntelligenceResult> {
    let weather: WeatherData;
    let cacheHit = false;

    if (input.weather) {
      // Caller-supplied snapshot — bypass cache and provider call.
      weather = input.weather;
    } else {
      ({ weather, cacheHit } = await this.getWeatherWithCacheFlag(input.location));
    }

    const crops = input.activeCrops ?? [];
    const risks = computeRiskDashboard(weather, crops);
    const disease = generateDiseaseForecast(weather, crops);
    const calendar = generateCropCalendar(crops, weather);
    const recommendations = generateRecommendations(weather, crops, risks, calendar);

    return {
      weather,
      risks,
      disease,
      recommendations,
      calendar,
      dailyPlan: generateDailyPlan(weather, recommendations),
      weeklyPlan: generateWeeklyPlan(weather, recommendations, risks),
      operationWindows: this.getOperationWindows(weather, crops),
      metadata: {
        provider: this.adapter.providerId,
        providerVersion: this.adapter.providerVersion,
        fetchedAt: weather.fetchedAt,
        generatedAt: new Date().toISOString(),
        forecastDays: weather.daily.length,
        hourlyPoints: weather.hourly.length,
        dailyPoints: weather.daily.length,
        schemaVersion: '1.1',
        cacheHit,
        cacheTtlSeconds: this.cacheTtlMs / 1000,
        stale: false,
        methodologyVersion: 'kwi-1',
        metrics: {
          et0: {
            value: weather.agriculturalIndices.et0,
            unit: 'mm/day',
            source: this.adapter.providerId,
            method: 'provider_or_estimate',
            confidence: 0.8,
            confidenceLevel: 'high',
          },
          vpd: {
            value: weather.agriculturalIndices.vaporPressureDeficit,
            unit: 'kPa',
            source: 'derived',
            method: 'tetens_dew_point_vpd',
            confidence: 0.75,
            confidenceLevel: 'high',
          },
          leafWetnessHours: {
            value: weather.agriculturalIndices.leafWetnessHours,
            unit: 'hours',
            source: 'derived',
            method: 'humidity_precipitation_proxy',
            confidence: 0.6,
            confidenceLevel: 'moderate',
          },
          soilMoistureDeficit: {
            value: weather.agriculturalIndices.soilMoistureDeficit,
            unit: 'mm',
            source: 'derived',
            method: 'simplified_water_balance_proxy',
            confidence: 0.5,
            confidenceLevel: 'moderate',
          },
          solarRadiation: {
            value: weather.agriculturalIndices.solarRadiation,
            unit: 'W/m² (estimated)',
            source: 'derived',
            method: 'uv_index_proxy',
            // Previously marked 'high' despite being a rough proxy. Downgraded
            // so consumers do not present a UV-derived estimate as a measured value.
            confidence: 0.4,
            confidenceLevel: 'low',
          },
        },
      },
    };
  }

  async getRisks(i: WeatherIntelligenceInput): Promise<RiskDashboard> {
    const weather = (await this.getWeatherWithCacheFlag(i.location)).weather;
    return computeRiskDashboard(weather, i.activeCrops ?? []);
  }

  async getDiseaseRisk(i: WeatherIntelligenceInput): Promise<DiseaseForecast> {
    const weather = (await this.getWeatherWithCacheFlag(i.location)).weather;
    return generateDiseaseForecast(weather, i.activeCrops ?? []);
  }

  async getRecommendations(i: WeatherIntelligenceInput): Promise<Recommendation[]> {
    return (await this.analyze(i)).recommendations;
  }

  getCropConfig(id: string): CropConfig {
    return getCropConfig(id);
  }

  getAllCropConfigs(): CropConfig[] {
    return getAllCropConfigs();
  }

  getCropProgress(c: ActiveCrop): number {
    return getCropProgress(c);
  }

  getExpectedHarvestDate(c: ActiveCrop): string {
    return getExpectedHarvestDate(c);
  }

  async getCalendar(i: WeatherIntelligenceInput): Promise<CropCalendarEntry[]> {
    const weather = (await this.getWeatherWithCacheFlag(i.location)).weather;
    return generateCropCalendar(i.activeCrops ?? [], weather);
  }

  async getNext7DaysCalendar(i: WeatherIntelligenceInput): Promise<CropCalendarEntry[]> {
    const weather = (await this.getWeatherWithCacheFlag(i.location)).weather;
    return getNext7DaysCalendar(i.activeCrops ?? [], weather);
  }

  explain(r: Recommendation): Explanation {
    return generateExplanation(r);
  }
}

// ────────────────────────────────────────────────────────────
// Factory helpers
// ────────────────────────────────────────────────────────────

export function createWeatherIntelligence(options: KWIOptions = {}): WeatherIntelligence {
  return new WeatherIntelligence(options);
}

export function createActiveCrop(input: {
  cropId: string;
  sowingDate: string;
  expectedHarvestDate?: string;
  currentStage: ActiveCrop['currentStage'];
  stageStartDate?: string;
  area?: number;
  fieldId?: string;
  fieldName?: string;
}): ActiveCrop {
  // Validate inputs before doing any work.
  validateIsoDate(input.sowingDate, 'sowingDate');
  if (input.expectedHarvestDate) {
    validateIsoDate(input.expectedHarvestDate, 'expectedHarvestDate');
  }
  if (input.stageStartDate) {
    validateIsoDate(input.stageStartDate, 'stageStartDate');
  }

  const config = getCropConfig(input.cropId);
  const harvest = input.expectedHarvestDate ?? (() => {
    const d = new Date(input.sowingDate);
    d.setDate(d.getDate() + config.harvestWindow.startDay);
    return d.toISOString().split('T')[0];
  })();
  return {
    cropId: input.cropId,
    config,
    sowingDate: input.sowingDate,
    expectedHarvestDate: harvest,
    currentStage: input.currentStage,
    stageStartDate: input.stageStartDate ?? input.sowingDate,
    area: input.area ?? 0,
    fieldId: input.fieldId ?? 'field-1',
    fieldName: input.fieldName ?? 'Field',
  };
}

export * from './errors.js';
export * from './api.js';
