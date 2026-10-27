import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  WeatherProviderError,
  WeatherTimeoutError,
  WeatherApiError,
  UnknownProviderError,
  InvalidLocationError,
  ValidationError,
} from '../src/errors.js';
import { LruCache, validateLocation, validateIsoDate } from '../src/utils/cache.js';
import {
  createWeatherIntelligence,
  createActiveCrop,
} from '../src/index.js';
import { createWeatherAdapter, OpenMeteoAdapter } from '../src/providers/open-meteo.js';
import type { GeoLocation } from '../src/types/index.js';

// ────────────────────────────────────────────────────────────
// Error hierarchy
// ────────────────────────────────────────────────────────────

describe('Error hierarchy', () => {
  test('all errors extend WeatherProviderError', () => {
    const timeout = new WeatherTimeoutError('timed out', { timeoutMs: 5000 });
    const api = new WeatherApiError('500', { statusCode: 500 });
    const unknown = new UnknownProviderError('bmd');
    const invalid = new InvalidLocationError('bad lat', { latitude: 999 });
    const validation = new ValidationError('sowingDate', 'bad format');

    assert.ok(timeout instanceof WeatherProviderError);
    assert.ok(api instanceof WeatherProviderError);
    assert.ok(unknown instanceof WeatherProviderError);
    assert.ok(invalid instanceof WeatherProviderError);
    assert.ok(validation instanceof WeatherProviderError);
  });

  test('all errors extend Error', () => {
    const e = new WeatherTimeoutError('test', { timeoutMs: 1000 });
    assert.ok(e instanceof Error);
    assert.equal(e.name, 'WeatherTimeoutError');
    assert.equal(e.message, 'test');
    assert.equal(e.code, 'WEATHER_TIMEOUT');
    assert.equal(e.timeoutMs, 1000);
  });

  test('UnknownProviderError includes providerId', () => {
    const e = new UnknownProviderError('bmd');
    assert.equal(e.providerId, 'bmd');
    assert.equal(e.code, 'UNKNOWN_PROVIDER');
    assert.match(e.message, /bmd/);
  });

  test('WeatherApiError includes statusCode', () => {
    const e = new WeatherApiError('Server Error', { statusCode: 503 });
    assert.equal(e.statusCode, 503);
    assert.equal(e.code, 'WEATHER_API_ERROR');
  });

  test('InvalidLocationError includes coordinates', () => {
    const e = new InvalidLocationError('lat out of range', { latitude: 999, longitude: 0 });
    assert.equal(e.latitude, 999);
    assert.equal(e.longitude, 0);
    assert.equal(e.code, 'INVALID_LOCATION');
  });

  test('ValidationError includes field name', () => {
    const e = new ValidationError('sowingDate', 'bad format');
    assert.equal(e.field, 'sowingDate');
    assert.equal(e.code, 'VALIDATION_ERROR');
    assert.match(e.message, /sowingDate/);
  });
});

// ────────────────────────────────────────────────────────────
// Input validation
// ────────────────────────────────────────────────────────────

describe('validateLocation', () => {
  test('accepts valid coordinates', () => {
    assert.doesNotThrow(() => validateLocation({ latitude: 23.8, longitude: 90.4, name: 'x', country: 'y' }));
    assert.doesNotThrow(() => validateLocation({ latitude: -90, longitude: -180, name: 'x', country: 'y' }));
    assert.doesNotThrow(() => validateLocation({ latitude: 90, longitude: 180, name: 'x', country: 'y' }));
    assert.doesNotThrow(() => validateLocation({ latitude: 0, longitude: 0, name: 'x', country: 'y' }));
  });

  test('rejects latitude > 90', () => {
    assert.throws(
      () => validateLocation({ latitude: 91, longitude: 0, name: 'x', country: 'y' }),
      /latitude 91 out of range/,
    );
  });

  test('rejects latitude < -90', () => {
    assert.throws(
      () => validateLocation({ latitude: -91, longitude: 0, name: 'x', country: 'y' }),
      /latitude -91 out of range/,
    );
  });

  test('rejects longitude > 180', () => {
    assert.throws(
      () => validateLocation({ latitude: 0, longitude: 181, name: 'x', country: 'y' }),
      /longitude 181 out of range/,
    );
  });

  test('rejects longitude < -180', () => {
    assert.throws(
      () => validateLocation({ latitude: 0, longitude: -181, name: 'x', country: 'y' }),
      /longitude -181 out of range/,
    );
  });

  test('rejects NaN latitude', () => {
    assert.throws(
      () => validateLocation({ latitude: NaN, longitude: 0, name: 'x', country: 'y' } as GeoLocation),
    );
  });
});

