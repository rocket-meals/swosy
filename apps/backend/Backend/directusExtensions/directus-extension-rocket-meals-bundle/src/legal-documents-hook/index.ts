import { defineHook } from '@directus/extensions-sdk';
import { ActionInitFilterEventHelper } from '../helpers/ActionInitFilterEventHelper';
import { DatabaseInitializedCheck } from '../helpers/DatabaseInitializedCheck';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { DirectusLegalDocumentsDatabase } from './DirectusLegalDocumentsDatabase';
import { LEGAL_DOCUMENTS } from './LegalDocuments';
import { LegalDocumentsSync } from './LegalDocumentsSync';
import { LegalEntities } from './LegalEntities';

const HOOK_NAME = 'legal-documents-hook';

/** Writes the privacy policy, imprint and accessibility statement from code into the wikis on every start. */
export default defineHook(({ init }, apiContext) => {
  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    try {
      if (!(await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(HOOK_NAME, apiContext))) {
        return;
      }
      const customerKey = EnvVariableHelper.getSyncForCustomer();
      const customer = LegalEntities.getCustomer(customerKey);
      if (!customer) {
        console.log(`${HOOK_NAME}: no legal entity for the customer "${customerKey ?? ''}" (SYNC_FOR_CUSTOMER), the legal documents in Directus stay untouched`);
        return;
      }
      const sync = new LegalDocumentsSync(new DirectusLegalDocumentsDatabase(new MyDatabaseHelper(apiContext)));
      const result = await sync.syncAll(LEGAL_DOCUMENTS, customer);
      const lines = result.log.length > 0 ? result.log : ['all legal documents are up to date'];
      for (const line of lines) {
        console.log(`${HOOK_NAME}: ${line}`);
      }
    } catch (error) {
      console.error(`${HOOK_NAME}: failed`, error);
    }
  });
});
