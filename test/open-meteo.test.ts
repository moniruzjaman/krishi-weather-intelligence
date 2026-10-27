import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  OpenMeteoAdapter,
  createWeatherAdapter,
} from '../src/providers/open-meteo.js';
import type { WeatherData, WeatherHourly, WeatherDaily, WeatherCurrent } from '../src/types/index.js';

/**
 * Synthetic Open-Meteo response used across the parsing tests.
 * `current.time` matches `hourly.time[1]` so the precipitation-probability
 * backfill test has a deterministic hit.
 */
const SAMPLE_OPEN_METEO_RESPONSE = {
  current: {
    time: '2026-10-27T05:00',
    temperature_2m: 28.4,
    relative_humidity_2m: 78,
    apparent_temperature: 31.2,
    is_day: 1,
    precipitation: 0.0,
    weather_code: 2,
    cloud_cover: 40,
    pressure_msl: 1008.5,
    surface_pressure: 1008.0,
    wind_speed_10m: 6.5,
    wind_direction_10m: 165,
    wind_gusts_10m: 12.3,
    visibility: 24000,
    uv_index: 3.1,
    dew_point_2m: 23.8,
  },
  hourly: {
    time: ['2026-10-27T00:00', '2026-10-27T05:00', '2026-10-27T06:00'],
    temperature_2m: [25, 28.4, 29.1],
    relative_humidity_2m: [85, 78, 76],
    apparent_temperature: [26, 31.2, 32.5],
    precipitation_probability: [10, 65, 80],
    precipitation: [0, 0, 0.4],
    weather_code: [1, 2, 51],
    cloud_cover: [20, 40, 70],
    pressure_msl: [1009, 1008.5, 1008],
    visibility: [25000, 24000, 18000],
    wind_speed_10m: [4, 6.5, 9.2],
    wind_direction_10m: [160, 165, 170],
    uv_index: [0, 3.1, 5.4],
    dew_point_2m: [22, 23.8, 24.1],
    evapotranspiration: [0, 0.05, 0.15],
    surface_pressure: [1009, 1008, 1007.5],
  },
  daily: {
    time: ['2026-10-27', '2026-10-28'],
    weather_code: [2, 3],
    temperature_2m_max: [31, 30.5],
    temperature_2m_min: [22, 22.5],
    apparent_temperature_max: [35, 34],
    apparent_temperature_min: [24, 24.5],
    sunrise: ['2026-10-27T06:00', '2026-10-28T06:00'],
    sunset: ['2026-10-27T17:30', '2026-10-28T17:30'],
    precipitation_sum: [2.4, 1.8],
    precipitation_probability_max: [80, 60],
    wind_speed_10m_max: [12, 10],
    wind_gusts_10m_max: [22, 18],
    wind_direction_10m_dominant: [165, 170],
    uv_index_max: [7.5, 6.2],
    et0_fao_evapotranspiration: [4.2, 3.8],
  },
};

/**
 * Construct an adapter whose `fetch` is stubbed to return the given payload.
 * Returns the adapter plus a `restore` function that resets `globalThis.fetch`.
 */
function makeAdapter(fetchImpl: typeof fetch): { adapter: OpenMeteoAdapter; restore: () => void } {
  const orig = globalThis.fetch;
  globalThis.fetch = fetchImpl as typeof fetch;
  return {
    adapter: new OpenMeteoAdapter(),
    restore: () => { globalThis.fetch = orig; },
  };
}

