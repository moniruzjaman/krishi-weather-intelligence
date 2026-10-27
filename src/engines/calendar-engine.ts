import type { CropCalendarEntry, ActiveCrop, WeatherData } from '../types/index.js';
import { getCropConfig } from './crop-configs.js';
import { computeRiskDashboard, getRiskLevel } from './risk-engine.js';

/**
 * Calendar Engine
 * Generates a dynamic crop calendar that updates daily based on
 * crop configuration, sowing date, and weather conditions.
 */

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function getGrowthStage(cropId: string, dayOverall: number): { stageId: string; dayInStage: number } {
  const config = getCropConfig(cropId);
  let accumulated = 0;
  for (const stage of config.growthStages) {
    if (dayOverall < accumulated + stage.durationDays) {
      return { stageId: stage.id, dayInStage: dayOverall - accumulated };
    }
    accumulated += stage.durationDays;
  }
  const lastStage = config.growthStages[config.growthStages.length - 1];
  return { stageId: lastStage.id, dayInStage: lastStage.durationDays };
}

export function generateCropCalendar(
  activeCrops: ActiveCrop[],
  weather: WeatherData,
  completedTaskIds: string[] = [],
): CropCalendarEntry[] {
  const today = new Date().toISOString().split('T')[0];
  const entries: CropCalendarEntry[] = [];

  for (const crop of activeCrops) {
    const config = getCropConfig(crop.cropId);
    const dayOverall = daysBetween(crop.sowingDate, today);
    const { stageId, dayInStage } = getGrowthStage(crop.cropId, Math.max(0, dayOverall));

    const stage = config.growthStages.find(s => s.id === stageId);
    if (!stage) continue;

    // Determine tasks for current stage
    const tasks = stage.criticalOperations.filter(op => {
      const remaining = stage.durationDays - dayInStage;
      return remaining <= 3 && remaining >= -2; // upcoming or slightly overdue
    });

    // Weather adjustments
    const weatherAdj: string[] = [];
    const weatherAdjBn: string[] = [];
    const risks = computeRiskDashboard(weather, [crop]);

    if (risks.risks.find(r => r.category === 'heat_stress' && r.score > 50)) {
      weatherAdj.push('High heat stress expected — increase irrigation frequency');
      weatherAdjBn.push('উচ্চ তাপ প্রাণী প্রত্যাশিত — সেচের ফ্রিকোয়েন্সি বাড়ান');
    }
    if (risks.risks.find(r => r.category === 'disease' && r.score > 40)) {
      weatherAdj.push('Disease conditions favorable — schedule preventive spray');
      weatherAdjBn.push('রোগের অনুকূল অবস্থা — প্রতিরোধমূলক স্প্রে নির্ধারণ করুন');
    }
    if (weather.daily[0]?.precipitationProbabilityMax > 70) {
      weatherAdj.push('Heavy rain expected — delay spraying and fertilizer application');
      weatherAdjBn.push('ভারী বৃষ্টি প্রত্যাশিত — স্প্রে ও সার প্রয়োগ বিলম্বিত করুন');
    }

    // Check for delayed tasks
    const isDelayed = dayOverall > 0 && tasks.some((t) => !completedTaskIds.includes(t.id) && dayInStage > (t.id.includes('first') ? 2 : 5));

    entries.push({
      date: today,
      stage: stageId as import('../types/index.js').GrowthStageId,
      dayInStage,
      dayOverall: Math.max(0, dayOverall),
      tasks,
      weatherAdjustments: weatherAdj,
      marketAdjustments: [],
      isDelayed,
      completedTasks: completedTaskIds.filter(id => tasks.some(t => t.id === id)),
    });
  }

  return entries;
}

export function getCropProgress(crop: ActiveCrop): number {
  const dayOverall = daysBetween(crop.sowingDate, new Date().toISOString().split('T')[0]);
  const config = getCropConfig(crop.cropId);
  return Math.min(100, (Math.max(0, dayOverall) / config.totalDurationDays) * 100);
}

export function getExpectedHarvestDate(crop: ActiveCrop): string {
  const config = getCropConfig(crop.cropId);
  const harvest = new Date(crop.sowingDate);
  harvest.setDate(harvest.getDate() + config.harvestWindow.startDay);
  return harvest.toISOString().split('T')[0];
}

export function getNext7DaysCalendar(
  activeCrops: ActiveCrop[],
  weather: WeatherData,
  completedTaskIds: string[] = [],
): CropCalendarEntry[] {
  const entries: CropCalendarEntry[] = [];

  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    for (const crop of activeCrops) {
      const config = getCropConfig(crop.cropId);
      const dayOverall = daysBetween(crop.sowingDate, dateStr);
      const { stageId, dayInStage } = getGrowthStage(crop.cropId, Math.max(0, dayOverall));

      const stage = config.growthStages.find(s => s.id === stageId);
      if (!stage) continue;

      const tasks = stage.criticalOperations.filter(op => {
        const remaining = stage.durationDays - dayInStage;
        return remaining <= (d + 3) && remaining >= (d - 2);
      });

      // Weather adjustments for this day
      const weatherAdj: string[] = [];
      const dayWeather = weather.daily[d];
      if (dayWeather) {
        if (dayWeather.precipitationProbabilityMax > 60) {
          weatherAdj.push('Rain expected — avoid spray operations');
        }
        if (dayWeather.tempMax > 35) {
          weatherAdj.push('High temperature — ensure adequate irrigation');
        }
      }

      entries.push({
        date: dateStr,
        stage: stageId as import('../types/index.js').GrowthStageId,
        dayInStage,
        dayOverall: Math.max(0, dayOverall),
        tasks,
        weatherAdjustments: weatherAdj,
        marketAdjustments: [],
        isDelayed: false,
        completedTasks: [],
      });
    }
  }

  return entries;
}