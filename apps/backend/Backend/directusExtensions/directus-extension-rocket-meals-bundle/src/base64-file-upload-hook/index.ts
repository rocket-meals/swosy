import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { RegisterFunctions } from '@directus/extensions';
import { ApiContext } from '../helpers/ApiContext';
import { processBase64FileField } from './Base64FileUploadHelper';
import { CollectionNames } from 'repo-depkit-common';

const HOOK_NAME = 'base64-file-upload-hook';

const DIRECTUS_COLLECTION_PREFIX = 'directus_';

/**
 * Special field types in Directus that hold a reference to a single file or
 * a many-to-many files relationship.
 */
const FILE_FIELD_SPECIALS = ['file', 'files'];

/**
 * Register filter hooks that convert base64 data-URI values into uploaded
 * Directus files before the item is persisted.
 *
 * At startup this hook iterates over all non-system collections, inspects
 * their fields, and registers a filter for every field that carries a
 * "file" or "files" special.  This way any collection that gets a new
 * file field is handled automatically without further code changes.
 */
function registerBase64FilterHook(
  registerFunctions: RegisterFunctions,
  apiContext: ApiContext,
  collectionName: string,
  fieldName: string
) {
  const events = [
    collectionName + '.items.create',
    collectionName + '.items.update',
  ];

  for (const event of events) {
    registerFunctions.filter(event, async (input, _meta, eventContext) => {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
      await processBase64FileField(input as Record<string, any>, fieldName, collectionName, myDatabaseHelper);
      return input;
    });
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(
  HOOK_NAME,
  async (registerFunctions, apiContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext);
    const fieldsHelper = myDatabaseHelper.getFieldsServiceHelper();
    const schema = await apiContext.getSchema();

    const collectionNames = Object.keys(schema.collections).filter(
      name => !name.startsWith(DIRECTUS_COLLECTION_PREFIX)
    );

    for (const collectionName of collectionNames) {
      let fields;
      try {
        fields = await fieldsHelper.getFieldsForCollection(collectionName as CollectionNames);
      } catch (error) {
        console.warn(`${HOOK_NAME}: Failed to get fields for collection "${collectionName}"`, error);
        continue;
      }

      for (const field of fields) {
        const special: string[] = field?.meta?.special ?? [];
        const hasFileSpecial = special.some(s => FILE_FIELD_SPECIALS.includes(s));
        if (hasFileSpecial) {
          registerBase64FilterHook(registerFunctions, apiContext, collectionName, field.field);
        }
      }
    }
  }
);
