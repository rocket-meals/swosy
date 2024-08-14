// small jest test
import {describe, expect, it} from '@jest/globals';
import {FoodTL1Parser, RawTL1FoodofferType} from "../FoodTL1Parser";

describe("FoodTL1Parser Test", () => {

    it("Get Marking Labels from foodname", async () => {
        const exampleFoodName = "Strawberries (g, b) with Cream (2)"
        const markingLabelsDict = FoodTL1Parser.getMarkingLabelsDictFromFoodName(exampleFoodName);
        expect(markingLabelsDict).not.toBeNull();
        expect(markingLabelsDict).not.toBeUndefined();
        expect(markingLabelsDict).toHaveProperty('g');
        expect(markingLabelsDict).toHaveProperty('b');
        expect(markingLabelsDict).toHaveProperty('2');
    });

    it("Sanitize Foodname from Marking labels", async () => {
        const exampleFoodName = "Strawberries (g, b,) with Cream (2)"
        const expectedSanitizedFoodName = "Strawberries with Cream";
        const sanitizedFoodName = FoodTL1Parser.sanitizeFoodNameFromMarkingLabels(exampleFoodName);
        expect(sanitizedFoodName).not.toContain("(");
        expect(sanitizedFoodName).not.toContain(")");
        expect(sanitizedFoodName).not.toContain("(g, b,)");
        expect(sanitizedFoodName).not.toContain("(2)");
        expect(sanitizedFoodName).toBe(expectedSanitizedFoodName);
    });

    // Nutrition values
    it("Nutrition values parsing", async () => {
        // "NAEHRWERTEJEPORT": "Brennwert=612 kJ (146 kcal), Fett=1,1g, davon gesättigte Fettsäuren=0,6g, Kohlenhydrate=19,8g, davon Zucker=18,8g, Ballaststoffe=0,0g, Eiweiß=12,8g, Salz=0,1g,"
        const exampleParsedReportItem: RawTL1FoodofferType = {
            [FoodTL1Parser.DEFAULT_NUTRITIONS_FIELD] : "Brennwert=612 kJ (146 kcal), Fett=1,1g, davon gesättigte Fettsäuren=0,6g, Kohlenhydrate=19,8g, davon Zucker=18,8g, Ballaststoffe=0,0g, Eiweiß=12,8g, Salz=0,1g,"
        }

        let parsedNutritionValues = FoodTL1Parser.getFoodNutritionValuesFromRawTL1Foodoffer(exampleParsedReportItem);
        expect(parsedNutritionValues).not.toBeNull();
        expect(parsedNutritionValues).not.toBeUndefined();
        expect(parsedNutritionValues?.calories_kcal).toBe(146);
        expect(parsedNutritionValues?.fat_g).toBe(1.1);
        expect(parsedNutritionValues?.saturated_fat_g).toBe(0.6);
        expect(parsedNutritionValues?.carbohydrate_g).toBe(19.8);
        expect(parsedNutritionValues?.sugar_g).toBe(18.8);
        expect(parsedNutritionValues?.fiber_g).toBe(0);
        expect(parsedNutritionValues?.protein_g).toBe(12.8);
        expect(parsedNutritionValues?.sodium_g).toBe(0.1);

    });


});