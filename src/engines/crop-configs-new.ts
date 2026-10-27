import type { CropConfig } from '../types/index.js';

// ────────────────────────────────────────────────────────────
// Mustard (সরিষা) — Rabi oilseed crop
// ────────────────────────────────────────────────────────────
// Source: BARI Mustard cultivation guide (Gupta & Dey, BARI 2019).
// Total duration: 95–105 days. Sown Nov–Dec, harvested Feb–Mar.

export const MUSTARD: CropConfig = {
  id: 'mustard',
  name: 'Mustard',
  nameBn: 'সরিষা',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 3, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'sow_mustard', name: 'Sow Mustard Seeds', nameBn: 'সরিষার বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40, minTemperature: 10 },
          description: 'Broadcast or line-sow seeds at 1–2 cm depth',
          descriptionBn: '১–২ সে.মি. গভীরে সারি করে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing in prepared field',
      descriptionBn: 'তৈরি জমিতে বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 5,
      waterRequirementMm: 2, diseaseSusceptibility: 10,
      heatStressThreshold: 38, coldStressThreshold: 3,
      criticalOperations: [],
      description: 'Seed germination and emergence',
      descriptionBn: 'বীজের অঙ্কুরোদ্গম ও উদ্ভব',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 15,
      waterRequirementMm: 3, diseaseSusceptibility: 15,
      heatStressThreshold: 35, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'thin_mustard', name: 'Thinning', nameBn: 'পাতলা করা',
          type: 'weeding', priority: 'high',
          description: 'Thin seedlings to 8–10 cm spacing',
          descriptionBn: '৮–১০ সে.মি. দূরত্বে চারা পাতলা করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 25,
      waterRequirementMm: 4, diseaseSusceptibility: 25,
      heatStressThreshold: 33, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'mustard_fert', name: 'First Fertilizer (Urea + TSP)', nameBn: 'প্রথম সার (ইউরিয়া + টিএসপি)',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply urea and TSP at 20–25 DAS',
          descriptionBn: '২০–২৫ দিনে ইউরিয়া ও টিএসপি প্রয়োগ',
        },
        {
          id: 'mustard_weed', name: 'Weeding', nameBn: 'আগাছা দমন',
          type: 'weeding', priority: 'high',
          description: 'Manual or herbicide weeding at 20 DAS',
          descriptionBn: '২০ দিনে হাত দিয়ে বা আগাছানাশক প্রয়োগ',
        },
      ],
      description: 'Vegetative growth and rosette formation',
      descriptionBn: 'অবচয়ী বৃদ্ধি ও রোসেট গঠন',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 20,
      waterRequirementMm: 5, diseaseSusceptibility: 40,
      heatStressThreshold: 32, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'mustard_irrigation', name: 'Irrigation at Flowering', nameBn: 'ফুল আসার সময় সেচ',
          type: 'irrigation', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Apply light irrigation at 50% flowering',
          descriptionBn: '৫০% ফুল আসার সময় হালকা সেচ দিন',
        },
      ],
      description: 'Flowering and pollination',
      descriptionBn: 'পুষ্পোদ্গম ও পরাগায়ন',
    },
    {
      id: 'grain_filling', name: 'Grain Filling', nameBn: 'দানা ভরাট', durationDays: 15,
      waterRequirementMm: 3, diseaseSusceptibility: 30,
      heatStressThreshold: 34, coldStressThreshold: 5,
      criticalOperations: [],
      description: 'Silique filling and maturation',
      descriptionBn: 'সিলিকা ভরাট ও পরিপক্কতা',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 10,
      waterRequirementMm: 1, diseaseSusceptibility: 10,
      heatStressThreshold: 38, coldStressThreshold: 3,
      criticalOperations: [],
      description: 'Silique yellowing and seed hardening',
      descriptionBn: 'সিলিকা হলুদ হওয়া ও বীজ শক্ত হওয়া',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 40, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'harvest_mustard', name: 'Harvest Mustard', nameBn: 'সরিষা কাটুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20, maxWindSpeed: 20 },
          description: 'Harvest when 70–80% siliques turn yellowish-brown',
          descriptionBn: '৭০–৮০% সিলিকা হলুদ-বাদামী হলে কাটুন',
        },
      ],
      description: 'Harvest and threshing',
      descriptionBn: 'ফসল কাটা ও মড়াই',
    },
  ],
  totalDurationDays: 96,
  baseTemperature: 5,
  optimalTempRange: [15, 25],
  harvestWindow: { startDay: 90, endDay: 100 },
  optimalSowingWindow: { startMonth: 11, endMonth: 12 },
  waterRequirementTotal: 250,
  icon: '🌻',
  color: '#eab308',
};

// ────────────────────────────────────────────────────────────
// Potato (আলু) — Rabi vegetable crop
// ────────────────────────────────────────────────────────────
// Source: BARI Potato cultivation guide (Hossain et al., BARI 2020).
// Total duration: 90–110 days. Sown Nov–Dec, harvested Feb–Mar.

