import type {
  WeatherData, WeatherCurrent, WeatherHourly, WeatherDaily, AgriculturalIndices, GeoLocation,
} from '../types/index.js';

// --- Weather Adapter Interface ---
export interface WeatherAdapter { readonly providerId:string; readonly providerVersion?:string; fetchWeather(location:GeoLocation):Promise<WeatherData>; }
export interface OpenMeteoOptions { baseUrl?:string; timeoutMs?:number; forecastDays?:number; hourlyHours?:number; }

// --- Open-Meteo Adapter ---
export class OpenMeteoAdapter implements WeatherAdapter {
  readonly providerId='open-meteo'; readonly providerVersion='forecast-v1';
  private readonly baseUrl:string; private readonly timeoutMs:number; private readonly forecastDays:number; private readonly hourlyHours:number;
  constructor(options:OpenMeteoOptions={}){ this.baseUrl=options.baseUrl??'https://api.open-meteo.com/v1'; this.timeoutMs=options.timeoutMs??10000; this.forecastDays=Math.min(16,Math.max(1,options.forecastDays??16)); this.hourlyHours=Math.min(this.forecastDays*24,Math.max(24,options.hourlyHours??168)); }

  async fetchWeather(location: GeoLocation): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
        'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
        'surface_pressure', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'visibility', 'uv_index', 'dew_point_2m',
      ].join(','),
      hourly: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability',
        'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl', 'visibility',
        'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'dew_point_2m',
        'evapotranspiration', 'surface_pressure',
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'apparent_temperature_max', 'apparent_temperature_min',
        'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max',
        'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
        'uv_index_max', 'et0_fao_evapotranspiration',
      ].join(','),
      timezone: 'auto',
      forecast_days: String(this.forecastDays),
    });

    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),this.timeoutMs); let res:Response; try{res=await fetch(`${this.baseUrl}/forecast?${params}`,{signal:controller.signal});}catch(error){throw new Error(`Open-Meteo request failed: ${error instanceof Error?error.message:String(error)}`)}finally{clearTimeout(timer)}
    if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);

    const data = await res.json();

    const current = this.parseCurrent(data.current);
    const hourly = this.parseHourly(data.hourly);
    const daily = this.parseDaily(data.daily);
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
    const count = Math.min(times.length, this.hourlyHours); // 7 days of hourly
    return Array.from({ length: count }, (_, i) => ({
      time: times[i],
      temperature: (h.temperature_2m as number[])[i] ?? 0,
      feelsLike: (h.apparent_temperature as number[])[i] ?? 0,
      humidity: (h.relative_humidity_2m as number[])[i] ?? 0,
      windSpeed: (h.wind_speed_10m as number[])[i] ?? 0,
      windDirection: (h.wind_direction_10m as number[])[i] ?? 0,
      precipitation: (h.precipitation as number[])[i] ?? 0,
      precipitationProbability: (h.precipitation_probability as number[])[i] ?? 0,
      cloudCover: (h.cloud_cover as number[])[i] ?? 0,
      uvIndex: (h.uv_index as number[])[i] ?? 0,
      dewPoint: (h.dew_point_2m as number[])[i] ?? 0,
      weatherCode: (h.weather_code as number[])[i] ?? 0,
      pressure: (h.pressure_msl as number[])[i] ?? 0,
      visibility: (h.visibility as number[])[i] ?? 0,
      evapotranspiration: (h.evapotranspiration as number[])[i] ?? 0,
    }));
  }

  private parseDaily(d: Record<string, unknown>): WeatherDaily[] {
    if (!d?.time) return [];
    const times = d.time as string[];
    const count = Math.min(times.length, 16);
    return Array.from({ length: count }, (_, i) => ({
      date: times[i],
      weatherCode: (d.weather_code as number[])[i] ?? 0,
      tempMax: (d.temperature_2m_max as number[])[i] ?? 0,
      tempMin: (d.temperature_2m_min as number[])[i] ?? 0,
      tempApparentMax: (d.apparent_temperature_max as number[])[i] ?? 0,
      tempApparentMin: (d.apparent_temperature_min as number[])[i] ?? 0,
      sunrise: (d.sunrise as string[])[i] ?? '',
      sunset: (d.sunset as string[])[i] ?? '',
      precipitationSum: (d.precipitation_sum as number[])[i] ?? 0,
      precipitationProbabilityMax: (d.precipitation_probability_max as number[])[i] ?? 0,
      windSpeedMax: (d.wind_speed_10m_max as number[])[i] ?? 0,
      windGustsMax: (d.wind_gusts_10m_max as number[])[i] ?? 0,
      windDirectionDominant: (d.wind_direction_10m_dominant as number[])[i] ?? 0,
      uvIndexMax: (d.uv_index_max as number[])[i] ?? 0,
      et0Sum: (d.et0_fao_evapotranspiration as number[])[i] ?? 0,
      growingDegreeDays: Math.max(0, ((d.temperature_2m_max as number[])[i] ?? 0) - 10),
    }));
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

    // Soil Moisture Deficit (simplified)
    const soilMoistureDeficit = Math.max(0, et0 - (current.precipitation + current.humidity * 0.05));

    // Vapor Pressure Deficit
    const es = 0.6108 * Math.exp((17.27 * current.dewPoint) / (237.3 + current.dewPoint));
    const ea = 0.6108 * Math.exp((17.27 * current.temperature) / (237.3 + current.temperature));
    const vpd = Math.max(0, ea - es);

    // Solar radiation estimate from UV
    const solarRadiation = current.uvIndex * 25;

    // Chill hours (hours below 7°C in last 24h)
    const chillHours = hourly.slice(0, 24).filter(h => h.temperature < 7).length;

    return {
      et0, gdd, hni, cni, leafWetnessHours, soilMoistureDeficit,
      chillHours, dewPoint: current.dewPoint, vaporPressureDeficit: vpd, solarRadiation,
    };
  }

  private estimateET0(current: WeatherCurrent): number {
    // Simplified Penman-Monteith estimate
    const tempK = current.temperature + 273.15;
    const rn = current.uvIndex * 2.5; // rough net radiation MJ/m²/day
    const g = 0;
    const delta = 4098 * (0.6108 * Math.exp((17.27 * current.temperature) / (237.3 + current.temperature))) / (237.3 + current.temperature) ** 2;
    const gamma = 0.066;
    const es = 0.6108 * Math.exp((17.27 * current.temperature) / (237.3 + current.temperature));
    const ea = es * (current.humidity / 100);
    const vpd = es - ea;
    const u2 = current.windSpeed * 0.7;
    const et0 = (0.408 * delta * (rn - g) + gamma * (900 / tempK) * u2 * vpd) / (delta + gamma * (1 + 0.34 * u2));
    return Math.max(0, et0);
  }
}

// --- Factory ---
export function createWeatherAdapter(provider: 'open-meteo' = 'open-meteo', options:OpenMeteoOptions={}): WeatherAdapter {
  switch (provider) {
    case 'open-meteo':
      return new OpenMeteoAdapter(options);
    default:
      return new OpenMeteoAdapter(options);
  }
}