describe('OpenMeteoAdapter.fetchWeather', () => {
  test('parses current, hourly, daily and agricultural indices', async () => {
    const { adapter, restore } = makeAdapter(async () => new Response(
      JSON.stringify(SAMPLE_OPEN_METEO_RESPONSE),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));

    try {
      const w = await adapter.fetchWeather({
        latitude: 23.8103, longitude: 90.4125, name: 'Dhaka', country: 'Bangladesh',
      });

      // Current block — direct fields
      assert.equal(w.current.temperature, 28.4);
      assert.equal(w.current.humidity, 78);
      assert.equal(w.current.dewPoint, 23.8);
      assert.equal(w.current.windSpeed, 6.5);
      assert.equal(w.current.weatherCode, 2);
      assert.equal(w.current.isDay, true);

      // Hourly parsing — sample only has 3 points
      assert.equal(w.hourly.length, 3);
      assert.equal(w.hourly[1].temperature, 28.4);
      assert.equal(w.hourly[1].precipitationProbability, 65);

      // Daily parsing
      assert.equal(w.daily.length, 2);
      assert.equal(w.daily[0].et0Sum, 4.2);
      assert.equal(w.daily[0].precipitationProbabilityMax, 80);
      // GDD uses (Tmax+Tmin)/2 - 10  →  (31+22)/2 - 10 = 16.5
      assert.equal(w.daily[0].growingDegreeDays, 16.5);

      // Agricultural indices
      const ai = w.agriculturalIndices;
      assert.equal(ai.et0, 4.2); // daily[0].et0Sum takes precedence over estimate
      assert.equal(ai.gdd, 16.5);
      assert.equal(ai.chillHours, 0); // none of the hourly temps are < 7°C
      // leafWetnessHours counts hours where humidity > 90 OR precipitation > 0.
      // In our sample, humidity never exceeds 90 but hourly[2] has precip=0.4,
      // so leafWetnessHours = 1 (the test sample is small — only 3 hourly
      // points, of which the 3rd has precipitation > 0).
      assert.equal(ai.leafWetnessHours, 1);

      // VPD sanity check. At T=28.4°C, dew point=23.8°C (FAO Tetens):
      //   es = 0.6108 * exp(17.27*28.4/(237.3+28.4)) ≈ 3.871 kPa
      //   ea = 0.6108 * exp(17.27*23.8/(237.3+23.8)) ≈ 2.946 kPa
      //   VPD = es - ea ≈ 0.925 kPa
      // With the previous (buggy) swapped-variable implementation this would
      // have been clamped to 0. The loose band absorbs floating-point error.
      assert.ok(ai.vaporPressureDeficit > 0.85 && ai.vaporPressureDeficit < 1.00,
        `VPD expected ~0.92 kPa, got ${ai.vaporPressureDeficit}`);
    } finally {
      restore();
    }
  });

  test('backfills current.precipitationProbability from matching hourly point', async () => {
    // current.time = '2026-10-27T05:00' matches hourly.time[1], whose
    // precipitation_probability is 65. The previous implementation returned 0.
    const { adapter, restore } = makeAdapter(async () => new Response(
      JSON.stringify(SAMPLE_OPEN_METEO_RESPONSE),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));

    try {
      const w = await adapter.fetchWeather({
        latitude: 23.8103, longitude: 90.4125, name: 'Dhaka', country: 'Bangladesh',
      });
      assert.equal(w.current.precipitationProbability, 65,
        'current.precipitationProbability must be backfilled from hourly[1] (=65), not 0');
    } finally {
      restore();
    }
  });

  test('falls back to daily[0].precipitation_probability_max when current.time missing', async () => {
    const noCurrentTime = JSON.parse(JSON.stringify(SAMPLE_OPEN_METEO_RESPONSE));
    delete noCurrentTime.current.time;
    const { adapter, restore } = makeAdapter(async () => new Response(
      JSON.stringify(noCurrentTime),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));

    try {
      const w = await adapter.fetchWeather({
        latitude: 23.8103, longitude: 90.4125, name: 'Dhaka', country: 'Bangladesh',
      });
      assert.equal(w.current.precipitationProbability, 80,
        'fallback should be daily[0].precipitation_probability_max (=80)');
    } finally {
      restore();
    }
  });

  test('throws on non-2xx response', async () => {
    const { adapter, restore } = makeAdapter(async () => new Response('Server Error', { status: 500 }));
    try {
      await assert.rejects(
        () => adapter.fetchWeather({ latitude: 0, longitude: 0, name: 'x', country: 'y' }),
        /Open-Meteo API error: 500/,
      );
    } finally {
      restore();
    }
  });
});

