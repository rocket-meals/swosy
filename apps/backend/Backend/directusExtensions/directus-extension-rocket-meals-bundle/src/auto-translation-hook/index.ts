import { Translator } from './Translator';
import { TranslatorSettings } from './TranslatorSettings';
import { DirectusCollectionTranslator } from './DirectusCollectionTranslator.js';
import { EventHelper } from '../helpers/EventHelper';
import { ApiContext } from '../helpers/ApiContext';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { EventContext } from '@directus/types';
import { CollectionNames } from 'repo-depkit-common';
import {MyDefineHook} from "../helpers/MyDefineHook";

export const scheduleNameAutoTranslation = 'auto-translation';

const DEV_MODE = false;

async function getAndInitItemsServiceCreatorAndTranslatorSettingsAndTranslatorAndSchema(myDatabaseHelper: MyDatabaseHelper) {
  let translatorSettings = new TranslatorSettings(myDatabaseHelper);
  let translator = new Translator(translatorSettings, myDatabaseHelper);
  await translator.init();
  return {
    translatorSettings: translatorSettings,
    translator: translator,
  };
}

async function getCurrentItemForTranslation(tablename: string, meta: any, translations_field: string, myDatabaseHelper: MyDatabaseHelper) {
  let currentItem: any = {}; //For create we don't have a current item
  let primaryKeys = meta?.keys || [];
  const itemsService = myDatabaseHelper.getItemsServiceHelper(tablename as CollectionNames);

  // Get the first primary key if available
  if (primaryKeys.length > 0) {
    const primaryKey = primaryKeys[0];
    //For update we have a current item
    currentItem = await itemsService.readOne(primaryKey, {
      fields: [translations_field + '.*'],
    });
  }

  return currentItem;
}

async function handleCreateOrUpdate(tablename: string, payload: any, meta: any, myDatabaseHelper: MyDatabaseHelper) {
  if (tablename === CollectionNames.AUTO_TRANSLATION_SETTINGS) {
    // Don't translate settings
    return payload;
  }

  let schemaToGetTranslationFields = await myDatabaseHelper.getSchema();

  let field_special_translation = 'translations';
  let table_schema = schemaToGetTranslationFields.collections[tablename];
  if (table_schema === undefined) {
    console.log('Table schema not found for ' + tablename);
    return payload;
  }

  const schema_fields = table_schema.fields;

  if (schema_fields === undefined) {
    console.log('Table schema fields not found for ' + tablename);
    return payload;
  }

  // search for all fields which are from type "special" and have "translations" in special array
  let translations_fields = Object.keys(schema_fields).filter(field => schema_fields?.[field]?.special?.includes(field_special_translation));

  let payloadContainsTranslations = false;
  for (let translations_field of translations_fields) {
    if (payload[translations_field] !== undefined) {
      payloadContainsTranslations = true;
      break;
    }
  }
  if (payloadContainsTranslations) {
    let { translatorSettings, translator } = await getAndInitItemsServiceCreatorAndTranslatorSettingsAndTranslatorAndSchema(myDatabaseHelper);

    let autoTranslate = await translatorSettings.isAutoTranslationEnabled();
    if (autoTranslate || DEV_MODE) {
      let modifiedPayload = payload;
      for (let translation_field of translations_fields) {
        let currentItem = await getCurrentItemForTranslation(tablename, meta, translation_field, myDatabaseHelper);
        modifiedPayload = await DirectusCollectionTranslator.modifyPayloadForTranslation(currentItem, modifiedPayload, translator, translatorSettings, myDatabaseHelper, tablename, translation_field);
      }

      return modifiedPayload;
    }
  }
  return payload;
}

function registerCollectionAutoTranslation(filter: any, apiContext: ApiContext) {
  let events = ['create', 'update'];
  for (let event of events) {
    filter('items.' + event, async (payload: any, meta: any, context: EventContext) => {
      let tablename = meta?.collection;
      let myDatabaseHelper = new MyDatabaseHelper(apiContext, context);
      return await handleCreateOrUpdate(tablename, payload, meta, myDatabaseHelper);
    });
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(scheduleNameAutoTranslation, async ({ filter, action, init, schedule }, apiContext) => {

  action(EventHelper.SERVER_START_EVENT, async (meta, context) => {
    let myDatabaseHelper = new MyDatabaseHelper(apiContext, context);

    try {
      let translatorSettings = new TranslatorSettings(myDatabaseHelper);
      let translator = new Translator(translatorSettings, myDatabaseHelper);
      await translator.init();

      registerCollectionAutoTranslation(filter, apiContext);
    } catch (err: any) {
      console.log(err);
    }
  });
});