export const POTATO: CropConfig = {
  id: 'potato',
  name: 'Potato',
  nameBn: 'আলু',
  growthStages: [
    {
      id: 'sowing', name: 'Planting', nameBn: 'রোপণ', durationDays: 1,
      waterRequirementMm: 5, diseaseSusceptibility: 10,
      heatStressThreshold: 30, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'plant_potato', name: 'Plant Seed Tubers', nameBn: 'বীজ আলু রোপণ',
          type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 10, maxPrecipitationProbability: 30 },
          description: 'Plant disease-free seed tubers at 5–7 cm depth, 60 cm row spacing',
          descriptionBn: '৫–৭ সে.মি. গভীরে, ৬০ সে.মি. সারি ব্যবধানে রোগমুক্ত বীজ আলু রোপণ করুন',
        },
      ],
      description: 'Seed tuber planting',
      descriptionBn: 'বীজ আলু রোপণ',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 15,
      waterRequirementMm: 4, diseaseSusceptibility: 15,
      heatStressThreshold: 30, coldStressThreshold: 3,
      criticalOperations: [
        {
          id: 'potato_fert1', name: 'First Fertilizer', nameBn: 'প্রথম সার',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply basal fertilizer (TSP, MoP, Gypsum) at planting',
          descriptionBn: 'রোপণের সময় ভিটি সার (টিএসপি, এমওপি, জিপসাম) প্রয়োগ',
        },
      ],
      description: 'Sprout emergence and early growth',
      descriptionBn: 'অঙ্কুর বের হওয়া ও প্রাথমিক বৃদ্ধি',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 15,
      waterRequirementMm: 5, diseaseSusceptibility: 20,
      heatStressThreshold: 30, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'potato_weed1', name: 'First Weeding + Earthing Up', nameBn: 'প্রথম নিড়ানি ও মাটি তোলা',
          type: 'weeding', priority: 'high',
          description: 'Weed and earth up at 25 DAS',
          descriptionBn: '২৫ দিনে নিড়ানি ও মাটি তোলা',
        },
      ],
      description: 'Stolon and early leaf development',
      descriptionBn: 'স্টোলন ও প্রাথমিক পাতা বৃদ্ধি',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 25,
      waterRequirementMm: 6, diseaseSusceptibility: 35,
      heatStressThreshold: 28, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'potato_irrigation1', name: 'First Irrigation', nameBn: 'প্রথম সেচ',
          type: 'irrigation', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Irrigate at 30 DAS if soil moisture is low',
          descriptionBn: '৩০ দিনে মাটির আর্দ্রতা কম হলে সেচ দিন',
        },
        {
          id: 'potato_weed2', name: 'Second Weeding + Earthing Up', nameBn: 'দ্বিতীয় নিড়ানি ও মাটি তোলা',
          type: 'weeding', priority: 'high',
          description: 'Final earthing up at 45 DAS',
          descriptionBn: '৪৫ দিনে চূড়ান্ত মাটি তোলা',
        },
        {
          id: 'potato_fert2', name: 'Top Dressing (Urea)', nameBn: 'উপরি সার (ইউরিয়া)',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply urea top dressing at 30–35 DAS',
          descriptionBn: '৩০–৩৫ দিনে ইউরিয়া উপরি সার প্রয়োগ',
        },
      ],
      description: 'Rapid foliage growth and tuber initiation',
      descriptionBn: 'দ্রুত পাতা বৃদ্ধি ও কন্দ সৃষ্টি',
    },
    {
      id: 'grain_filling', name: 'Tuber Bulking', nameBn: 'কন্দ বৃদ্ধি', durationDays: 30,
      waterRequirementMm: 7, diseaseSusceptibility: 50,
      heatStressThreshold: 28, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'potato_late_blight_spray', name: 'Late Blight Fungicide', nameBn: 'লেট ব্লাইট ছত্রাকনাশক',
          type: 'pesticide', priority: 'critical',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 20, noRainForHours: 6 },
          description: 'Apply Mancozeb or Metalaxyl for late blight if humidity > 85%',
          descriptionBn: 'আর্দ্রতা ৮৫% এর বেশি হলে লেট ব্লাইটের জন্য ম্যানকোজেব বা মেটাল্যাক্সিল স্প্রে করুন',
        },
        {
          id: 'potato_irrigation2', name: 'Second Irrigation', nameBn: 'দ্বিতীয় সেচ',
          type: 'irrigation', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Irrigate at 55–60 DAS',
          descriptionBn: '৫৫–৬০ দিনে সেচ দিন',
        },
      ],
      description: 'Tuber bulking and starch accumulation',
      descriptionBn: 'কন্দ বৃদ্ধি ও স্টার্চ জমা',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 15,
      waterRequirementMm: 2, diseaseSusceptibility: 20,
      heatStressThreshold: 32, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'potato_stop_irrigation', name: 'Stop Irrigation', nameBn: 'সেচ বন্ধ করুন',
          type: 'irrigation', priority: 'high',
          description: 'Stop irrigation 15 days before harvest for skin set',
          descriptionBn: 'ফসল কাটার ১৫ দিন আগে চামড়া শক্ত করতে সেচ বন্ধ করুন',
        },
      ],
      description: 'Vine senescence and tuber skin maturation',
      descriptionBn: 'লতা শুকানো ও কন্দের চামড়া পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'harvest_potato', name: 'Harvest Potato', nameBn: 'আলু তুলুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20, maxWindSpeed: 20 },
          description: 'Harvest when vines fully senesced and skin is set',
          descriptionBn: 'লতা সম্পূর্ণ শুকানো ও চামড়া শক্ত হলে তুলুন',
        },
      ],
      description: 'Harvest and curing',
      descriptionBn: 'ফসল তোলা ও সুকানো',
    },
  ],
  totalDurationDays: 106,
  baseTemperature: 5,
  optimalTempRange: [15, 25],
  harvestWindow: { startDay: 95, endDay: 106 },
  optimalSowingWindow: { startMonth: 11, endMonth: 12 },
  waterRequirementTotal: 350,
  icon: '🥔',
  color: '#8b5cf6',
};

// ────────────────────────────────────────────────────────────
// Peanut / Groundnut (চীনাবাদাম) — Kharif oilseed crop
// ────────────────────────────────────────────────────────────
// Source: BARI Chinabadam cultivation guide (BARI 2018).
// Total duration: 110–125 days. Sown Dec–Jan, harvested Apr–May.

