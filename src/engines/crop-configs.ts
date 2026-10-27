import type { CropConfig } from '../types/index.js';
import {
  MUSTARD, POTATO, PEANUT, LENTIL, CHICKPEA, MUNGBEAN, SESAME, CHILI, ONION,
} from './crop-configs-new.js';
import { CROPS_EXTENDED } from './crop-configs-extended.js';

export const RICE: CropConfig = {
  id: 'rice',
  name: 'Rice (Boro)',
  nameBn: 'ধান (বোরো)',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বুনন', durationDays: 1,
      waterRequirementMm: 5, diseaseSusceptibility: 5,
      heatStressThreshold: 42, coldStressThreshold: 10,
      criticalOperations: [
        { id: 'sow_seed', name: 'Sow Seeds', nameBn: 'বীজ বুনুন', type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 18, maxPrecipitationProbability: 30 },
          description: 'Sow pre-germinated seeds in nursery bed', descriptionBn: 'নার্সারিতে অঙ্কুরিত বীজ বুনুন' },
      ],
      description: 'Seed sowing in nursery bed', descriptionBn: 'নার্সারি বেডে বীজ বুনন',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 25,
      waterRequirementMm: 8, diseaseSusceptibility: 20,
      heatStressThreshold: 40, coldStressThreshold: 12,
      criticalOperations: [
        { id: 'nursery_care', name: 'Nursery Care', nameBn: 'নার্সারি পরিচর্যা', type: 'monitoring', priority: 'high',
          description: 'Monitor seedling health, water management', descriptionBn: 'চারার স্বাস্থ্য ও পানি ব্যবস্থাপনা পর্যবেক্ষণ' },
      ],
      description: 'Seedling growth in nursery', descriptionBn: 'নার্সারিতে চারা বৃদ্ধি',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 35,
      waterRequirementMm: 10, diseaseSusceptibility: 30,
      heatStressThreshold: 38, coldStressThreshold: 15,
      criticalOperations: [
        { id: 'transplant', name: 'Transplanting', nameBn: 'রোপণ', type: 'planting', priority: 'critical',
          weatherConstraint: { noRainForHours: 6, maxWindSpeed: 20 },
          description: 'Transplant seedlings to main field', descriptionBn: 'মূল ক্ষেতে চারা রোপণ করুন' },
        { id: 'first_fert', name: 'First Fertilizer (Urea)', nameBn: 'প্রথম সার (ইউরিয়া)', type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40, minHoursDry: 4 },
          description: 'Apply first dose of urea fertilizer', descriptionBn: 'ইউরিয়া সারের প্রথম ডোজ প্রয়োগ' },
        { id: 'weeding1', name: 'First Weeding', nameBn: 'প্রথম আগাছা দমন', type: 'weeding', priority: 'medium',
          description: 'Manual weeding of transplanted field', descriptionBn: 'রোপিত ক্ষেতে হাতে আগাছা দমন' },
      ],
      description: 'Active vegetative growth and tillering', descriptionBn: 'সক্রিয় অবচয়ী বৃদ্ধি ও কল্লায়ন',
    },
    {
      id: 'tillering', name: 'Tillering', nameBn: 'কল্লায়ন', durationDays: 20,
      waterRequirementMm: 12, diseaseSusceptibility: 35,
      heatStressThreshold: 37, coldStressThreshold: 15,
      criticalOperations: [
        { id: 'second_fert', name: 'Second Fertilizer', nameBn: 'দ্বিতীয় সার', type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply second dose of NPK', descriptionBn: 'এনপিকে-র দ্বিতীয় ডোজ প্রয়োগ' },
      ],
      description: 'Active tillering stage', descriptionBn: 'সক্রিয় কল্লায়ন পর্যায়',
    },
    {
      id: 'stem_elongation', name: 'Stem Elongation', nameBn: 'কাণ্ড দীর্ঘায়ন', durationDays: 15,
      waterRequirementMm: 14, diseaseSusceptibility: 45,
      heatStressThreshold: 36, coldStressThreshold: 15,
      criticalOperations: [
        { id: 'pesticide1', name: 'Stem Borer Spray', nameBn: 'ইঁদুর মাকড় স্প্রে', type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 20, noRainForHours: 6 },
          description: 'Apply insecticide for stem borer control', descriptionBn: 'কাণ্ড ভেদক পোকা নিয়ন্ত্রণে কীটনাশক প্রয়োগ' },
      ],
      description: 'Rapid stem elongation and internode development', descriptionBn: 'দ্রুত কাণ্ড দীর্ঘায়ন ও গ্রন্থি বিকাশ',
    },
    {
      id: 'booting', name: 'Booting', nameBn: 'বুটিং', durationDays: 10,
      waterRequirementMm: 14, diseaseSusceptibility: 55,
      heatStressThreshold: 35, coldStressThreshold: 16,
      criticalOperations: [
        { id: 'potash_fert', name: 'Potash Application', nameBn: 'পটাশ প্রয়োগ', type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply potash for grain filling support', descriptionBn: 'দানা ভরাটে সহায়তার জন্য পটাশ প্রয়োগ' },
      ],
      description: 'Panicle initiation inside the flag leaf sheath', descriptionBn: 'পত্রাবরণের ভিতরে শঙ্কু আরম্ভ',
    },
    {
      id: 'heading', name: 'Heading', nameBn: 'শির বের হওয়া', durationDays: 7,
      waterRequirementMm: 12, diseaseSusceptibility: 60,
      heatStressThreshold: 35, coldStressThreshold: 17,
      criticalOperations: [
        { id: 'fungicide1', name: 'Blast Fungicide', nameBn: 'ব্লাস্ট ছত্রাকনাশক', type: 'pesticide', priority: 'critical',
          weatherConstraint: { maxWindSpeed: 12, maxPrecipitationProbability: 20, noRainForHours: 8 },
          description: 'Apply fungicide to prevent blast disease', descriptionBn: 'ব্লাস্ট রোগ প্রতিরোধে ছত্রাকনাশক প্রয়োগ' },
      ],
      description: 'Panicle emergence from the flag leaf', descriptionBn: 'পত্রাবরণ থেকে শঙ্কুর বহির্গমন',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 7,
      waterRequirementMm: 12, diseaseSusceptibility: 65,
      heatStressThreshold: 33, coldStressThreshold: 18,
      criticalOperations: [
        { id: 'pollination_monitor', name: 'Monitor Flowering', nameBn: 'পুষ্পোদ্গম পর্যবেক্ষণ', type: 'monitoring', priority: 'high',
          description: 'Check for proper pollination and grain set', descriptionBn: 'সঠিক পরাগায়ন ও দানা সেট পরীক্ষা করুন' },
      ],
      description: 'Anthesis and pollination', descriptionBn: 'অবধি ও পরাগায়ন',
    },
    {
      id: 'grain_filling', name: 'Grain Filling', nameBn: 'দানা ভরাট', durationDays: 15,
      waterRequirementMm: 10, diseaseSusceptibility: 50,
      heatStressThreshold: 34, coldStressThreshold: 16,
      criticalOperations: [
        { id: 'drain_water', name: 'Drain Field', nameBn: 'ক্ষেত থেকে পানি সরান', type: 'irrigation', priority: 'high',
          description: 'Begin draining field 15 days before harvest', descriptionBn: 'ফসল কাটার ১৫ দিন আগে ক্ষেত শুকাতে শুরু করুন' },
      ],
      description: 'Grain development and milk stage', descriptionBn: 'দানা বিকাশ ও দুগ্ধ পর্যায়',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 10,
      waterRequirementMm: 2, diseaseSusceptibility: 20,
      heatStressThreshold: 38, coldStressThreshold: 12,
      criticalOperations: [],
      description: 'Grain hardening and maturity', descriptionBn: 'দানা শক্ত হওয়া ও পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 10,
      heatStressThreshold: 45, coldStressThreshold: 5,
      criticalOperations: [
        { id: 'harvest_crop', name: 'Harvest', nameBn: 'ফসল কাটুন', type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20, maxWindSpeed: 25 },
          description: 'Harvest at proper moisture content (20-22%)', descriptionBn: 'সঠিক আর্দ্রতায় (২০-২২%) ফসল কাটুন' },
      ],
      description: 'Crop harvest and threshing', descriptionBn: 'ফসল কাটা ও মড়াই',
    },
  ],
  totalDurationDays: 150,
  baseTemperature: 10,
  optimalTempRange: [25, 32],
  harvestWindow: { startDay: 140, endDay: 150 },
  optimalSowingWindow: { startMonth: 11, endMonth: 1 },
  waterRequirementTotal: 1200,
  icon: '🌾',
  color: '#22c55e',
};

