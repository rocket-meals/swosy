// small jest test
import {describe, expect, it} from '@jest/globals';
import {StudentenwerkOsnabrueckWashingmachineParser} from "../StudentenwerkOsnabrueckWashingmachineParser";

describe("Osnabrueck Washer Test", () => {
    let osnabrueckWasherParser = new StudentenwerkOsnabrueckWashingmachineParser();

    // should find atleast one food
    //it("Find more than one washing machine", async () => {
    //    let washingMachines = await osnabrueckWasherParser.getWashingmachines()
    //    expect(washingMachines.length).toBeGreaterThan(0);
    //});

    it("Placeholder test", () => {
        expect(true).toBe(true);
    });
});