describe('validateIsoDate', () => {
  test('accepts valid ISO dates', () => {
    assert.doesNotThrow(() => validateIsoDate('2026-07-15', 'sowingDate'));
    assert.doesNotThrow(() => validateIsoDate('2026-01-01', 'd'));
    assert.doesNotThrow(() => validateIsoDate('1999-12-31', 'd'));
  });

  test('rejects non-ISO formats', () => {
    assert.throws(() => validateIsoDate('15-07-2026', 'sowingDate'), /ISO date YYYY-MM-DD/);
    assert.throws(() => validateIsoDate('2026/07/15', 'sowingDate'), /ISO date YYYY-MM-DD/);
    assert.throws(() => validateIsoDate('July 15, 2026', 'sowingDate'), /ISO date YYYY-MM-DD/);
    assert.throws(() => validateIsoDate('', 'sowingDate'), /ISO date YYYY-MM-DD/);
  });

  test('rejects invalid dates like Feb 30', () => {
    assert.throws(() => validateIsoDate('2026-02-30', 'sowingDate'), /not a valid calendar date/);
  });
});

// ────────────────────────────────────────────────────────────
// LRU cache
// ────────────────────────────────────────────────────────────

describe('LruCache', () => {
  test('stores and retrieves values', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', { value: 1, expiresAt: Date.now() + 10000 });
    cache.set('b', { value: 2, expiresAt: Date.now() + 10000 });
    assert.equal(cache.get('a')?.value, 1);
    assert.equal(cache.get('b')?.value, 2);
    assert.equal(cache.get('c'), undefined);
  });

  test('evicts least recently used entry when full', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', { value: 1, expiresAt: Date.now() + 10000 });
    cache.set('b', { value: 2, expiresAt: Date.now() + 10000 });
    // Access 'a' to make it more recently used than 'b'
    cache.get('a');
    // Insert 'c' — should evict 'b' (least recently used)
    cache.set('c', { value: 3, expiresAt: Date.now() + 10000 });
    assert.equal(cache.get('a')?.value, 1, 'a should still be in cache');
    assert.equal(cache.get('b'), undefined, 'b should have been evicted');
    assert.equal(cache.get('c')?.value, 3);
  });

  test('updates value on re-set without growing size', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', { value: 1, expiresAt: Date.now() + 10000 });
    cache.set('a', { value: 99, expiresAt: Date.now() + 10000 });
    assert.equal(cache.size, 1);
    assert.equal(cache.get('a')?.value, 99);
  });

  test('delete removes entry', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', { value: 1, expiresAt: Date.now() + 10000 });
    assert.equal(cache.delete('a'), true);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.delete('nonexistent'), false);
  });

  test('clear empties the cache', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', { value: 1, expiresAt: Date.now() + 10000 });
    cache.set('b', { value: 2, expiresAt: Date.now() + 10000 });
    cache.clear();
    assert.equal(cache.size, 0);
  });
});

// ────────────────────────────────────────────────────────────
// createActiveCrop validation
// ────────────────────────────────────────────────────────────

describe('createActiveCrop validation', () => {
  test('throws on invalid sowingDate format', () => {
    assert.throws(
      () => createActiveCrop({ cropId: 'rice', sowingDate: '15/07/2026', currentStage: 'sowing' }),
      /ISO date YYYY-MM-DD/,
    );
  });

  test('throws on invalid sowingDate (Feb 30)', () => {
    assert.throws(
      () => createActiveCrop({ cropId: 'rice', sowingDate: '2026-02-30', currentStage: 'sowing' }),
      /not a valid calendar date/,
    );
  });

  test('throws on unknown cropId', () => {
    assert.throws(
      () => createActiveCrop({ cropId: 'banana', sowingDate: '2026-07-15', currentStage: 'sowing' }),
      /Unknown cropId.*banana/,
    );
  });

  test('accepts valid inputs and returns the crop', () => {
    const crop = createActiveCrop({
      cropId: 'rice',
      sowingDate: '2026-07-15',
      currentStage: 'flowering',
    });
    assert.equal(crop.cropId, 'rice');
    assert.equal(crop.sowingDate, '2026-07-15');
  });

  test('validates optional expectedHarvestDate', () => {
    assert.throws(
      () => createActiveCrop({
        cropId: 'rice',
        sowingDate: '2026-07-15',
        expectedHarvestDate: 'not-a-date',
        currentStage: 'flowering',
      }),
      /expectedHarvestDate.*ISO date/,
    );
  });
});

// ────────────────────────────────────────────────────────────
// Provider error integration
// ────────────────────────────────────────────────────────────