export const PEANUT: CropConfig = {
  id: 'peanut',
  name: 'Peanut',
  nameBn: 'চীনাবাদাম',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 4, diseaseSusceptibility: 5,
      heatStressThreshold: 42, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'sow_peanut', name: 'Sow Peanut Seeds', nameBn: 'চীনাবাদামের বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 18, maxPrecipitationProbability: 40 },
          description: 'Line-sow seeds at 30 cm row spacing, 15 cm plant spacing',
          descriptionBn: '৩০ সে.মি. সারি ব্যবধানে, ১৫ সে.মি. গাছ ব্যবধানে সারিতে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing',
      descriptionBn: 'বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 10,
      waterRequirementMm: 5, diseaseSusceptibility: 10,
      heatStressThreshold: 40, coldStressThreshold: 12,
      criticalOperations: [],
      description: 'Seed germination and emergence',
      descriptionBn: 'বীজের অঙ্কুরোদ্গম ও উদ্ভব',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 20,
      waterRequirementMm: 6, diseaseSusceptibility: 15,
      heatStressThreshold: 40, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'peanut_thin', name: 'Thinning', nameBn: 'পাতলা করা',
          type: 'weeding', priority: 'high',
          description: 'Thin to one plant per hill at 15 DAS',
          descriptionBn: '১৫ দিনে প্রতি গর্তে একটি চারা রেখে বাকি পাতলা করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative Growth', nameBn: 'অবচয়ী বৃদ্ধি', durationDays: 30,
      waterRequirementMm: 7, diseaseSusceptibility: 25,
      heatStressThreshold: 40, coldStressThreshold: 15,
      criticalOperations: [
        {
          id: 'peanut_weed', name: 'Weeding & Interculture',
          nameBn: 'আগাছা দমন',
          type: 'weeding', priority: 'high',
          description: 'Keep field weed-free during rapid growth',
          descriptionBn: 'দ্রুত বৃদ্ধির সময় ক্ষেত আগাছামুক্ত রাখুন',
        },
        {
          id: 'peanut_top_dress', name: 'Top Dressing (Urea)', nameBn: 'টপ ড্রেসিং (ইউরিয়া)',
          type: 'fertilizer', priority: 'medium',
          weatherConstraint: { maxPrecipitationProbability: 50 },
          description: 'Apply nitrogen top dressing at 40–50 DAS',
          descriptionBn: '৪০–৫০ দিনে নাইট্রোজেন টপ ড্রেসিং প্রয়োগ',
        },
      ],
      description: 'Rapid vegetative growth and fiber elongation',
      descriptionBn: 'দ্রুত অবচয়ী বৃদ্ধি ও তন্তু দীর্ঘায়ন',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 20,
      waterRequirementMm: 8, diseaseSusceptibility: 40,
      heatStressThreshold: 38, coldStressThreshold: 15,
      criticalOperations: [
        {
          id: 'peanut_irrigation', name: 'Irrigation at Flowering', nameBn: 'ফুল আসার সময় সেচ',
          type: 'irrigation', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Apply irrigation at flowering for peg penetration',
          descriptionBn: 'পেগ মাটিতে ঢোকার জন্য ফুল আসার সময় সেচ দিন',
        },
      ],
      description: 'Flowering and peg penetration',
      descriptionBn: 'পুষ্পোদ্গম ও পেগ প্রবেশ',
    },
    {
      id: 'grain_filling', name: 'Pod Development', nameBn: 'দানা ভরাট', durationDays: 20,
      waterRequirementMm: 6, diseaseSusceptibility: 35,
      heatStressThreshold: 40, coldStressThreshold: 15,
      criticalOperations: [],
      description: 'Pod development and kernel filling',
      descriptionBn: 'দানা বিকাশ ও ভরাট',
    },
    {
      id: 'ripening', name: 'Maturity', nameBn: 'পরিপক্কতা', durationDays: 10,
      waterRequirementMm: 2, diseaseSusceptibility: 15,
      heatStressThreshold: 42, coldStressThreshold: 15,
      criticalOperations: [],
      description: 'Plant maturity before harvest',
      descriptionBn: 'ফসল কাটার আগে পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 45, coldStressThreshold: 10,
      criticalOperations: [
        {
          id: 'harvest_peanut', name: 'Harvest & Retting', nameBn: 'ফসল কাটা ও রেটিং',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Cut close to ground and ret in water',
          descriptionBn: 'মাটির কাছাকাছি কেটে পানিতে রেটিং করুন',
        },
      ],
      description: 'Harvest and retting process',
      descriptionBn: 'ফসল কাটা ও রেটিং প্রক্রিয়া',
    },
  ],
  totalDurationDays: 116,
  baseTemperature: 12,
  optimalTempRange: [22, 30],
  harvestWindow: { startDay: 105, endDay: 116 },
  optimalSowingWindow: { startMonth: 12, endMonth: 1 },
  waterRequirementTotal: 450,
  icon: '🥜',
  color: '#d97706',
};

// ────────────────────────────────────────────────────────────
// Lentil (মসুর) — Rabi pulse crop
// ────────────────────────────────────────────────────────────
// Source: BARI Masur cultivation guide (BARI 2019).
// Total duration: 95–110 days. Sown Nov, harvested Feb–Mar.

