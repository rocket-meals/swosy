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
    date: overrides?.date ?? {...baseFoodofferInformationForParser.date},
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
    const differentDateFoodoffer = createFoodofferInformationForParser({
      date: {
        year: baseFoodoffer.date.year,
        month: baseFoodoffer.date.month,
        day: baseFoodoffer.date.day + 1,
      },
    });

    const hashOne = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(baseFoodoffer);
    const hashTwo = FoodParserHelper.getFoodofferHashFromFoodofferInformationForParser(differentDateFoodoffer);

    expect(hashOne).not.toBe(hashTwo);
  });
});
