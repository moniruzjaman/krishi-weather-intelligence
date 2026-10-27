# Changelog

All notable changes to this package are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- **`current.precipitationProbability` is now backfilled from the matching
  hourly point** (or `daily[0].precipitation_probability_max` as a fallback)
  instead of being hard-coded to `0`. Previously four risk assessors
  (`spray_window`, `harvest`, `flood`, `field_accessibility`) silently
  received a constant `0` from this field, severely under-scoring rain risk.
- **Vapor Pressure Deficit formula corrected** to FAO convention
  (`es` at air temperature, `ea` at dew point). The previous implementation
  swapped the two, producing inverted and frequently clamped-to-zero VPD
  values whenever air temperature was below the dew point.
- **`cacheHit` and `stale` flags in `IntelligenceMetadata` are now populated
  truthfully** from the cache lookup result. Previously both were hard-coded
  to `false` regardless of whether a cache hit occurred.
- **`calculateOperationWindows` now inspects every active crop's stage
  threshold**, not just `crops[0]`. A farmer with multiple active crops
  (e.g. rice + jute) will no longer have the second crop's heat-stress
  thresholds silently ignored.
- **`createWeatherAdapter('unknown')` now throws `UnknownProviderError`**
  instead of silently falling back to Open-Meteo. The previous behavior
  hid typos like `createWeatherAdapter('bmd')` from operators.
- **`solarRadiation` confidence downgraded from `0.8 / 'high'` to
  `0.4 / 'low'`** in `IntelligenceMetadata.metrics`. The value is a
  UV-index-derived proxy (W/m² ≈ UV × 25), only roughly accurate near
  midday under clear skies — not a measured irradiance.
- **GDD now uses the average of `tempMax` and `tempMin`** rather than
  `tempMax - 10` alone, matching the standard single-sine simplification.
- **README typo fixed** — removed the `a npm run typecheck` accidental
  prefix and the "Correct command without the accidental prefix" apology
  that followed it.

### Changed
- **`src/index.ts` and `src/api.ts` reformatted** from one-line minified
  bodies to standard 100-column TypeScript. The previous minified form
  was an artifact of the `upgrade.py` refactor script and made diffs
  nearly impossible to review.
- **`.gitignore` expanded** to cover `package-lock.json`, IDE folders,
  `*.tsbuildinfo`, `coverage/`, and `.nyc_output/`.
- **`upgrade.py` removed** from the published package. It was a one-shot
  refactor script with a hard-coded `/tmp/kwi` path that had no value
  for consumers.
- **`releases/` directory** added to archive the original
  `krishi-weather-intelligence-plugin-v0.2.0.zip` out of the repo root.

### Added
- **`test/` directory** with `node:test` unit tests covering the
  `computeAgriculturalIndices` math (VPD, ET₀, GDD, leaf-wetness proxy),
  `OpenMeteoAdapter.parseCurrent` / `parseHourly` / `parseDaily`, the
  `precipitationProbability` backfill, and the multi-crop
  `calculateOperationWindows` regression.
- **`getCropProgress` test** verifying sowing-date arithmetic and stage
  boundary conditions.

## [0.2.0] — 2025-09-02

- Added provider identity/version metadata.
- Added configurable Open-Meteo timeout, forecast days and hourly horizon.
- Added in-memory TTL caching to the main facade.
- Added agricultural operation-window engine for spray, irrigation, fertilizer,
  planting, harvest and field access.
- Added evidence/methodology/confidence metadata for key derived metrics.
- Added framework-neutral HTTP handler for `/api/v1/intelligence`.
- Added Next.js/Vercel integration example.
- Kept the core independent of React, Next.js, databases and application state.
