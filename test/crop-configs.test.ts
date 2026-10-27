import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getAllCropConfigs, getCropConfig } from '../src/engines/crop-configs.js';
import { createActiveCrop, getExpectedHarvestDate } from '../src/index.js';

// ────────────────────────────────────────────────────────────
// Validate that every new crop config is well-formed
// ────────────────────────────────────────────────────────────

const NEW_CROP_IDS = [
  'mustard', 'potato', 'peanut', 'lentil', 'chickpea',
  'mungbean', 'sesame', 'chili', 'onion',
];

const ALL_CROP_IDS = ['rice', 'wheat', 'jute', ...NEW_CROP_IDS];

describe('New crop configs: registration', () => {
  test('getAllCropConfigs returns 12 crops (3 original + 9 new)', () => {
    const all = getAllCropConfigs();
    assert.equal(all.length, 12, `expected 12 crops, got ${all.length}`);
  });

  test('every new cropId is registered in CROPS', () => {
    for (const id of NEW_CROP_IDS) {
      assert.doesNotThrow(
        () => getCropConfig(id),
        `getCropConfig('${id}') should not throw`,
      );
    }
  });

  test('every old cropId still works', () => {
    for (const id of ['rice', 'wheat', 'jute']) {
      assert.doesNotThrow(() => getCropConfig(id));
    }
  });

  test('unknown cropId still throws', () => {
    assert.throws(
      () => getCropConfig('banana'),
      /Unknown cropId.*banana/,
    );
  });
});

// ────────────────────────────────────────────────────────────
// Structural validation: every crop config
// ────────────────────────────────────────────────────────────

describe('Crop config structure', () => {
  for (const cropId of ALL_CROP_IDS) {
    test(`${cropId}: growthStages sum equals totalDurationDays`, () => {
      const config = getCropConfig(cropId);
      const stageSum = config.growthStages.reduce((s, st) => s + st.durationDays, 0);
      assert.equal(
        stageSum, config.totalDurationDays,
        `${cropId}: stage durations sum to ${stageSum} but totalDurationDays is ${config.totalDurationDays}`,
      );
    });

    test(`${cropId}: harvestWindow.startDay <= totalDurationDays`, () => {
      const config = getCropConfig(cropId);
      assert.ok(
        config.harvestWindow.startDay <= config.totalDurationDays,
        `${cropId}: harvestWindow.startDay ${config.harvestWindow.startDay} > totalDurationDays ${config.totalDurationDays}`,
      );
      assert.ok(
        config.harvestWindow.endDay >= config.harvestWindow.startDay,
        `${cropId}: harvestWindow endDay < startDay`,
      );
    });

    test(`${cropId}: has at least sowing + harvest stages`, () => {
      const config = getCropConfig(cropId);
      const stageIds = config.growthStages.map(s => s.id);
      assert.ok(stageIds.includes('sowing'), `${cropId}: missing 'sowing' stage`);
      assert.ok(stageIds.includes('harvest'), `${cropId}: missing 'harvest' stage`);
    });

    test(`${cropId}: every stage has heatStressThreshold and coldStressThreshold`, () => {
      const config = getCropConfig(cropId);
      for (const stage of config.growthStages) {
        assert.equal(typeof stage.heatStressThreshold, 'number',
          `${cropId}.${stage.id}: heatStressThreshold must be a number`);
        assert.equal(typeof stage.coldStressThreshold, 'number',
          `${cropId}.${stage.id}: coldStressThreshold must be a number`);
        assert.ok(stage.heatStressThreshold > stage.coldStressThreshold,
          `${cropId}.${stage.id}: heatStressThreshold (${stage.heatStressThreshold}) should be > coldStressThreshold (${stage.coldStressThreshold})`);
      }
    });

    test(`${cropId}: every operation has required fields`, () => {
      const config = getCropConfig(cropId);
      for (const stage of config.growthStages) {
        for (const op of stage.criticalOperations) {
          assert.ok(op.id, `${cropId}.${stage.id}: operation missing id`);
          assert.ok(op.name, `${cropId}.${stage.id}: operation missing name`);
          assert.ok(op.nameBn, `${cropId}.${stage.id}: operation missing nameBn`);
          assert.ok(op.type, `${cropId}.${stage.id}: operation missing type`);
          assert.ok(op.priority, `${cropId}.${stage.id}: operation missing priority`);
          assert.ok(op.description, `${cropId}.${stage.id}: operation missing description`);
          assert.ok(op.descriptionBn, `${cropId}.${stage.id}: operation missing descriptionBn`);
        }
      }
    });

    test(`${cropId}: optimalTempRange is a valid pair`, () => {
      const config = getCropConfig(cropId);
      const [min, max] = config.optimalTempRange;
      assert.ok(min < max, `${cropId}: optimalTempRange min (${min}) should be < max (${max})`);
    });

    test(`${cropId}: optimalSowingWindow is a valid month range`, () => {
      const config = getCropConfig(cropId);
      const { startMonth, endMonth } = config.optimalSowingWindow;
      assert.ok(startMonth >= 1 && startMonth <= 12, `${cropId}: invalid startMonth ${startMonth}`);
      assert.ok(endMonth >= 1 && endMonth <= 12, `${cropId}: invalid endMonth ${endMonth}`);
    });
  }
});