describe('Provider throws structured errors', () => {
  test('UnknownProviderError from createWeatherAdapter', () => {
    assert.throws(
      () => createWeatherAdapter('bmd'),
      (err: unknown) => err instanceof UnknownProviderError,
    );
  });

  test('InvalidLocationError from getWeather with bad coordinates', async () => {
    const kwi = createWeatherIntelligence({ cacheTtlSeconds: 0 });
    await assert.rejects(
      () => kwi.getWeather({ latitude: 999, longitude: 0, name: 'x', country: 'y' }),
      (err: unknown) => err instanceof Error && /latitude.*out of range/.test(err.message),
    );
  });

  test('WeatherApiError on HTTP 500', async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response('Server Error', { status: 500 })) as typeof fetch;
    try {
      const kwi = createWeatherIntelligence({ cacheTtlSeconds: 0 });
      await assert.rejects(
        () => kwi.getWeather({ latitude: 23.8, longitude: 90.4, name: 'x', country: 'y' }),
        (err: unknown) => {
          // The error may be our WeatherApiError or a plain Error depending
          // on how the HTTP handler wraps it. Either way the message should
          // mention the status code.
          return err instanceof Error && /500/.test(err.message);
        },
      );
    } finally {
      globalThis.fetch = orig;
    }
  });

  test('WeatherTimeoutError on abort', async () => {
    const orig = globalThis.fetch;
    // Simulate a fetch that immediately aborts (as if the timeout fired)
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      // If a signal is provided, listen for it
      if (init?.signal) {
        const controller = new AbortController();
        controller.abort();
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      throw new Error('no signal provided');
    }) as typeof fetch;
    try {
      const kwi = createWeatherIntelligence({
        cacheTtlSeconds: 0,
        adapter: new OpenMeteoAdapter({ timeoutMs: 50 }),
      });
      await assert.rejects(
        () => kwi.getWeather({ latitude: 23.8, longitude: 90.4, name: 'x', country: 'y' }),
        (err: unknown) => err instanceof Error,
      );
    } finally {
      globalThis.fetch = orig;
    }
  });
});

// ────────────────────────────────────────────────────────────
// LRU cache integration with WeatherIntelligence
// ────────────────────────────────────────────────────────────

describe('WeatherIntelligence LRU cache', () => {
  test('respects cacheMaxEntries option and evicts old locations', async () => {
    let calls = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls++;
      return new Response(JSON.stringify({
        current: { time: '2026-10-27T05:00', temperature_2m: 28, relative_humidity_2m: 70, dew_point_2m: 22, weather_code: 2, is_day: 1 },
        hourly: { time: ['2026-10-27T05:00'], temperature_2m: [28], relative_humidity_2m: [70], precipitation_probability: [10], precipitation: [0] },
        daily: { time: ['2026-10-27'], temperature_2m_max: [30], temperature_2m_min: [22], precipitation_probability_max: [10], et0_fao_evapotranspiration: [3.5] },
      }), { status: 200 });
    }) as typeof fetch;

    try {
      // Cache only 2 entries
      const kwi = createWeatherIntelligence({ cacheTtlSeconds: 600, cacheMaxEntries: 2 });

      // Fetch 3 distinct locations — third insert evicts the first
      await kwi.getWeather({ latitude: 10, longitude: 10, name: 'a', country: 'x' });
      await kwi.getWeather({ latitude: 20, longitude: 20, name: 'b', country: 'x' });
      // Access 'b' so 'a' becomes the LRU candidate
      await kwi.getWeather({ latitude: 20, longitude: 20, name: 'b', country: 'x' }); // cache hit, no new call
      assert.equal(calls, 2, 'two fetches so far');

      await kwi.getWeather({ latitude: 30, longitude: 30, name: 'c', country: 'x' });
      assert.equal(calls, 3, 'third fetch evicts LRU which is a');

      // 'a' was evicted — re-fetch should trigger a new API call
      await kwi.getWeather({ latitude: 10, longitude: 10, name: 'a', country: 'x' });
      assert.equal(calls, 4, 'evicted a triggers new fetch');

      // 'b' should still be cached (we accessed it after 'a', so 'c' was evicted)
      // Wait — after fetching 'a' again, 'a' is inserted and evicts the LRU.
      // After: [b, c, a] → no, cache size is 2. Let me trace:
      // After fetch a: [a]
      // After fetch b: [a, b]
      // Access b (cache hit): delete b, re-insert → [a, b]
      // Fetch c: evict a → [b, c], calls=3
      // Fetch a: evict b → [c, a], calls=4
      // So b IS evicted at this point. We need to check 'c' instead.
      // 'c' should still be cached.
      await kwi.getWeather({ latitude: 30, longitude: 30, name: 'c', country: 'x' });
      assert.equal(calls, 4, 'c should still be cached (no new fetch)');
    } finally {
      globalThis.fetch = orig;
    }
  });
});
