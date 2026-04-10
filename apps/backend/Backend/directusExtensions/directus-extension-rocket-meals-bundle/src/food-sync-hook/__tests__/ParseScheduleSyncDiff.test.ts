import {describe, expect, it} from '@jest/globals';
import {FoodofferDateType, FoodParserHelper, FoodoffersTypeForParser} from '../FoodParserInterface';
import {ParseSchedule} from '../ParseSchedule';
import {DatabaseTypes} from 'repo-depkit-common';

type PartialFoodofferForParser = Partial<FoodoffersTypeForParser>;

const baseFoodofferInformationForParser: FoodoffersTypeForParser = {
  basicFoodofferData: {
    alias: 'Sample Foodoffer',
    price_employee: 4.5,
    price_guest: 6,
    price_student: 3.5,
    foodoffer_components: [],
  },
  attribute_values: [],
  marking_external_identifiers: ['b', 'a', 'c'],
  category_external_identifier: 'main',
  date: {
    year: 2024,
    month: 10,
    day: 5,
  },
  canteen_external_identifier: 'canteen-01',
  food_id: 'food-01',
  components: [],
};

function createFoodofferInformationForParser(overrides?: PartialFoodofferForParser): FoodoffersTypeForParser {
  return {
    basicFoodofferData: {
      ...baseFoodofferInformationForParser.basicFoodofferData,
      ...(overrides?.basicFoodofferData ?? {}),
    },
    attribute_values: overrides?.attribute_values ?? [...baseFoodofferInformationForParser.attribute_values],
    marking_external_identifiers:
      overrides?.marking_external_identifiers ?? [...baseFoodofferInformationForParser.marking_external_identifiers],
    category_external_identifier:
      overrides?.category_external_identifier ?? baseFoodofferInformationForParser.category_external_identifier,
    date: overrides?.date ?? {...baseFoodofferInformationForParser.date} as FoodofferDateType,
    canteen_external_identifier:
      overrides?.canteen_external_identifier ?? baseFoodofferInformationForParser.canteen_external_identifier,
    food_id: overrides?.food_id ?? baseFoodofferInformationForParser.food_id,
    components: overrides?.components ?? [...baseFoodofferInformationForParser.components],
  };
}

function createExistingFoodoffer(resultHash: string | null): DatabaseTypes.Foodoffers {
  return {
    id: 'foodoffer-' + (resultHash ?? 'no-hash'),
    result_hash: resultHash,
  } as DatabaseTypes.Foodoffers;
}

