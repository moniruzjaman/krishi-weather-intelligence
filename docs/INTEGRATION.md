# Integration Guide

## Server SDK

```ts
import { createWeatherIntelligence } from '@krishiai/weather-intelligence';
const kwi = createWeatherIntelligence({ cacheTtlSeconds: 600 });
const result = await kwi.analyze({ location, activeCrops });
```

## Next.js / Vercel

A framework-neutral handler is available from `@krishiai/weather-intelligence/api`. See `examples/nextjs/route.ts`.

Expose it from `/api/v1/intelligence` and keep provider credentials server-side if a future provider requires them.

## Plantation Tracker

After GPS capture, call `analyze()` with the plantation site's coordinates and crop/stage context. Store only the result fields needed by the offline field workflow; refresh after connectivity resumes.

## Nursery

Pass nursery location plus crop/stage context. Use risk, disease and operation windows for seedling protection and work planning.

## KrishiAI

Treat KWI as an evidence service. The AI layer should explain KWI outputs rather than independently recomputing weather indices.

## Production caching

The SDK has an in-memory TTL cache for single-instance deduplication. For multi-instance deployments, add edge/server caching around the API route. Never describe cached results as live observations; use the returned timestamps and provider metadata.
