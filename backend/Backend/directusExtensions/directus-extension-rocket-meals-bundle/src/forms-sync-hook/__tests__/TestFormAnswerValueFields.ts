import {getCollectionPropertyDetails, getCollectionPropertyNames} from "../../databaseTypes/dataBaseTypesTsMorph";
import {CollectionNames} from "../../helpers/CollectionNames";
import {FIELD_VALUE_KEY_PREFIX, FormAnswersValueFieldKeys} from "../FormImportTypes";

describe("Form Answer Value Fields Test", () => {
    it("All value_ keys from KeyOfFormAnswersValueFieldsType should be present in FormAnswersValueFieldKeys (compile-time check)", () => {
        let collectionPropertiesNames = getCollectionPropertyNames(CollectionNames.FORM_ANSWERS);
        let filteredCollectionPropertiesNames = collectionPropertiesNames.filter(name => name.startsWith(FIELD_VALUE_KEY_PREFIX));
        // check if FormAnswersValueFieldKeys contains all value_ keys
        for (let valueKey of filteredCollectionPropertiesNames) {
            try{
                expect(valueKey in FormAnswersValueFieldKeys).toBeTruthy();
            } catch (e: any) {
                throw new Error(`FormAnswersValueFieldKeys does not contain key "${valueKey}"`);
            }
        }
    });
});