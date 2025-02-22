// small jest test
import {describe, expect, it} from '@jest/globals';
import {HannoverTL1HousingTestFileReader} from "../HannoverTL1HousingTestFileReader";
import {HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS} from "../HannoverTL1HousingFileReader";
import {FormHousingContractsWorkflowHannover} from "../FormHousingContractsWorkflowHannover";
import {FIELD_VALUE_KEY_PREFIX, KeyOfFormAnswersValueFieldsType} from "../../../FormImportTypes";

const testFileReader = new HannoverTL1HousingTestFileReader();

describe("Hannover Housing Form Test", () => {

    async function getData() {
        return await testFileReader.readData();
    }

    it("all entries should have a form answer with external_import_id and at least one value field", async () => {
        const housingContracts = await getData();
        for(let housingContract of housingContracts) {
            let internalCustomId = testFileReader.getHousingContractInternalCustomId(housingContract);
            for (let housingContractField of Object.values(HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS)) {
                let formAnswer = FormHousingContractsWorkflowHannover.getFormImportSyncFormAnswer(housingContract, housingContractField);
                expect(formAnswer).toBeDefined();
                expect(formAnswer.external_import_id).toBeDefined();
                // and at least one value field should be set
                let keys = Object.keys(formAnswer);
                let valueFieldsNames = keys.filter(key => key.startsWith(FIELD_VALUE_KEY_PREFIX));
                expect(valueFieldsNames.length).toBeGreaterThan(0);
                // and the value field should be set
                for (let valueFieldName of valueFieldsNames as KeyOfFormAnswersValueFieldsType[]) {
                    const value = formAnswer[valueFieldName];
                    expect(value).toBeDefined();
                }
            }
        }
    });

    it('test file should contain data', async () => {
        const data = await getData();
        expect(data).not.toBeNull();
        expect(data.length).toBeGreaterThan(0);
    });

    it("all entries should have all housing contract fields", async () => {
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
            const externalId = testFileReader.getHousingContractInternalCustomId(entry);
            expect(externalIds[externalId]).toBeUndefined();
            externalIds[externalId] = true;
        }
    })
});