export const LENTIL: CropConfig = {
  id: 'lentil',
  name: 'Lentil',
  nameBn: 'মসুর',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 3, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'sow_lentil', name: 'Sow Lentil Seeds', nameBn: 'মসুরের বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Broadcast or line-sow seeds at 30 cm row spacing',
          descriptionBn: '৩০ সে.মি. সারি ব্যবধানে সারিতে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing',
      descriptionBn: 'বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 7,
      waterRequirementMm: 2, diseaseSusceptibility: 10,
      heatStressThreshold: 35, coldStressThreshold: 3,
      criticalOperations: [],
      description: 'Seed germination',
      descriptionBn: 'বীজের অঙ্কুরোদ্গম',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 18,
      waterRequirementMm: 3, diseaseSusceptibility: 15,
      heatStressThreshold: 33, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'lentil_weed1', name: 'First Weeding', nameBn: 'প্রথম নিড়ানি',
          type: 'weeding', priority: 'high',
          description: 'Weed at 20–25 DAS',
          descriptionBn: '২০–২৫ দিনে নিড়ানি করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 25,
      waterRequirementMm: 3, diseaseSusceptibility: 25,
      heatStressThreshold: 30, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'lentil_fert', name: 'Basal Fertilizer (TSP, MoP)', nameBn: 'ভিটি সার (টিএসপি, এমওপি)',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply P and K as basal; rhizobium inoculation for N',
          descriptionBn: 'ভিটি সার হিসেবে ফসফরাস ও পটাশ প্রয়োগ; নাইট্রোজেনের জন্য রাইজোবিয়াম ইনোকুলেশন',
        },
      ],
      description: 'Vegetative growth',
      descriptionBn: 'অবচয়ী বৃদ্ধি',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 18,
      waterRequirementMm: 4, diseaseSusceptibility: 45,
      heatStressThreshold: 30, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'lentil_stemphylium', name: 'Stemphylium Blight Spray', nameBn: 'স্টেমফিলিয়াম ব্লাইট স্প্রে',
          type: 'pesticide', priority: 'critical',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25, noRainForHours: 6 },
          description: 'Apply Mancozeb if cool+foggy weather persists',
          descriptionBn: 'শীত ও কুয়াশাপূর্ণ আবহাওয়ায় ম্যানকোজেব স্প্রে করুন',
        },
      ],
      description: 'Flowering and pod setting',
      descriptionBn: 'পুষ্পোদ্গম ও শাঁস ধারণ',
    },
    {
      id: 'grain_filling', name: 'Grain Filling', nameBn: 'দানা ভরাট', durationDays: 18,
      waterRequirementMm: 2, diseaseSusceptibility: 30,
      heatStressThreshold: 32, coldStressThreshold: 5,
      criticalOperations: [],
      description: 'Pod filling',
      descriptionBn: 'শাঁস ভরাট',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 12,
      waterRequirementMm: 1, diseaseSusceptibility: 10,
      heatStressThreshold: 35, coldStressThreshold: 0,
      criticalOperations: [],
      description: 'Pod maturation',
      descriptionBn: 'শাঁস পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 4,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 38, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'harvest_lentil', name: 'Harvest Lentil', nameBn: 'মসুর কাটুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20, maxWindSpeed: 20 },
          description: 'Harvest when 80% pods turn brown',
          descriptionBn: '৮০% শাঁস বাদামী হলে কাটুন',
        },
      ],
      description: 'Harvest and threshing',
      descriptionBn: 'ফসল কাটা ও মড়াই',
    },
  ],
  totalDurationDays: 103,
  baseTemperature: 5,
  optimalTempRange: [15, 25],
  harvestWindow: { startDay: 95, endDay: 103 },
  optimalSowingWindow: { startMonth: 11, endMonth: 11 },
  waterRequirementTotal: 200,
  icon: '🫘',
  color: '#a3a3a3',
};

// ────────────────────────────────────────────────────────────
// Chickpea (ছোলা) — Rabi pulse crop
// ────────────────────────────────────────────────────────────
// Source: BARI Chhola cultivation guide (BARI 2019).
// Total duration: 100–115 days. Sown Nov, harvested Feb–Mar.

export const CHICKPEA: CropConfig = {
  id: 'chickpea',
  name: 'Chickpea',
  nameBn: 'ছোলা',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 3, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'sow_chickpea', name: 'Sow Chickpea Seeds', nameBn: 'ছোলার বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Line-sow seeds at 30 cm row spacing',
          descriptionBn: '৩০ সে.মি. সারি ব্যবধানে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing',
      descriptionBn: 'বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 7,
      waterRequirementMm: 2, diseaseSusceptibility: 10,
      heatStressThreshold: 35, coldStressThreshold: 3,
      criticalOperations: [],
      description: 'Germination',
      descriptionBn: 'অঙ্কুরোদ্গম',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 20,
      waterRequirementMm: 3, diseaseSusceptibility: 15,
      heatStressThreshold: 33, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'chickpea_weed1', name: 'First Weeding', nameBn: 'প্রথম নিড়ানি',
          type: 'weeding', priority: 'high',
          description: 'Weed at 25 DAS',
          descriptionBn: '২৫ দিনে নিড়ানি করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 30,
      waterRequirementMm: 3, diseaseSusceptibility: 25,
      heatStressThreshold: 30, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'chickpea_fert', name: 'Basal Fertilizer (TSP, MoP, Gypsum, Boron)',
          nameBn: 'ভিটি সার (টিএসপি, এমওপি, জিপসাম, বোরণ)',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply P, K, gypsum, and boron at sowing; rhizobium inoculation for N',
          descriptionBn: 'বপনের সময় ফসফরাস, পটাশ, জিপসাম ও বোরণ প্রয়োগ; নাইট্রোজেনের জন্য রাইজোবিয়াম ইনোকুলেশন',
        },
      ],
      description: 'Vegetative growth',
      descriptionBn: 'অবচয়ী বৃদ্ধি',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 15,
      waterRequirementMm: 4, diseaseSusceptibility: 40,
      heatStressThreshold: 30, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'chickpea_blight_spray', name: 'Botrytis Grey Mould Spray', nameBn: 'বট্রাইটিস ছত্রাকনাশক',
          type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25 },
          description: 'Apply carbendazim if cool+humid weather persists',
          descriptionBn: 'শীতল ও আর্দ্র আবহাওয়ায় কার্বেন্ডাজিম স্প্রে করুন',
        },
      ],
      description: 'Flowering',
      descriptionBn: 'পুষ্পোদ্গম',
    },
    {
      id: 'grain_filling', name: 'Grain Filling', nameBn: 'দানা ভরাট', durationDays: 20,
      waterRequirementMm: 2, diseaseSusceptibility: 30,
      heatStressThreshold: 32, coldStressThreshold: 5,
      criticalOperations: [],
      description: 'Pod filling',
      descriptionBn: 'শাঁস ভরাট',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 15,
      waterRequirementMm: 1, diseaseSusceptibility: 10,
      heatStressThreshold: 35, coldStressThreshold: 0,
      criticalOperations: [],
      description: 'Pod maturation',
      descriptionBn: 'শাঁস পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 38, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'harvest_chickpea', name: 'Harvest Chickpea', nameBn: 'ছোলা কাটুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20 },
          description: 'Harvest when leaves senesce and pods are dry',
          descriptionBn: 'পাতা শুকানো ও শাঁস শুকনা হলে কাটুন',
        },
      ],
      description: 'Harvest',
      descriptionBn: 'ফসল কাটা',
    },
  ],
  totalDurationDays: 113,
  baseTemperature: 5,
  optimalTempRange: [15, 25],
  harvestWindow: { startDay: 105, endDay: 113 },
  optimalSowingWindow: { startMonth: 11, endMonth: 11 },
  waterRequirementTotal: 180,
  icon: '🟤',
  color: '#92400e',
};