export const WHEAT: CropConfig = {
  id: 'wheat',
  name: 'Wheat',
  nameBn: 'গম',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বুনন', durationDays: 1,
      waterRequirementMm: 3, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 2,
      criticalOperations: [
        { id: 'sow_wheat', name: 'Sow Wheat Seeds', nameBn: 'গমের বীজ বুনুন', type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 10, maxTemperature: 25, maxPrecipitationProbability: 30 },
          description: 'Sow wheat seeds at proper depth and spacing', descriptionBn: 'সঠিক গভীরতা ও দূরত্বে গমের বীজ বুনুন' },
      ],
      description: 'Seed sowing', descriptionBn: 'বীজ বুনন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 7,
      waterRequirementMm: 4, diseaseSusceptibility: 10,
      heatStressThreshold: 32, coldStressThreshold: 2,
      criticalOperations: [],
      description: 'Seed germination and emergence', descriptionBn: 'বীজের অঙ্কুরোদ্গম ও উদ্ভব',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 15,
      waterRequirementMm: 4, diseaseSusceptibility: 15,
      heatStressThreshold: 30, coldStressThreshold: 3,
      criticalOperations: [
        { id: 'irrigation1', name: 'First Irrigation (Crown Root)', nameBn: 'প্রথম সেচ (মুকুট মূল)', type: 'irrigation', priority: 'critical',
          description: 'Apply crown root irrigation at 21 DAS', descriptionBn: '২১ দিনে মুকুট মূল সেচ দিন' },
      ],
      description: 'Seedling establishment', descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 40,
      waterRequirementMm: 5, diseaseSusceptibility: 25,
      heatStressThreshold: 30, coldStressThreshold: 3,
      criticalOperations: [
        { id: 'weed_control', name: 'Weed Control', nameBn: 'আগাছা দমন', type: 'weeding', priority: 'high',
          description: 'Herbicide application or manual weeding', descriptionBn: 'আগাছানাশক প্রয়োগ বা হাতে আগাছা দমন' },
        { id: 'nitrogen1', name: 'First Nitrogen Dose', nameBn: 'প্রথম নাইট্রোজেন', type: 'fertilizer', priority: 'high',
          description: 'Apply first split of nitrogen', descriptionBn: 'নাইট্রোজেনের প্রথম ভাগ প্রয়োগ' },
      ],
      description: 'Tillering and vegetative growth', descriptionBn: 'কল্লায়ন ও অবচয়ী বৃদ্ধি',
    },
    {
      id: 'stem_elongation', name: 'Stem Elongation', nameBn: 'কাণ্ড দীর্ঘায়ন', durationDays: 25,
      waterRequirementMm: 6, diseaseSusceptibility: 40,
      heatStressThreshold: 28, coldStressThreshold: 2,
      criticalOperations: [
        { id: 'irrigation2', name: 'Second Irrigation', nameBn: 'দ্বিতীয় সেচ', type: 'irrigation', priority: 'critical',
          description: 'Apply irrigation at jointing stage', descriptionBn: 'জয়েন্টিং পর্যায়ে সেচ দিন' },
        { id: 'nitrogen2', name: 'Second Nitrogen Dose', nameBn: 'দ্বিতীয় নাইট্রোজেন', type: 'fertilizer', priority: 'high',
          description: 'Apply second split of nitrogen at booting', descriptionBn: 'বুটিংয়ে নাইট্রোজেনের দ্বিতীয় ভাগ' },
      ],
      description: 'Rapid stem growth and node formation', descriptionBn: 'দ্রুত কাণ্ড বৃদ্ধি ও গ্রন্থি গঠন',
    },
    {
      id: 'heading', name: 'Heading', nameBn: 'শির বের হওয়া', durationDays: 10,
      waterRequirementMm: 6, diseaseSusceptibility: 50,
      heatStressThreshold: 28, coldStressThreshold: 2,
      criticalOperations: [
        { id: 'rust_spray', name: 'Rust Fungicide', nameBn: 'মরিচা ছত্রাকনাশক', type: 'pesticide', priority: 'critical',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25, noRainForHours: 6 },
          description: 'Apply fungicide for rust and blast prevention', descriptionBn: 'মরিচা ও ব্লাস্ট প্রতিরোধে ছত্রাকনাশক প্রয়োগ' },
      ],
      description: 'Ear emergence', descriptionBn: 'শঙ্কু বহির্গমন',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 7,
      waterRequirementMm: 6, diseaseSusceptibility: 55,
      heatStressThreshold: 27, coldStressThreshold: 2,
      criticalOperations: [],
      description: 'Anthesis and fertilization', descriptionBn: 'অবধি ও নিষেক',
    },
    {
      id: 'grain_filling', name: 'Grain Filling', nameBn: 'দানা ভরাট', durationDays: 20,
      waterRequirementMm: 5, diseaseSusceptibility: 40,
      heatStressThreshold: 30, coldStressThreshold: 3,
      criticalOperations: [
        { id: 'irrigation3', name: 'Last Irrigation', nameBn: 'শেষ সেচ', type: 'irrigation', priority: 'high',
          description: 'Apply last irrigation at grain filling', descriptionBn: 'দানা ভরাটে শেষ সেচ দিন' },
      ],
      description: 'Grain development and starch accumulation', descriptionBn: 'দানা বিকাশ ও স্টার্চ জমা',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 12,
      waterRequirementMm: 1, diseaseSusceptibility: 15,
      heatStressThreshold: 35, coldStressThreshold: 5,
      criticalOperations: [],
      description: 'Grain maturation and drying', descriptionBn: 'দানা পরিপক্কতা ও শুকানো',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 40, coldStressThreshold: 5,
      criticalOperations: [
        { id: 'harvest_wheat', name: 'Harvest Wheat', nameBn: 'গম কাটুন', type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 15, maxWindSpeed: 20 },
          description: 'Harvest when grain moisture is 12-14%', descriptionBn: 'দানার আর্দ্রতা ১২-১৪% হলে কাটুন' },
      ],
      description: 'Harvest and threshing', descriptionBn: 'ফসল কাটা ও মড়াই',
    },
  ],
  totalDurationDays: 142,
  baseTemperature: 5,
  optimalTempRange: [15, 25],
  harvestWindow: { startDay: 132, endDay: 142 },
  optimalSowingWindow: { startMonth: 11, endMonth: 12 },
  waterRequirementTotal: 450,
  icon: '🌿',
  color: '#eab308',
};

