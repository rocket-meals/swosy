import { CollectionNames } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { RegisterFunctions } from '@directus/extensions';
import { ApiContext } from '../helpers/ApiContext';
import { processBase64FileField } from './Base64FileUploadHelper';

const HOOK_NAME = 'base64-file-upload-hook';

/**
 * The field name on the form_answers collection that holds a single image / signature.
 */
const FORM_ANSWERS_IMAGE_FIELD = 'value_image';

/**
 * Register filter hooks that convert base64 data-URI values into uploaded
 * Directus files before the item is persisted.
 *
 * Currently wired up for:
 *   • form_answers.value_image  (create + update)
 *
 * To support additional collections / fields, add more
 * `registerBase64FilterHook` calls below.
 */
function registerBase64FilterHook(
  registerFunctions: RegisterFunctions,
  apiContext: ApiContext,
  collectionName: CollectionNames,
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
    // form_answers → value_image (used for signatures and single-image fields)
    registerBase64FilterHook(
      registerFunctions,
      apiContext,
      CollectionNames.FORM_ANSWERS,
      FORM_ANSWERS_IMAGE_FIELD
    );
  }
);