// ────────────────────────────────────────────────────────────
// Mungbean (মুগ) — Kharif pulse crop
// ────────────────────────────────────────────────────────────
// Source: BARI Mungbean cultivation guide (BARI 2020).
// Total duration: 65–75 days. Sown Mar–Apr or Aug–Sep.

export const MUNGBEAN: CropConfig = {
  id: 'mungbean',
  name: 'Mungbean',
  nameBn: 'মুগ',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 5, diseaseSusceptibility: 5,
      heatStressThreshold: 40, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'sow_mungbean', name: 'Sow Mungbean Seeds', nameBn: 'মুগের বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 15, maxPrecipitationProbability: 40 },
          description: 'Line-sow at 30 cm row spacing, 10 cm plant spacing',
          descriptionBn: '৩০ সে.মি. সারি ও ১০ সে.মি. গাছ ব্যবধানে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing',
      descriptionBn: 'বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 5,
      waterRequirementMm: 4, diseaseSusceptibility: 10,
      heatStressThreshold: 40, coldStressThreshold: 10,
      criticalOperations: [],
      description: 'Germination',
      descriptionBn: 'অঙ্কুরোদ্গম',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 10,
      waterRequirementMm: 5, diseaseSusceptibility: 15,
      heatStressThreshold: 38, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'mungbean_weed1', name: 'First Weeding', nameBn: 'প্রথম নিড়ানি',
          type: 'weeding', priority: 'high',
          description: 'Weed at 15 DAS',
          descriptionBn: '১৫ দিনে নিড়ানি করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 20,
      waterRequirementMm: 6, diseaseSusceptibility: 25,
      heatStressThreshold: 38, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'mungbean_fert', name: 'Basal Fertilizer (TSP, MoP)',
          nameBn: 'ভিটি সার (টিএসপি, এমওপি)',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply P and K as basal; rhizobium inoculation for N',
          descriptionBn: 'ভিটি সার হিসেবে ফসফরাস ও পটাশ; নাইট্রোজেনের জন্য রাইজোবিয়াম ইনোকুলেশন',
        },
      ],
      description: 'Vegetative growth',
      descriptionBn: 'অবচয়ী বৃদ্ধি',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 12,
      waterRequirementMm: 5, diseaseSusceptibility: 35,
      heatStressThreshold: 36, coldStressThreshold: 15,
      criticalOperations: [],
      description: 'Flowering',
      descriptionBn: 'পুষ্পোদ্গম',
    },
    {
      id: 'grain_filling', name: 'Pod Filling', nameBn: 'শাঁস ভরাট', durationDays: 12,
      waterRequirementMm: 4, diseaseSusceptibility: 30,
      heatStressThreshold: 38, coldStressThreshold: 12,
      criticalOperations: [],
      description: 'Pod filling',
      descriptionBn: 'শাঁস ভরাট',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 8,
      waterRequirementMm: 1, diseaseSusceptibility: 10,
      heatStressThreshold: 40, coldStressThreshold: 10,
      criticalOperations: [],
      description: 'Pod maturation',
      descriptionBn: 'শাঁস পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 4,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 42, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'harvest_mungbean', name: 'Harvest Mungbean', nameBn: 'মুগ কাটুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20 },
          description: 'Harvest when 80% pods turn black',
          descriptionBn: '৮০% শাঁস কালো হলে কাটুন',
        },
      ],
      description: 'Harvest',
      descriptionBn: 'ফসল কাটা',
    },
  ],
  totalDurationDays: 72,
  baseTemperature: 10,
  optimalTempRange: [25, 35],
  harvestWindow: { startDay: 65, endDay: 72 },
  optimalSowingWindow: { startMonth: 3, endMonth: 4 },
  waterRequirementTotal: 250,
  icon: '🟢',
  color: '#16a34a',
};

// ────────────────────────────────────────────────────────────
// Sesame (তিল) — Kharif oilseed crop
// ────────────────────────────────────────────────────────────
// Source: BARI Til cultivation guide (BARI 2018).
// Total duration: 80–95 days. Sown Mar–Apr.