export const JUTE: CropConfig = {
  id: 'jute',
  name: 'Jute',
  nameBn: 'পাট',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বুনন', durationDays: 1,
      waterRequirementMm: 4, diseaseSusceptibility: 5,
      heatStressThreshold: 42, coldStressThreshold: 18,
      criticalOperations: [
        { id: 'sow_jute', name: 'Sow Jute Seeds', nameBn: 'পাটের বীজ বুনুন', type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 20, maxPrecipitationProbability: 40 },
          description: 'Broadcast or line sow jute seeds after pre-monsoon showers', descriptionBn: 'প্রাক-বর্ষার বৃষ্টির পর পাটের বীজ ছড়িয়ে বুনুন' },
      ],
      description: 'Seed sowing', descriptionBn: 'বীজ বুনন',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 20,
      waterRequirementMm: 6, diseaseSusceptibility: 20,
      heatStressThreshold: 40, coldStressThreshold: 18,
      criticalOperations: [
        { id: 'thinning', name: 'Thinning', nameBn: 'পাতলা করা', type: 'weeding', priority: 'high',
          description: 'Thin seedlings to proper spacing', descriptionBn: 'সঠিক দূরত্বে চারা পাতলা করুন' },
      ],
      description: 'Seedling establishment', descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative Growth', nameBn: 'অবচয়ী বৃদ্ধি', durationDays: 50,
      waterRequirementMm: 8, diseaseSusceptibility: 35,
      heatStressThreshold: 40, coldStressThreshold: 18,
      criticalOperations: [
        { id: 'weeding_jute', name: 'Weeding & Interculture', nameBn: 'আগাছা দমন', type: 'weeding', priority: 'high',
          description: 'Keep field weed-free during rapid growth', descriptionBn: 'দ্রুত বৃদ্ধির সময় ক্ষেত আগাছামুক্ত রাখুন' },
        { id: 'top_dress', name: 'Top Dressing', nameBn: 'টপ ড্রেসিং', type: 'fertilizer', priority: 'medium',
          weatherConstraint: { maxPrecipitationProbability: 50 },
          description: 'Apply nitrogen top dressing', descriptionBn: 'নাইট্রোজেন টপ ড্রেসিং প্রয়োগ' },
      ],
      description: 'Rapid vegetative growth and fiber elongation', descriptionBn: 'দ্রুত অবচয়ী বৃদ্ধি ও তন্তু দীর্ঘায়ন',
    },
    {
      id: 'stem_elongation', name: 'Fiber Development', nameBn: 'তন্তু বিকাশ', durationDays: 40,
      waterRequirementMm: 10, diseaseSusceptibility: 40,
      heatStressThreshold: 40, coldStressThreshold: 20,
      criticalOperations: [
        { id: 'pest_jute', name: 'Stem Weevil Control', nameBn: 'কাণ্ড উইভিল নিয়ন্ত্রণ', type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25 },
          description: 'Monitor and control stem weevil', descriptionBn: 'কাণ্ড উইভিল পর্যবেক্ষণ ও নিয়ন্ত্রণ' },
      ],
      description: 'Active fiber formation and stem elongation', descriptionBn: 'সক্রিয় তন্তু গঠন ও কাণ্ড দীর্ঘায়ন',
    },
    {
      id: 'ripening', name: 'Maturity', nameBn: 'পরিপক্কতা', durationDays: 15,
      waterRequirementMm: 4, diseaseSusceptibility: 15,
      heatStressThreshold: 42, coldStressThreshold: 20,
      criticalOperations: [],
      description: 'Plant maturity before harvest', descriptionBn: 'ফসল কাটার আগে পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 10,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 45, coldStressThreshold: 15,
      criticalOperations: [
        { id: 'harvest_jute', name: 'Harvest & Retting', nameBn: 'ফসল কাটা ও রেটিং', type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Cut close to ground and ret in water', descriptionBn: 'মাটির কাছাকাছি কেটে পানিতে রেটিং করুন' },
      ],
      description: 'Harvest and retting process', descriptionBn: 'ফসল কাটা ও রেটিং প্রক্রিয়া',
    },
  ],
  totalDurationDays: 136,
  baseTemperature: 15,
  optimalTempRange: [24, 35],
  harvestWindow: { startDay: 120, endDay: 136 },
  optimalSowingWindow: { startMonth: 3, endMonth: 5 },
  waterRequirementTotal: 600,
  icon: '🪢',
  color: '#a16207',
};

export const CROPS: Record<string, CropConfig> = {
  rice: RICE, wheat: WHEAT, jute: JUTE,
  mustard: MUSTARD, potato: POTATO, peanut: PEANUT, lentil: LENTIL,
  chickpea: CHICKPEA, mungbean: MUNGBEAN, sesame: SESAME, chili: CHILI,
  onion: ONION,
  ...CROPS_EXTENDED,
};

/**
 * Look up a crop configuration by id.
 *
 * Throws `ValidationError` for unknown crop ids instead of silently falling
 * back to RICE. The previous behavior hid typos from consumers — a farmer
 * asking for cropId 'ric' would get rice data without any indication that
 * the id was wrong.
 */
export function getCropConfig(cropId: string): CropConfig {
  const config = CROPS[cropId];
  if (!config) {
    const available = Object.keys(CROPS).join(', ');
    const err = new Error(
      `Unknown cropId: '${cropId}'. Available: ${available}.`,
    );
    (err as Error & { code: string; field: string }).code = 'VALIDATION_ERROR';
    (err as Error & { code: string; field: string }).field = 'cropId';
    throw err;
  }
  return config;
}

export function getAllCropConfigs(): CropConfig[] {
  return Object.values(CROPS);
}