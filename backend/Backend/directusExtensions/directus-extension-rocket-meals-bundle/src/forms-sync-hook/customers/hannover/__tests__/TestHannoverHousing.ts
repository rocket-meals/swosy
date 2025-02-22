// small jest test
import {describe, expect, it} from '@jest/globals';
import {HannoverTL1HousingTestFileReader} from "../HannoverTL1HousingTestFileReader";
import {HannoverTL1HousingReportParser} from "../HannoverTL1HousingReportParser";
import {HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS} from "../HannoverTL1HousingFileReader";

const testFileReader = new HannoverTL1HousingTestFileReader();
const parser = new HannoverTL1HousingReportParser(testFileReader);

describe("Hannover Housing Form Test", () => {

    async function getData() {
        return await testFileReader.readData();
    }

    it('test file should contain data', async () => {
        const data = await getData();
        expect(data).not.toBeNull();
        expect(data.length).toBeGreaterThan(0);
    });

    it("all entries should have all fields", async () => {
        const data = await getData();
        for (let entry of data) {
            // `keys` are the logical field names used by developers, while values are the actual field keys in the data.
            const keys = Object.values(HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS);

            for (let key of keys) {
                expect(entry).toHaveProperty(key);
                const entryValue = entry[key];
                expect(entryValue).not.toBeNull();
                expect(entryValue).not.toBeUndefined();
                expect(entryValue).not.toBe("");
                if (entryValue) {
                    expect(entryValue.length).toBeGreaterThan(0);
                }
            }
        }
    });


    it("all entries should have a unique external id", async () => {
        const data = await getData();
        const externalIds: {[key: string]: boolean} = {};
        for (let entry of data) {
            const externalId = testFileReader.getHousingContractExternalId(entry);
            expect(externalIds[externalId]).toBeUndefined();
            externalIds[externalId] = true;
        }
    })
});