export const SESAME: CropConfig = {
  id: 'sesame',
  name: 'Sesame',
  nameBn: 'তিল',
  growthStages: [
    {
      id: 'sowing', name: 'Sowing', nameBn: 'বপন', durationDays: 1,
      waterRequirementMm: 4, diseaseSusceptibility: 5,
      heatStressThreshold: 42, coldStressThreshold: 15,
      criticalOperations: [
        {
          id: 'sow_sesame', name: 'Sow Sesame Seeds', nameBn: 'তিলের বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 20, maxPrecipitationProbability: 40 },
          description: 'Broadcast or line-sow at 30 cm row spacing',
          descriptionBn: '৩০ সে.মি. সারি ব্যবধানে বীজ বুনুন',
        },
      ],
      description: 'Seed sowing',
      descriptionBn: 'বীজ বপন',
    },
    {
      id: 'germination', name: 'Germination', nameBn: 'অঙ্কুরোদ্গম', durationDays: 7,
      waterRequirementMm: 3, diseaseSusceptibility: 10,
      heatStressThreshold: 42, coldStressThreshold: 12,
      criticalOperations: [],
      description: 'Germination',
      descriptionBn: 'অঙ্কুরোদ্গম',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 15,
      waterRequirementMm: 4, diseaseSusceptibility: 15,
      heatStressThreshold: 40, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'sesame_thin', name: 'Thinning', nameBn: 'পাতলা করা',
          type: 'weeding', priority: 'high',
          description: 'Thin to 10 cm plant spacing at 15 DAS',
          descriptionBn: '১৫ দিনে ১০ সে.মি. দূরত্বে পাতলা করুন',
        },
      ],
      description: 'Seedling establishment',
      descriptionBn: 'চারা প্রতিষ্ঠা',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 25,
      waterRequirementMm: 5, diseaseSusceptibility: 25,
      heatStressThreshold: 40, coldStressThreshold: 15,
      criticalOperations: [
        {
          id: 'sesame_weed', name: 'Weeding', nameBn: 'আগাছা দমন',
          type: 'weeding', priority: 'high',
          description: 'Weed at 20–25 DAS',
          descriptionBn: '২০–২৫ দিনে নিড়ানি করুন',
        },
        {
          id: 'sesame_fert', name: 'Basal Fertilizer (Urea, TSP, MoP)',
          nameBn: 'ভিটি সার (ইউরিয়া, টিএসপি, এমওপি)',
          type: 'fertilizer', priority: 'medium',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply NPK at sowing',
          descriptionBn: 'বপনের সময় এনপিকে প্রয়োগ',
        },
      ],
      description: 'Vegetative growth',
      descriptionBn: 'অবচয়ী বৃদ্ধি',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 15,
      waterRequirementMm: 5, diseaseSusceptibility: 35,
      heatStressThreshold: 38, coldStressThreshold: 15,
      criticalOperations: [],
      description: 'Flowering and capsule setting',
      descriptionBn: 'পুষ্পোদ্গম ও শাঁস ধারণ',
    },
    {
      id: 'grain_filling', name: 'Capsule Filling', nameBn: 'শাঁস ভরাট', durationDays: 15,
      waterRequirementMm: 3, diseaseSusceptibility: 25,
      heatStressThreshold: 40, coldStressThreshold: 15,
      criticalOperations: [],
      description: 'Capsule filling',
      descriptionBn: 'শাঁস ভরাট',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 10,
      waterRequirementMm: 1, diseaseSusceptibility: 10,
      heatStressThreshold: 42, coldStressThreshold: 12,
      criticalOperations: [],
      description: 'Capsule maturation',
      descriptionBn: 'শাঁস পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 45, coldStressThreshold: 10,
      criticalOperations: [
        {
          id: 'harvest_sesame', name: 'Harvest Sesame', nameBn: 'তিল কাটুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20 },
          description: 'Harvest when lower capsules start splitting',
          descriptionBn: 'নিচের শাঁস ফেটে গেলে কাটুন',
        },
      ],
      description: 'Harvest',
      descriptionBn: 'ফসল কাটা',
    },
  ],
  totalDurationDays: 93,
  baseTemperature: 15,
  optimalTempRange: [25, 35],
  harvestWindow: { startDay: 85, endDay: 93 },
  optimalSowingWindow: { startMonth: 3, endMonth: 4 },
  waterRequirementTotal: 250,
  icon: '🌟',
  color: '#ca8a04',
};

// ────────────────────────────────────────────────────────────
// Chili (মরিচ) — spice crop
// ────────────────────────────────────────────────────────────
// Source: BARI Morich cultivation guide (BARI 2019).
// Total duration: 140–160 days (transplanted). Sown Sep–Oct, transplanted Oct–Nov.

