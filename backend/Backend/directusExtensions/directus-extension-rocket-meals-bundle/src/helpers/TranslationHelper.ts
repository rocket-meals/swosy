const FIELD_TRANSLATION_LANGUAGE_CODE = "languages_code"; // TODO Import from directus-extension-auto-translation package the field name
const FIELD_LANGUAGE_ID = "code"; // TODO Import from directus-extension-auto-translation package the field name

class TranslationHelper {

    static async updateItemTranslations(item, itemJSON, item_primary_key_in_translation_table, specificItemService) {
        let itemWithTranslations = await specificItemService.readOne(item?.id, {"fields": ["*", "translations.*"]});
        let translationsFromParsing = itemJSON?.translations || {}
        /** translationsFromParsing is an object with the following structure:
         translations: [
             {
                 id: 5166,
                 foods_id: '6',
                 languages_code: 'de-DE',
                 name: 'Hallo mein Name ist'
             },
             {
                 id: 5167,
                 foods_id: '6',
                 languages_code: 'en-US',
                 name: 'Hi my name is'
             }
         ]
         */
        let remaining_translationsFromParsing = JSON.parse(JSON.stringify(translationsFromParsing)); //make a work copy
        /** remaining_translationsFromParsing is an object with the following structure:
         {
             "de-DE": {name ....},
             "en-US": {....}
         }
         */
        let createTranslations = [];
        let updateTranslations = [];
        let deleteTranslations = [];

        if (!!itemWithTranslations) {
            let existingTranslations = itemWithTranslations?.translations || [];


            let existingTranslationsDifferentFromParsing = false;
            let newTranslationsFromParsing = false;

            for (let existingTranslation of existingTranslations) { //check all existing translations
                let existingLanguageCode = existingTranslation?.[FIELD_TRANSLATION_LANGUAGE_CODE];
                let translationFromParsing = translationsFromParsing[existingLanguageCode];
                if (!!translationFromParsing) { //we also got a translation from the parse
                    /* Update translation */
                    translationFromParsing = JSON.parse(JSON.stringify(translationFromParsing)); //make a copy
                    delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language

                    if (existingTranslation?.name !== translationFromParsing?.name) {
                        existingTranslationsDifferentFromParsing = true;
                        console.log("existingTranslation is different from parsing")
                        console.log("existingTranslation: "+JSON.stringify(existingTranslation, null, 2))
                        console.log("translationFromParsing: "+JSON.stringify(translationFromParsing, null, 2))

                        updateTranslations.push({
                            id: existingTranslation?.id,
                            ...translationFromParsing,
                            [FIELD_TRANSLATION_LANGUAGE_CODE]: {[FIELD_LANGUAGE_ID]: existingLanguageCode}
                        });
                        //console.log("existingTranslation is different from parsing")
                    } else {
                        //translation is the same, do nothing
                        //console.log("translation is the same, do nothing")
                    }
                } else { //the parser dont provide a translation, we should delete it?
                    //TODO check if translation was generated or manually typed
                    delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language
                }
            }
            //check remaining translationsFromParsing, then put into createTranslations
            let remaining_languageKeys = Object.keys(remaining_translationsFromParsing);
            for (let i = 0; i < remaining_languageKeys?.length; i++) {
                let remaining_languageKey = remaining_languageKeys[i];
                let translationFromParsing = translationsFromParsing[remaining_languageKey];
                if(!!translationFromParsing){
                    newTranslationsFromParsing = true;
                    createTranslations.push({
                        [item_primary_key_in_translation_table]: item?.id,
                        ...translationFromParsing,
                        [FIELD_TRANSLATION_LANGUAGE_CODE]: {[FIELD_LANGUAGE_ID]: remaining_languageKey}
                    });
                }
            }

            let updateObject = {
                "translations": {
                    "create": createTranslations,
                    "update": updateTranslations,
                    "delete": deleteTranslations
                }
            };

            let updateNeeded = existingTranslationsDifferentFromParsing || newTranslationsFromParsing;
            if(updateNeeded){
                console.log("Update Translations for item with id: " + item?.id+ " - alias: "+item?.alias);
                console.log("Update Translations: create (" + createTranslations.length + "), update (" + updateTranslations.length + "), delete (" + deleteTranslations.length + ")");
                console.log("createTranslations: "+JSON.stringify(createTranslations, null, 2));
                console.log("updateTranslations: "+JSON.stringify(updateTranslations, null, 2));
                console.log("deleteTranslations: "+JSON.stringify(deleteTranslations, null, 2));
                //console.log(JSON.stringify(updateObject, null, 2));
                await specificItemService.updateOne(item?.id, {id: item?.id, ...updateObject});
            }
        }
    }

}