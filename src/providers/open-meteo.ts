import type {
  WeatherData, WeatherCurrent, WeatherHourly, WeatherDaily, AgriculturalIndices, GeoLocation,
} from '../types/index.js';
import { WeatherTimeoutError, WeatherApiError, UnknownProviderError } from '../errors.js';

// ────────────────────────────────────────────────────────────
// Weather Adapter Interface
// ────────────────────────────────────────────────────────────

export interface WeatherAdapter {
  readonly providerId: string;
  readonly providerVersion?: string;
  fetchWeather(location: GeoLocation): Promise<WeatherData>;
}

export interface OpenMeteoOptions {
  baseUrl?: string;
  timeoutMs?: number;
  forecastDays?: number;
  hourlyHours?: number;
}

// ────────────────────────────────────────────────────────────
// Open-Meteo Adapter
// ────────────────────────────────────────────────────────────

const CURRENT_PARAMS = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
  'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
  'surface_pressure', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
  'visibility', 'uv_index', 'dew_point_2m',
] as const;

const HOURLY_PARAMS = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability',
  'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl', 'visibility',
  'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'dew_point_2m',
  'evapotranspiration', 'surface_pressure',
] as const;

const DAILY_PARAMS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min',
  'apparent_temperature_max', 'apparent_temperature_min',
  'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max',
  'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
  'uv_index_max', 'et0_fao_evapotranspiration',
] as const;

/** Tetens saturation vapor pressure (kPa) at temperature t (°C). */
function svp(t: number): number {
  return 0.6108 * Math.exp((17.27 * t) / (237.3 + t));
}

/** Slope of saturation vapor pressure curve (kPa/°C) at temperature t. */
function svpSlope(t: number): number {
  return 4098 * svp(t) / Math.pow(237.3 + t, 2);
}

export class OpenMeteoAdapter implements WeatherAdapter {
  readonly providerId = 'open-meteo';
  readonly providerVersion = 'forecast-v1';
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly forecastDays: number;
  private readonly hourlyHours: number;

  constructor(options: OpenMeteoOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.open-meteo.com/v1';
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.forecastDays = Math.min(16, Math.max(1, options.forecastDays ?? 16));
    this.hourlyHours = Math.min(this.forecastDays * 24, Math.max(24, options.hourlyHours ?? 168));
  }