export const CHILI: CropConfig = {
  id: 'chili',
  name: 'Chili',
  nameBn: 'মরিচ',
  growthStages: [
    {
      id: 'sowing', name: 'Nursery Sowing', nameBn: '�ার্সারি বপন', durationDays: 1,
      waterRequirementMm: 5, diseaseSusceptibility: 10,
      heatStressThreshold: 38, coldStressThreshold: 10,
      criticalOperations: [
        {
          id: 'sow_chili_nursery', name: 'Sow Seeds in Nursery', nameBn: 'নার্সারিতে বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { minTemperature: 20, maxPrecipitationProbability: 40 },
          description: 'Sow seeds in raised nursery beds',
          descriptionBn: 'উঁচু নার্সারি বেডে বীজ বুনুন',
        },
      ],
      description: 'Nursery seed sowing',
      descriptionBn: 'নার্সারি বীজ বপন',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 35,
      waterRequirementMm: 6, diseaseSusceptibility: 20,
      heatStressThreshold: 38, coldStressThreshold: 10,
      criticalOperations: [
        {
          id: 'transplant_chili', name: 'Transplant Seedlings', nameBn: 'চারা রোপণ',
          type: 'planting', priority: 'critical',
          weatherConstraint: { noRainForHours: 6, maxWindSpeed: 20 },
          description: 'Transplant 35-day-old seedlings at 60×45 cm spacing',
          descriptionBn: '৩৫ দিনের চারা ৬০×৪৫ সে.মি. দূরত্বে রোপণ করুন',
        },
      ],
      description: 'Nursery growth and transplanting',
      descriptionBn: 'নার্সারি বৃদ্ধি ও রোপণ',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 40,
      waterRequirementMm: 7, diseaseSusceptibility: 30,
      heatStressThreshold: 36, coldStressThreshold: 10,
      criticalOperations: [
        {
          id: 'chili_fert1', name: 'First Fertilizer Split', nameBn: 'প্রথম সার কিস্তি',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply first split of urea + MoP at 25 DAT',
          descriptionBn: 'রোপণের ২৫ দিন পর প্রথম কিস্তি ইউরিয়া + এমওপি প্রয়োগ',
        },
        {
          id: 'chili_weed1', name: 'Weeding', nameBn: 'নিড়ানি',
          type: 'weeding', priority: 'high',
          description: 'Weed at 25 and 45 DAT',
          descriptionBn: '২৫ ও ৪৫ দিনে নিড়ানি করুন',
        },
      ],
      description: 'Vegetative growth',
      descriptionBn: 'অবচয়ী বৃদ্ধি',
    },
    {
      id: 'flowering', name: 'Flowering', nameBn: 'পুষ্পোদ্গম', durationDays: 20,
      waterRequirementMm: 6, diseaseSusceptibility: 40,
      heatStressThreshold: 35, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'chili_fert2', name: 'Second Fertilizer Split', nameBn: 'দ্বিতীয় সার কিস্তি',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply second split of urea + MoP at flowering',
          descriptionBn: 'ফুল আসার সময় দ্বিতীয় কিস্তি ইউরিয়া + এমওপি প্রয়োগ',
        },
        {
          id: 'chili_pest_spray', name: 'Pest Control Spray', nameBn: 'পোকা দমন স্প্রে',
          type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25, noRainForHours: 6 },
          description: 'Apply imidacloprid for thrips/jassids at flowering',
          descriptionBn: 'ফুল আসার সময় থ্রিপস/জ্যাসিড দমনে ইমিডাক্লোপ্রিড স্প্রে',
        },
      ],
      description: 'Flowering',
      descriptionBn: 'পুষ্পোদ্গম',
    },
    {
      id: 'grain_filling', name: 'Fruit Setting', nameBn: 'ফল ধারণ', durationDays: 25,
      waterRequirementMm: 6, diseaseSusceptibility: 45,
      heatStressThreshold: 36, coldStressThreshold: 12,
      criticalOperations: [
        {
          id: 'chili_fungicide', name: 'Anthracnose Fungicide', nameBn: 'অ্যানথ্রাকনোজ ছত্রাকনাশক',
          type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25, noRainForHours: 6 },
          description: 'Apply carbendazim for anthracnose if humid+frequent rain',
          descriptionBn: 'আর্দ্রতা ও বৃষ্টির সময় অ্যানথ্রাকনোজের জন্য কার্বেন্ডাজিম স্প্রে',
        },
      ],
      description: 'Fruit development and maturation',
      descriptionBn: 'ফল বিকাশ ও পরিপক্কতা',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 20,
      waterRequirementMm: 3, diseaseSusceptibility: 20,
      heatStressThreshold: 38, coldStressThreshold: 10,
      criticalOperations: [],
      description: 'Fruit ripening and color development',
      descriptionBn: 'ফল পাকা ও রঙ পরিবর্তন',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 15,
      waterRequirementMm: 2, diseaseSusceptibility: 10,
      heatStressThreshold: 40, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'harvest_chili', name: 'Harvest Chili', nameBn: 'মরিচ তুলুন',
          type: 'harvest', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Harvest red ripe fruits in 3–4 pickings at 10-day intervals',
          descriptionBn: '১০ দিন পরপর ৩–৪ বার লাল পাকা মরিচ তুলুন',
        },
      ],
      description: 'Multiple harvests',
      descriptionBn: 'একাধিকবার ফসল তোলা',
    },
  ],
  totalDurationDays: 156,
  baseTemperature: 12,
  optimalTempRange: [20, 30],
  harvestWindow: { startDay: 125, endDay: 156 },
  optimalSowingWindow: { startMonth: 9, endMonth: 10 },
  waterRequirementTotal: 500,
  icon: '🌶️',
  color: '#dc2626',
};

// ────────────────────────────────────────────────────────────
// Onion (পেঁয়াজ) — Rabi vegetable crop
// ────────────────────────────────────────────────────────────
// Source: BARI Peyaj cultivation guide (BARI 2020).
// Total duration: 100–120 days (transplanted). Sown Oct–Nov, transplanted Nov–Dec.

