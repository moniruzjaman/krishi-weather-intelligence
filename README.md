# @krishiai/weather-intelligence

**Krishi Weather Intelligence (KWI)** is a standalone, application-agnostic agricultural weather intelligence engine extracted and refactored from the uploaded KWI application.

It is designed to be shared by:

- KrishiAI
- Plantation Tracker
- Nursery applications
- Field/officer tools
- Other agriculture applications that need real-time weather-driven intelligence

## What this package does

KWI converts weather observations and forecasts into agricultural signals:

- Current, hourly and 16-day weather
- ET₀, GDD, VPD, heat/cold stress, leaf-wetness proxy and other indices
- Multi-category agricultural risk assessment
- Weather-driven disease favorability
- Crop-stage recommendations
- Crop calendar adjustments
- Daily and weekly action plans
- Explainability and confidence metadata
- English and Bangla fields where supported by the original engine

## What it deliberately does NOT contain

The reusable core does not ship the original application's Next.js UI, Zustand store, Prisma database, gamification, or mock market engine. Those are application concerns and should remain in the consuming products.

The original market engine was intentionally excluded because its prices are generated mock data. Real market intelligence should be provided by a separate verified market-data service.

## Quick start

```bash
npm install @krishiai/weather-intelligence
```

```ts
import {
  createWeatherIntelligence,
  createActiveCrop,
} from '@krishiai/weather-intelligence';

const kwi = createWeatherIntelligence();

const crop = createActiveCrop({
  cropId: 'rice',
  sowingDate: '2026-07-15',
  currentStage: 'flowering',
  fieldId: 'field-001',
  fieldName: 'Demo Field',
});

const result = await kwi.analyze({
  location: {
    latitude: 25.7439,
    longitude: 89.2752,
    name: 'Kurigram',
    district: 'Kurigram',
    country: 'Bangladesh',
  },
  activeCrops: [crop],
});

console.log(result.risks.overallRiskLevel);
console.log(result.recommendations);
console.log(result.disease);
```

## Architecture

```text
Consumer App
  |
  | @krishiai/weather-intelligence
  v
WeatherIntelligence facade
  |
  +-- Weather Provider abstraction
  |      +-- Open-Meteo (included)
  |      +-- future providers
  |
  +-- Agricultural indices
  +-- Risk engine
  +-- Disease engine
  +-- Recommendation engine
  +-- Crop calendar engine
  +-- Explanation engine
```

Applications should normally use the `WeatherIntelligence` facade. Individual engines are exported for advanced use and testing.

## Provider abstraction

The initial provider is Open-Meteo. A future BMD, commercial weather provider, or cached internal provider can implement the same `WeatherAdapter` interface.

```ts
interface WeatherAdapter {
  fetchWeather(location: GeoLocation): Promise<WeatherData>;
}
```

This keeps provider-specific API details out of KrishiAI, Plantation Tracker and Nursery.

## Important scientific-status note

Several indices inherited from the prototype are explicitly estimates/proxies rather than direct observations. In particular, leaf wetness, soil moisture deficit and solar radiation use simplified calculations. Consumers should present these as intelligence estimates and not as sensor measurements unless a validated sensor/data source is supplied.

The package currently exposes the normalized values. A future release should add per-index provenance and confidence objects without breaking the core weather contract.

## Recommended ecosystem integration

```text
                         KrishiAI Ecosystem
                                |
             +------------------+------------------+
             |                  |                  |
          KrishiAI       Plantation Tracker      Nursery
             |                  |                  |
             +------------------+------------------+
                                |
                   Krishi Weather Intelligence
                                |
             +------------------+------------------+
             |                  |                  |
        Weather data       Risk intelligence   Crop actions
```

### Plantation Tracker

Attach KWI results to each plantation site's GPS coordinates. Show weather risk, field accessibility, irrigation need, disease favorability and operation windows alongside plantation/NDVI/carbon information.

### Nursery

Use the same engine with crop/stage context to surface heat, cold, humidity, rain, disease-favorable weather and irrigation/protection signals.

### KrishiAI

Use KWI as an evidence provider. Let the KrishiAI conversational layer explain KWI's evidence rather than duplicating weather calculations inside the AI application.

## Development

```bash
npm install
a npm run typecheck
npm run build
```

Correct command without the accidental prefix:

```bash
npm run typecheck
npm run build
```

## Source lineage

This package was created from the uploaded KWI project. The refactor keeps the reusable weather/agricultural engines while removing application-specific runtime dependencies.