describe('ParseSchedule.computeFoodofferSyncDiff', () => {
  it('marks all report foodoffers as toCreate when no existing foodoffers exist', () => {
    const foodoffer1 = createFoodofferInformationForParser();
    const foodoffer2 = createFoodofferInformationForParser({food_id: 'food-02'});

    const hash1 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer1);
    const hash2 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer2);

    const reportDict: Record<string, FoodoffersTypeForParser> = {
      [hash1]: foodoffer1,
      [hash2]: foodoffer2,
    };
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {};
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    expect(result.toCreateResultHashes).toHaveLength(2);
    expect(result.toCreateResultHashes).toContain(hash1);
    expect(result.toCreateResultHashes).toContain(hash2);
    expect(result.toDeleteFoodoffers).toHaveLength(0);
    expect(result.toSkipResultHashes).toHaveLength(0);
  });

  it('marks all existing foodoffers as toDelete when no report foodoffers exist', () => {
    const existing1 = createExistingFoodoffer('hash-a');
    const existing2 = createExistingFoodoffer('hash-b');

    const reportDict: Record<string, FoodoffersTypeForParser> = {};
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {
      'hash-a': existing1,
      'hash-b': existing2,
    };
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    expect(result.toDeleteFoodoffers).toHaveLength(2);
    expect(result.toDeleteFoodoffers).toContain(existing1);
    expect(result.toDeleteFoodoffers).toContain(existing2);
    expect(result.toCreateResultHashes).toHaveLength(0);
    expect(result.toSkipResultHashes).toHaveLength(0);
  });

  it('marks matching foodoffers as toSkip', () => {
    const foodoffer1 = createFoodofferInformationForParser();
    const hash1 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer1);
    const existing1 = createExistingFoodoffer(hash1);

    const reportDict: Record<string, FoodoffersTypeForParser> = {
      [hash1]: foodoffer1,
    };
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {
      [hash1]: existing1,
    };
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    expect(result.toSkipResultHashes).toHaveLength(1);
    expect(result.toSkipResultHashes).toContain(hash1);
    expect(result.toDeleteFoodoffers).toHaveLength(0);
    expect(result.toCreateResultHashes).toHaveLength(0);
  });

  it('correctly handles mixed scenario: some to create, some to delete, some to skip', () => {
    // Report has foodoffer A (unchanged) and foodoffer B (new)
    const foodofferA = createFoodofferInformationForParser({food_id: 'food-A'});
    const foodofferB = createFoodofferInformationForParser({food_id: 'food-B'});
    const hashA = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodofferA);
    const hashB = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodofferB);

    // Existing has foodoffer A (unchanged) and foodoffer C (removed from report)
    const existingA = createExistingFoodoffer(hashA);
    const existingC = createExistingFoodoffer('hash-C');

    const reportDict: Record<string, FoodoffersTypeForParser> = {
      [hashA]: foodofferA,
      [hashB]: foodofferB,
    };
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {
      [hashA]: existingA,
      'hash-C': existingC,
    };
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    // A should be skipped
    expect(result.toSkipResultHashes).toHaveLength(1);
    expect(result.toSkipResultHashes).toContain(hashA);

    // B should be created
    expect(result.toCreateResultHashes).toHaveLength(1);
    expect(result.toCreateResultHashes).toContain(hashB);

    // C should be deleted
    expect(result.toDeleteFoodoffers).toHaveLength(1);
    expect(result.toDeleteFoodoffers).toContain(existingC);
  });

  it('deletes existing foodoffers without result_hash (legacy data)', () => {
    const foodoffer1 = createFoodofferInformationForParser();
    const hash1 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer1);

    const legacyFoodoffer = createExistingFoodoffer(null);

    const reportDict: Record<string, FoodoffersTypeForParser> = {
      [hash1]: foodoffer1,
    };
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {};
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [legacyFoodoffer];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    // Legacy foodoffer should be deleted
    expect(result.toDeleteFoodoffers).toHaveLength(1);
    expect(result.toDeleteFoodoffers).toContain(legacyFoodoffer);

    // Report foodoffer should be created
    expect(result.toCreateResultHashes).toHaveLength(1);
    expect(result.toCreateResultHashes).toContain(hash1);

    expect(result.toSkipResultHashes).toHaveLength(0);
  });

  it('handles empty inputs', () => {
    const reportDict: Record<string, FoodoffersTypeForParser> = {};
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {};
    const existingWithoutHash: DatabaseTypes.Foodoffers[] = [];

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, existingWithoutHash);

    expect(result.toDeleteFoodoffers).toHaveLength(0);
    expect(result.toSkipResultHashes).toHaveLength(0);
    expect(result.toCreateResultHashes).toHaveLength(0);
  });

  it('result_hash for foodoffer is deterministic and used correctly in diff', () => {
    // Create two identical foodoffers and verify they produce the same hash
    const foodoffer1 = createFoodofferInformationForParser();
    const foodoffer2 = createFoodofferInformationForParser();

    const hash1 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer1);
    const hash2 = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodoffer2);

    expect(hash1).toBe(hash2);

    // If an existing foodoffer has this hash, the report foodoffer should be skipped
    const existing = createExistingFoodoffer(hash1);

    const reportDict: Record<string, FoodoffersTypeForParser> = {
      [hash1]: foodoffer1,
    };
    const existingDict: Record<string, DatabaseTypes.Foodoffers> = {
      [hash1]: existing,
    };

    const result = ParseSchedule.computeFoodofferSyncDiff(reportDict, existingDict, []);

    expect(result.toSkipResultHashes).toHaveLength(1);
    expect(result.toCreateResultHashes).toHaveLength(0);
    expect(result.toDeleteFoodoffers).toHaveLength(0);
  });
});
