# Changelog

## 0.2.0
- Added provider identity/version metadata.
- Added configurable Open-Meteo timeout, forecast days and hourly horizon.
- Added in-memory TTL caching to the main facade.
- Added agricultural operation-window engine for spray, irrigation, fertilizer, planting, harvest and field access.
- Added evidence/methodology/confidence metadata for key derived metrics.
- Added framework-neutral HTTP handler for `/api/v1/intelligence`.
- Added Next.js/Vercel integration example.
- Kept the core independent of React, Next.js, databases and application state.
