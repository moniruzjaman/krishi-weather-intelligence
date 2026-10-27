import { createActiveCrop, createWeatherIntelligence } from '@krishiai/weather-intelligence';

const kwi = createWeatherIntelligence();
const crop = createActiveCrop({
  cropId: 'rice',
  sowingDate: '2026-07-15',
  currentStage: 'flowering',
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
console.log(result.recommendations.slice(0, 3));