describe('createWeatherAdapter factory', () => {
  test('throws on unknown provider instead of silently falling back', () => {
    assert.throws(
      // The 'bmd' provider is on the ROADMAP but not yet implemented. The
      // previous implementation silently returned an OpenMeteoAdapter, hiding
      // the misconfiguration from the operator.
      () => createWeatherAdapter('bmd' as 'open-meteo'),
      /Unknown weather provider: 'bmd'/,
    );
  });

  test('returns an OpenMeteoAdapter for "open-meteo"', () => {
    const a = createWeatherAdapter('open-meteo');
    assert.equal(a.providerId, 'open-meteo');
    assert.equal(a.providerVersion, 'forecast-v1');
  });
});

describe('VPD math (regression for swapped es/ea)', () => {
  /**
   * Re-implement the FAO VPD formula here so the test asserts the *math*,
   * independent of the provider internals. If the provider is refactored to a
   * shared helper later, this test still pins the formula.
   */
  function vpd(airTempC: number, dewPointC: number): number {
    const es = 0.6108 * Math.exp((17.27 * airTempC) / (237.3 + airTempC));
    const ea = 0.6108 * Math.exp((17.27 * dewPointC) / (237.3 + dewPointC));
    return Math.max(0, es - ea);
  }

  test('VPD is positive when temperature > dew point (typical daytime)', () => {
    const v = vpd(30, 20);
    assert.ok(v > 1.0, `VPD should be > 1.0 kPa for T=30 dew=20, got ${v}`);
  });

  test('VPD is 0 when temperature <= dew point (saturated air)', () => {
    const v = vpd(20, 22);
    assert.equal(v, 0, `VPD must clamp to 0 when T < dew point, got ${v}`);
  });

  test('VPD scales with humidity gap (monotonic in dew-point depression)', () => {
    const v1 = vpd(30, 28); // small depression
    const v2 = vpd(30, 20); // large depression
    assert.ok(v2 > v1, 'larger dew-point depression must produce larger VPD');
  });
});

describe('computeAgriculturalIndices integration', () => {
  /**
   * Drive computeAgriculturalIndices indirectly through fetchWeather with a
   * payload whose VPD we can hand-verify. This is a regression guard for the
   * VPD swap and the ET₀ fallback path.
   */
  test('uses daily[0].et0Sum when present, falls back to estimate when absent', async () => {
    // Variant 1: daily[0].et0Sum is set → it should win.
    const withEt0 = JSON.parse(JSON.stringify(SAMPLE_OPEN_METEO_RESPONSE));
    const { adapter: a1, restore: r1 } = makeAdapter(async () => new Response(
      JSON.stringify(withEt0),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    let w1: WeatherData;
    try {
      w1 = await a1.fetchWeather({ latitude: 0, longitude: 0, name: 'x', country: 'y' });
    } finally { r1(); }
    assert.equal(w1.agriculturalIndices.et0, 4.2);

    // Variant 2: daily[0].et0Sum is null/missing → estimateET0 kicks in.
    const withoutEt0 = JSON.parse(JSON.stringify(SAMPLE_OPEN_METEO_RESPONSE));
    withoutEt0.daily.et0_fao_evapotranspiration = [null, null];
    const { adapter: a2, restore: r2 } = makeAdapter(async () => new Response(
      JSON.stringify(withoutEt0),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    let w2: WeatherData;
    try {
      w2 = await a2.fetchWeather({ latitude: 0, longitude: 0, name: 'x', country: 'y' });
    } finally { r2(); }
    // The estimate is a simplified Penman-Monteith; at T=28.4, RH=78, uv=3.1,
    // wind=6.5 it produces a positive finite ET0. We don't pin the exact value
    // (it depends on the rough uv→radiation proxy) but assert it's > 0.
    assert.ok(w2.agriculturalIndices.et0 > 0, 'ET0 estimate should be positive');
    assert.ok(Number.isFinite(w2.agriculturalIndices.et0), 'ET0 estimate should be finite');
  });
});

// Helpers exported for other test modules
export const _testHelpers = {
  makeAdapter,
  SAMPLE_OPEN_METEO_RESPONSE,
  // Re-export types so downstream tests can avoid a separate import.
  _types: {} as { WeatherData: WeatherData; WeatherHourly: WeatherHourly; WeatherDaily: WeatherDaily; WeatherCurrent: WeatherCurrent },
};
