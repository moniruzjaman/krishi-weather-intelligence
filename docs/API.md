# KWI API contract

## Primary facade

### `createWeatherIntelligence(options?)`

Creates the application-facing KWI client.

### `getWeather(location)`

Fetches normalized current/hourly/daily weather and agricultural indices.

### `analyze({ location, activeCrops?, weather? })`

Returns the full intelligence bundle:

- weather
- risks
- disease
- recommendations
- crop calendar
- daily plan
- weekly plan
- metadata

Supplying `weather` allows an application to reuse a previously fetched snapshot without making another provider call.

### `getRisks(...)`

Returns the agricultural risk dashboard.

### `getDiseaseRisk(...)`

Returns crop-specific weather disease favorability.

### `getRecommendations(...)`

Returns prioritized actions.

### `getCalendar(...)`

Returns weather-adjusted crop calendar entries.

### `getNext7DaysCalendar(...)`

Returns seven-day crop/calendar guidance.

### `explain(recommendation)`

Creates the structured explanation used by AI or UI layers.

## Data contract principles

1. Location is the fundamental input.
2. Crop and growth stage are optional enrichment context.
3. Provider details are hidden behind `WeatherAdapter`.
4. Forecast freshness is preserved through `fetchedAt` and result metadata.
5. No app-specific persistence is required by the core package.
6. No API key is required for the included Open-Meteo adapter.
