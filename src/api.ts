import { createWeatherIntelligence, type KWIOptions } from './index.js';
import type { ActiveCrop, GeoLocation } from './types/index.js';

export interface IntelligenceRequest {
  location: GeoLocation;
  activeCrops?: ActiveCrop[];
}

export interface KWIHttpRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
}

export interface KWIHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Framework-neutral HTTP handler factory for `/api/v1/intelligence`.
 *
 * Adapt the runtime's request/response objects to `KWIHttpRequest` /
 * `KWIHttpResponse`. See `examples/nextjs/route.ts` for a Next.js /
 * Vercel mounting example.
 */
export function createIntelligenceHandler(options: KWIOptions = {}) {
  const service = createWeatherIntelligence(options);

  return async function handle(req: KWIHttpRequest): Promise<KWIHttpResponse> {
    if ((req.method ?? 'POST').toUpperCase() !== 'POST') {
      return {
        status: 405,
        headers: { 'content-type': 'application/json' },
        body: { error: 'METHOD_NOT_ALLOWED' },
      };
    }

    try {
      const input = req.body as IntelligenceRequest;

      if (
        !input?.location
        || typeof input.location.latitude !== 'number'
        || typeof input.location.longitude !== 'number'
      ) {
        return {
          status: 400,
          headers: { 'content-type': 'application/json' },
          body: { error: 'INVALID_LOCATION' },
        };
      }

      const data = await service.analyze(input);
      const requestId = globalThis.crypto?.randomUUID?.() ?? `kwi-${Date.now()}`;

      return {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300',
        },
        body: {
          data,
          metadata: {
            requestId,
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 300000).toISOString(),
            schemaVersion: '1.1',
          },
        },
      };
    } catch (error) {
      return {
        status: 502,
        headers: { 'content-type': 'application/json' },
        body: {
          error: 'WEATHER_PROVIDER_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  };
}