export const ONION: CropConfig = {
  id: 'onion',
  name: 'Onion',
  nameBn: 'পেঁয়াজ',
  growthStages: [
    {
      id: 'sowing', name: 'Nursery Sowing', nameBn: 'নার্সারি বপন', durationDays: 1,
      waterRequirementMm: 4, diseaseSusceptibility: 10,
      heatStressThreshold: 35, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'sow_onion_nursery', name: 'Sow Seeds in Nursery', nameBn: 'নার্সারিতে বীজ বুনুন',
          type: 'planting', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Sow seeds in raised nursery beds',
          descriptionBn: 'উঁচু নার্সারি বেডে বীজ বুনুন',
        },
      ],
      description: 'Nursery seed sowing',
      descriptionBn: 'নার্সারি বীজ বপন',
    },
    {
      id: 'seedling', name: 'Seedling', nameBn: 'চারা', durationDays: 40,
      waterRequirementMm: 5, diseaseSusceptibility: 15,
      heatStressThreshold: 33, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'transplant_onion', name: 'Transplant Seedlings', nameBn: 'চারা রোপণ',
          type: 'planting', priority: 'critical',
          weatherConstraint: { noRainForHours: 6, maxWindSpeed: 15 },
          description: 'Transplant 40-day-old seedlings at 20×15 cm spacing',
          descriptionBn: '৪০ দিনের চারা ২০×১৫ সে.মি. দূরত্বে রোপণ করুন',
        },
      ],
      description: 'Nursery growth and transplanting',
      descriptionBn: 'নার্সারি বৃদ্ধি ও রোপণ',
    },
    {
      id: 'vegetative', name: 'Vegetative', nameBn: 'অবচয়ী', durationDays: 30,
      waterRequirementMm: 6, diseaseSusceptibility: 25,
      heatStressThreshold: 30, coldStressThreshold: 8,
      criticalOperations: [
        {
          id: 'onion_fert1', name: 'First Fertilizer Split', nameBn: 'প্রথম সার কিস্তি',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply urea top dressing at 15 DAT',
          descriptionBn: 'রোপণের ১৫ দিন পর ইউরিয়া উপরি সার প্রয়োগ',
        },
        {
          id: 'onion_weed1', name: 'Weeding', nameBn: 'নিড়ানি',
          type: 'weeding', priority: 'high',
          description: 'Weed at 20 DAT',
          descriptionBn: '২০ দিনে নিড়ানি করুন',
        },
      ],
      description: 'Leaf development',
      descriptionBn: 'পাতা বৃদ্ধি',
    },
    {
      id: 'grain_filling', name: 'Bulb Development', nameBn: 'কন্দ বৃদ্ধি', durationDays: 25,
      waterRequirementMm: 5, diseaseSusceptibility: 40,
      heatStressThreshold: 30, coldStressThreshold: 5,
      criticalOperations: [
        {
          id: 'onion_fert2', name: 'Second Fertilizer Split', nameBn: 'দ্বিতীয় সার কিস্তি',
          type: 'fertilizer', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 40 },
          description: 'Apply second urea split at bulb initiation (40 DAT)',
          descriptionBn: 'কন্দ সৃষ্টির সময় (৪০ দিন) দ্বিতীয় ইউরিয়া কিস্তি প্রয়োগ',
        },
        {
          id: 'onion_irrigation', name: 'Irrigation', nameBn: 'সেচ',
          type: 'irrigation', priority: 'high',
          weatherConstraint: { maxPrecipitationProbability: 30 },
          description: 'Irrigate at 10-day intervals during bulb development',
          descriptionBn: 'কন্দ বৃদ্ধির সময় ১০ দিন পরপর সেচ দিন',
        },
        {
          id: 'onion_purple_blotch', name: 'Purple Blotch Fungicide', nameBn: 'পার্পল ব্লচ ছত্রাকনাশক',
          type: 'pesticide', priority: 'high',
          weatherConstraint: { maxWindSpeed: 15, maxPrecipitationProbability: 25, noRainForHours: 6 },
          description: 'Apply Mancozeb for purple blotch if humid',
          descriptionBn: 'আর্দ্রতা থাকলে পার্পল ব্লচের জন্য ম্যানকোজেব স্প্রে',
        },
      ],
      description: 'Bulb initiation and development',
      descriptionBn: 'কন্দ সৃষ্টি ও বৃদ্ধি',
    },
    {
      id: 'ripening', name: 'Ripening', nameBn: 'পাকা', durationDays: 12,
      waterRequirementMm: 1, diseaseSusceptibility: 15,
      heatStressThreshold: 33, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'onion_stop_irrigation', name: 'Stop Irrigation', nameBn: 'সেচ বন্ধ করুন',
          type: 'irrigation', priority: 'high',
          description: 'Stop irrigation 15 days before harvest for curing',
          descriptionBn: 'ফসল কাটার ১৫ দিন আগে সুকানোর জন্য সেচ বন্ধ করুন',
        },
      ],
      description: 'Neck fall and bulb maturation',
      descriptionBn: 'গলা পড়া ও কন্দ পরিপক্কতা',
    },
    {
      id: 'harvest', name: 'Harvest', nameBn: 'ফসল কাটা', durationDays: 5,
      waterRequirementMm: 0, diseaseSusceptibility: 5,
      heatStressThreshold: 35, coldStressThreshold: 0,
      criticalOperations: [
        {
          id: 'harvest_onion', name: 'Harvest Onion', nameBn: 'পেঁয়াজ তুলুন',
          type: 'harvest', priority: 'critical',
          weatherConstraint: { maxPrecipitationProbability: 20, maxWindSpeed: 20 },
          description: 'Harvest when 70% tops have fallen',
          descriptionBn: '৭০% গাছের পাতা পড়ে গেলে তুলুন',
        },
      ],
      description: 'Harvest and curing',
      descriptionBn: 'ফসল তোলা ও সুকানো',
    },
  ],
  totalDurationDays: 113,
  baseTemperature: 5,
  optimalTempRange: [13, 25],
  harvestWindow: { startDay: 100, endDay: 113 },
  optimalSowingWindow: { startMonth: 10, endMonth: 11 },
  waterRequirementTotal: 300,
  icon: '🧅',
  color: '#c2410c',
};
