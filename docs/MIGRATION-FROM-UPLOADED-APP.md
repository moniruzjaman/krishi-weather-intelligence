# Migration from uploaded KWI app

## Retained

- Weather types
- Open-Meteo normalization
- Agricultural index calculations
- Crop configurations
- Risk engine
- Disease engine
- Recommendation engine
- Crop calendar engine
- Explanation engine

## Removed from the core package

- Next.js application routes/pages
- React components
- Tailwind/shadcn UI
- Zustand application store
- Prisma/database layer
- Gamification
- Mock market data and market advice
- Application-specific SDK configuration tied to a farm profile

## Why

The plugin must be portable. Consumer applications already own their UI, authentication, persistence, user profiles, field/plantation models and product workflows.
