import {describe, expect, it} from '@jest/globals';
import {FoodParserHelper, FoodoffersTypeForParser} from '../FoodParserInterface';

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
    date: 'date' in (overrides ?? {}) ? (overrides?.date ?? null) : {...baseFoodofferInformationForParser.date},
    canteen_external_identifier:
      overrides?.canteen_external_identifier ?? baseFoodofferInformationForParser.canteen_external_identifier,
    food_id: overrides?.food_id ?? baseFoodofferInformationForParser.food_id,
    components: overrides?.components ?? [...baseFoodofferInformationForParser.components],
  };
}

describe('FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser', () => {
  it('creates identical hashes for equivalent foodoffers regardless of date instances or marking order', () => {
    const baseFoodoffer = createFoodofferInformationForParser();
    const reorderedMarkingsFoodoffer = createFoodofferInformationForParser({
      marking_external_identifiers: ['c', 'b', 'a'],
      date: {...baseFoodoffer.date},
    });

    const hashOne = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(baseFoodoffer);
    const hashTwo = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(reorderedMarkingsFoodoffer);

    expect(hashOne).toBe(hashTwo);
  });

  it('creates different hashes when critical fields change', () => {
    const baseFoodoffer = createFoodofferInformationForParser();
    const baseDate = baseFoodoffer.date!;
    const differentDateFoodoffer = createFoodofferInformationForParser({
      date: {
        year: baseDate.year,
        month: baseDate.month,
        day: baseDate.day + 1,
      },
    });

    const hashOne = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(baseFoodoffer);
    const hashTwo = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(differentDateFoodoffer);

    expect(hashOne).not.toBe(hashTwo);
  });

  it('creates identical hashes for foodoffers with null date regardless of original date', () => {
    const foodofferWithNullDate = createFoodofferInformationForParser({date: null});
    const foodofferWithDifferentNullDate = createFoodofferInformationForParser({
      date: null,
      marking_external_identifiers: ['c', 'b', 'a'],
    });
    // A foodoffer that originally had a real date but was nulled out (simulates import-without-date normalization)
    const foodofferOriginallyWithDateThenNulled = createFoodofferInformationForParser({date: null});

    const hashNullOne = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodofferWithNullDate);
    const hashNullTwo = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodofferOriginallyWithDateThenNulled);
    const hashNullDifferentMarkings = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(foodofferWithDifferentNullDate);
    const hashWithRealDate = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(createFoodofferInformationForParser());

    // Same content with null date → same hash
    expect(hashNullOne).toBe(hashNullTwo);
    // null date and real date → different hash
    expect(hashNullOne).not.toBe(hashWithRealDate);
    // null date with same markings reordered → same hash (normalization still applies)
    expect(hashNullOne).toBe(hashNullDifferentMarkings);
  });
});