  async fetchWeather(location: GeoLocation): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current: CURRENT_PARAMS.join(','),
      hourly: HOURLY_PARAMS.join(','),
      daily: DAILY_PARAMS.join(','),
      timezone: 'auto',
      forecast_days: String(this.forecastDays),
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/forecast?${params}`, { signal: controller.signal });
    } catch (error) {
      // Distinguish timeout (AbortError) from network errors.
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WeatherTimeoutError(
          `Open-Meteo request timed out after ${this.timeoutMs}ms`,
          { timeoutMs: this.timeoutMs, provider: this.providerId },
        );
      }
      throw new WeatherApiError(
        `Open-Meteo request failed: ${error instanceof Error ? error.message : String(error)}`,
        { statusCode: 0, provider: this.providerId },
      );
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      throw new WeatherApiError(
        `Open-Meteo API error: ${res.status} ${res.statusText}`,
        { statusCode: res.status, provider: this.providerId },
      );
    }

    const data = await res.json() as Record<string, unknown>;

    const current = this.parseCurrent(data.current as Record<string, unknown>);
    const hourly = this.parseHourly(data.hourly as Record<string, unknown>);
    const daily = this.parseDaily(data.daily as Record<string, unknown>);

    // Open-Meteo's `current` block does NOT include precipitation_probability.
    // Backfill it from the matching hourly point (or daily max as fallback) so
    // the four risk assessors that key on this field stop seeing a constant 0.
    current.precipitationProbability = this.resolveCurrentPrecipProbability(
      (data.current as Record<string, unknown>)?.time as string | undefined,
      hourly,
      daily,
    );

    const agriculturalIndices = this.computeAgriculturalIndices(current, hourly, daily);

    return {
      current,
      hourly,
      daily,
      agriculturalIndices,
      location,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse the Open-Meteo `current` block.
   *
   * Note: Open-Meteo's `current` block does NOT include
   * `precipitation_probability` (that field is hourly-only). `fetchWeather`
   * backfills `precipitationProbability` after this method returns, using the
   * matching hourly point or `daily[0].precipitation_probability_max`.
   */
  private parseCurrent(c: Record<string, unknown>): WeatherCurrent {
    return {
      temperature: (c.temperature_2m as number) ?? 0,
      feelsLike: (c.apparent_temperature as number) ?? 0,
      humidity: (c.relative_humidity_2m as number) ?? 0,
      windSpeed: (c.wind_speed_10m as number) ?? 0,
      windDirection: (c.wind_direction_10m as number) ?? 0,
      windGusts: (c.wind_gusts_10m as number) ?? 0,
      pressure: (c.pressure_msl as number) ?? 0,
      cloudCover: (c.cloud_cover as number) ?? 0,
      visibility: (c.visibility as number) ?? 0,
      uvIndex: (c.uv_index as number) ?? 0,
      dewPoint: (c.dew_point_2m as number) ?? 0,
      precipitation: (c.precipitation as number) ?? 0,
      precipitationProbability: 0,
      weatherCode: (c.weather_code as number) ?? 0,
      isDay: (c.is_day as number) === 1,
    };
  }

  private parseHourly(h: Record<string, unknown>): WeatherHourly[] {
    if (!h?.time) return [];
    const times = h.time as string[];
    const count = Math.min(times.length, this.hourlyHours);
    const temp = (h.temperature_2m as number[]) ?? [];
    const feels = (h.apparent_temperature as number[]) ?? [];
    const rh = (h.relative_humidity_2m as number[]) ?? [];
    const ws = (h.wind_speed_10m as number[]) ?? [];
    const wd = (h.wind_direction_10m as number[]) ?? [];
    const precip = (h.precipitation as number[]) ?? [];
    const precipProb = (h.precipitation_probability as number[]) ?? [];
    const cc = (h.cloud_cover as number[]) ?? [];
    const uv = (h.uv_index as number[]) ?? [];
    const dp = (h.dew_point_2m as number[]) ?? [];
    const wc = (h.weather_code as number[]) ?? [];
    const pres = (h.pressure_msl as number[]) ?? [];
    const vis = (h.visibility as number[]) ?? [];
    const et = (h.evapotranspiration as number[]) ?? [];

    return Array.from({ length: count }, (_, i) => ({
      time: times[i],
      temperature: temp[i] ?? 0,
      feelsLike: feels[i] ?? 0,
      humidity: rh[i] ?? 0,
      windSpeed: ws[i] ?? 0,
      windDirection: wd[i] ?? 0,
      precipitation: precip[i] ?? 0,
      precipitationProbability: precipProb[i] ?? 0,
      cloudCover: cc[i] ?? 0,
      uvIndex: uv[i] ?? 0,
      dewPoint: dp[i] ?? 0,
      weatherCode: wc[i] ?? 0,
      pressure: pres[i] ?? 0,
      visibility: vis[i] ?? 0,
      evapotranspiration: et[i] ?? 0,
    }));
  }

  private parseDaily(d: Record<string, unknown>): WeatherDaily[] {
    if (!d?.time) return [];
    const times = d.time as string[];
    const count = Math.min(times.length, 16);
    const wc = (d.weather_code as number[]) ?? [];
    const tmax = (d.temperature_2m_max as number[]) ?? [];
    const tmin = (d.temperature_2m_min as number[]) ?? [];
    const tamax = (d.apparent_temperature_max as number[]) ?? [];
    const tamin = (d.apparent_temperature_min as number[]) ?? [];
    const sr = (d.sunrise as string[]) ?? [];
    const ss = (d.sunset as string[]) ?? [];
    const psum = (d.precipitation_sum as number[]) ?? [];
    const pmax = (d.precipitation_probability_max as number[]) ?? [];
    const wsmax = (d.wind_speed_10m_max as number[]) ?? [];
    const wgmax = (d.wind_gusts_10m_max as number[]) ?? [];
    const wddom = (d.wind_direction_10m_dominant as number[]) ?? [];
    const uvmax = (d.uv_index_max as number[]) ?? [];
    const et0 = (d.et0_fao_evapotranspiration as number[]) ?? [];

    return Array.from({ length: count }, (_, i) => ({
      date: times[i],
      weatherCode: wc[i] ?? 0,
      tempMax: tmax[i] ?? 0,
      tempMin: tmin[i] ?? 0,
      tempApparentMax: tamax[i] ?? 0,
      tempApparentMin: tamin[i] ?? 0,
      sunrise: sr[i] ?? '',
      sunset: ss[i] ?? '',
      precipitationSum: psum[i] ?? 0,
      precipitationProbabilityMax: pmax[i] ?? 0,
      windSpeedMax: wsmax[i] ?? 0,
      windGustsMax: wgmax[i] ?? 0,
      windDirectionDominant: wddom[i] ?? 0,
      uvIndexMax: uvmax[i] ?? 0,
      // et0Sum is optional — leave undefined when the provider returns null
      // so computeAgriculturalIndices can fall back to its own ET0 estimate
      // (previously `?? 0` masked the missing value and the estimate was
      // never reached).
      et0Sum: et0[i] ?? undefined,
      // GDD with single-sine simplification: (Tmax + Tmin)/2 - baseTemp
      // (base 10 °C is the package convention used by the crop calendar.)
      growingDegreeDays: Math.max(0, (((tmax[i] ?? 0) + (tmin[i] ?? 0)) / 2) - 10),
    }));
  }

  /**
   * Resolve `precipitationProbability` for the `current` snapshot.
   *
   * Open-Meteo's `current` block does not include `precipitation_probability`.
   * This helper prefers the hourly point whose timestamp matches
   * `currentIsoTime` (exact match, then hour-prefix match for ISO-Z vs
   * timezone-offset mismatches), and falls back to `daily[0].precipitation_probability_max`.
   */
  private resolveCurrentPrecipProbability(
    currentIsoTime: string | undefined,
    hourly: WeatherHourly[],
    daily: WeatherDaily[],
  ): number {
    if (currentIsoTime) {
      const exact = hourly.find(h => h.time === currentIsoTime);
      if (exact) return exact.precipitationProbability;
      // Open-Meteo returns current.time truncated to the hour; try prefix match.
      const prefix = currentIsoTime.slice(0, 13); // "YYYY-MM-DDTHH"
      const byPrefix = hourly.find(h => h.time.slice(0, 13) === prefix);
      if (byPrefix) return byPrefix.precipitationProbability;
    }
    return daily[0]?.precipitationProbabilityMax ?? 0;
  }

  private computeAgriculturalIndices(
    current: WeatherCurrent,
    hourly: WeatherHourly[],
    daily: WeatherDaily[],
  ): AgriculturalIndices {
    const today = daily[0];
    const et0 = today?.et0Sum ?? this.estimateET0(current);
    const avgTemp = today ? (today.tempMax + today.tempMin) / 2 : current.temperature;
    const gdd = Math.max(0, avgTemp - 10);

    // Heat Stress Index: combines temp + humidity
    const hni = Math.min(100, Math.max(0,
      (current.temperature > 35 ? (current.temperature - 35) * 5 : 0) +
      (current.humidity > 80 ? (current.humidity - 80) * 0.5 : 0)
    ));

    // Cold Stress Index
    const cni = Math.min(100, Math.max(0,
      current.temperature < 10 ? (10 - current.temperature) * 6 : 0
    ));

    // Leaf Wetness Hours (estimate from humidity + precipitation)
    const highHumidityHours = hourly.slice(0, 24).filter(h => h.humidity > 90 || h.precipitation > 0).length;
    const leafWetnessHours = Math.min(24, highHumidityHours);

    // Soil Moisture Deficit (simplified): ET0 minus effective rainfall+humidity contribution.
    const soilMoistureDeficit = Math.max(0, et0 - (current.precipitation + current.humidity * 0.05));

    // Vapor Pressure Deficit (FAO convention):
    //   es = saturation vapor pressure at air temperature
    //   ea = actual vapor pressure (from dew point, since RH-derived ea is less accurate)
    //   VPD = max(0, es - ea)
    // The previous implementation swapped es/ea, producing inverted (and frequently
    // negative-then-clamped-to-zero) VPD values whenever temperature < dew point.
    const es = svp(current.temperature);
    const ea = svp(current.dewPoint);
    const vpd = Math.max(0, es - ea);

    // Solar radiation estimate from UV (rough W/m² proxy, only valid near midday).
    const solarRadiation = current.uvIndex * 25;

    // Chill hours (hours below 7°C in last 24h)
    const chillHours = hourly.slice(0, 24).filter(h => h.temperature < 7).length;

    return {
      et0, gdd, hni, cni, leafWetnessHours, soilMoistureDeficit,
      chillHours, dewPoint: current.dewPoint, vaporPressureDeficit: vpd, solarRadiation,
    };
  }

  private estimateET0(current: WeatherCurrent): number {
    // Simplified Penman-Monteith estimate (FAO-56 form)
    const tempK = current.temperature + 273.15;
    const rn = current.uvIndex * 2.5; // rough net radiation MJ/m²/day
    const g = 0;
    const delta = svpSlope(current.temperature);
    const gamma = 0.066;
    const es = svp(current.temperature);
    const ea = es * (current.humidity / 100);
    const vpd = Math.max(0, es - ea);
    const u2 = current.windSpeed * 0.7;
    const et0 = (0.408 * delta * (rn - g) + gamma * (900 / tempK) * u2 * vpd) / (delta + gamma * (1 + 0.34 * u2));
    return Math.max(0, et0);
  }
}

// ────────────────────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────────────────────

export function createWeatherAdapter(
  provider: 'open-meteo' = 'open-meteo',
  options: OpenMeteoOptions = {},
): WeatherAdapter {
  switch (provider) {
    case 'open-meteo':
      return new OpenMeteoAdapter(options);
    default:
      throw new UnknownProviderError(provider as string);
  }
}