// ────────────────────────────────────────────────────────────
// createActiveCrop + getExpectedHarvestDate for new crops
// ────────────────────────────────────────────────────────────

describe('createActiveCrop with new crops', () => {
  const testCases: Array<{ cropId: string; sowingDate: string; expectedHarvest: string; stage: string }> = [
    { cropId: 'mustard', sowingDate: '2026-11-15', expectedHarvest: '2027-02-13', stage: 'vegetative' },
    { cropId: 'potato', sowingDate: '2026-11-20', expectedHarvest: '2027-02-23', stage: 'seedling' },
    { cropId: 'peanut', sowingDate: '2026-12-01', expectedHarvest: '2027-03-16', stage: 'seedling' },
    { cropId: 'lentil', sowingDate: '2026-11-10', expectedHarvest: '2027-02-13', stage: 'vegetative' },
    { cropId: 'chickpea', sowingDate: '2026-11-10', expectedHarvest: '2027-02-23', stage: 'vegetative' },
    { cropId: 'mungbean', sowingDate: '2026-03-15', expectedHarvest: '2026-05-19', stage: 'flowering' },
    { cropId: 'sesame', sowingDate: '2026-03-15', expectedHarvest: '2026-06-08', stage: 'flowering' },
    { cropId: 'chili', sowingDate: '2026-09-15', expectedHarvest: '2027-01-18', stage: 'vegetative' },
    { cropId: 'onion', sowingDate: '2026-10-15', expectedHarvest: '2027-01-23', stage: 'vegetative' },
  ];

  for (const tc of testCases) {
    test(`${tc.cropId}: createActiveCrop + getExpectedHarvestDate`, () => {
      const crop = createActiveCrop({
        cropId: tc.cropId,
        sowingDate: tc.sowingDate,
        currentStage: tc.stage as 'vegetative',
      });
      assert.equal(crop.cropId, tc.cropId);
      assert.equal(crop.config.id, tc.cropId);
      const harvest = getExpectedHarvestDate(crop);
      assert.equal(harvest, tc.expectedHarvest,
        `${tc.cropId}: sowingDate ${tc.sowingDate} + startDay ${crop.config.harvestWindow.startDay} = ${tc.expectedHarvest}, got ${harvest}`);
    });
  }

  test('potato crop uses grain_filling stage for tuber bulking', () => {
    const crop = createActiveCrop({
      cropId: 'potato', sowingDate: '2026-11-01', currentStage: 'grain_filling',
    });
    const stage = crop.config.growthStages.find(s => s.id === 'grain_filling');
    assert.ok(stage, 'potato should have a grain_filling stage (used for tuber bulking)');
    assert.equal(stage?.name, 'Tuber Bulking');
  });

  test('chili totalDurationDays is ~156 (longest crop)', () => {
    const config = getCropConfig('chili');
    assert.ok(config.totalDurationDays >= 140 && config.totalDurationDays <= 165,
      `chili totalDurationDays ${config.totalDurationDays} should be ~150`);
  });

  test('mungbean totalDurationDays is ~72 (shortest crop)', () => {
    const config = getCropConfig('mungbean');
    assert.ok(config.totalDurationDays >= 65 && config.totalDurationDays <= 80,
      `mungbean totalDurationDays ${config.totalDurationDays} should be ~72`);
  });
});

// ────────────────────────────────────────────────────────────
// Bilingual content check
// ────────────────────────────────────────────────────────────

describe('Bilingual content', () => {
  test('every crop has non-empty nameBn', () => {
    for (const crop of getAllCropConfigs()) {
      assert.ok(crop.nameBn, `${crop.id}: nameBn is empty`);
    }
  });

  test('every stage has non-empty nameBn and descriptionBn', () => {
    for (const crop of getAllCropConfigs()) {
      for (const stage of crop.growthStages) {
        assert.ok(stage.nameBn, `${crop.id}.${stage.id}: nameBn is empty`);
        assert.ok(stage.descriptionBn, `${crop.id}.${stage.id}: descriptionBn is empty`);
      }
    }
  });

  test('every operation has non-empty nameBn and descriptionBn', () => {
    for (const crop of getAllCropConfigs()) {
      for (const stage of crop.growthStages) {
        for (const op of stage.criticalOperations) {
          assert.ok(op.nameBn, `${crop.id}.${stage.id}.${op.id}: nameBn is empty`);
          assert.ok(op.descriptionBn, `${crop.id}.${stage.id}.${op.id}: descriptionBn is empty`);
        }
      }
    }
  });
});
