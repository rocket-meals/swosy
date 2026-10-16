import { defineHook } from '@directus/extensions-sdk';
import { DatabaseTypes } from 'repo-depkit-common';
import { ActionInitFilterEventHelper } from '../helpers/ActionInitFilterEventHelper';
import { DatabaseInitializedCheck } from '../helpers/DatabaseInitializedCheck';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { BackendTranslator, ProfileWithLanguage } from '../helpers/translations';
import { DirectusLegalDocumentsDatabase } from './DirectusLegalDocumentsDatabase';
import { LEGAL_DOCUMENTS } from './LegalDocuments';
import { LegalDocumentsSync } from './LegalDocumentsSync';
import { LegalEntities } from './LegalEntities';
import { LegalWikiProtection, LegalWikiViolation } from './LegalWikiProtection';

const HOOK_NAME = 'legal-documents-hook';
const WIKIS = 'wikis';
const WIKIS_TRANSLATIONS = 'wikis_translations';

/**
 * Writes the privacy policy, imprint, accessibility statement and terms and conditions from code into the wikis on every
 * start, and rejects manual changes to them (see `LegalWikiProtection`).
 */
export default defineHook(({ init, filter }, apiContext) => {
  const protection = new LegalWikiProtection();

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

  /**
   * Throws when a person (a request with a user) breaks the protection. Internal writes without a
   * user pass, the sync itself writes without events anyway.
   */
  async function rejectIfViolation(violation: LegalWikiViolation | null, eventContext: MyEventContext): Promise<void> {
    const userId = eventContext?.accountability?.user;
    if (!violation || !userId) {
      return;
    }
    const profile = await readProfileOfUser(userId);
    apiContext.logger.info(`${HOOK_NAME}: blocked a manual change of a legal document by user ${userId}`);
    throw createMyForbiddenError(BackendTranslator.getTranslatorForProfile(profile)(violation.key, violation.params));
  }

  /** The profile carries the language the error message is rendered in. Read as the system, the user may lack the permission. */
  async function readProfileOfUser(userId: string): Promise<ProfileWithLanguage | undefined> {
    try {
      const user = await new MyDatabaseHelper(apiContext).getUsersHelper().readOne(userId, { fields: ['id', 'profile.language'] });
      return typeof user?.profile === 'object' ? (user.profile as ProfileWithLanguage) : undefined;
    } catch {
      return undefined;
    }
  }

  /** The wikis the given translation rows belong to, read as the system. */
  async function readWikiIdsOfTranslations(keys: readonly unknown[]): Promise<unknown[]> {
    if (keys.length === 0) {
      return [];
    }
    try {
      const translations = new ItemsServiceHelper<DatabaseTypes.WikisTranslations>(new MyDatabaseHelper(apiContext), WIKIS_TRANSLATIONS);
      const rows = await translations.readByQuery({ filter: { id: { _in: keys as (string | number)[] } }, fields: ['wikis_id'], limit: -1 });
      return rows.map(row => row.wikis_id);
    } catch (error) {
      // Fail open: a protection feature must never make the backend unusable.
      apiContext.logger.warn(`${HOOK_NAME}: could not read the wikis of the translations: ${error}`);
      return [];
    }
  }

  filter(WIKIS + '.items.create', async (payload, _meta, eventContext: MyEventContext) => {
    await rejectIfViolation(protection.checkWikiCreate(payload as Record<string, unknown>), eventContext);
    return payload;
  });

  filter(WIKIS + '.items.update', async (payload, meta, eventContext: MyEventContext) => {
    await rejectIfViolation(protection.checkWikiUpdate((meta.keys as unknown[]) ?? [], payload as Record<string, unknown>), eventContext);
    return payload;
  });

  filter(WIKIS + '.items.delete', async (keys, _meta, eventContext: MyEventContext) => {
    await rejectIfViolation(protection.checkWikiDelete((keys as unknown[]) ?? []), eventContext);
    return keys;
  });

  filter(WIKIS_TRANSLATIONS + '.items.create', async (payload, _meta, eventContext: MyEventContext) => {
    await rejectIfViolation(protection.checkTranslationWrite([(payload as Record<string, unknown>).wikis_id]), eventContext);
    return payload;
  });

  filter(WIKIS_TRANSLATIONS + '.items.update', async (payload, meta, eventContext: MyEventContext) => {
    if (eventContext?.accountability?.user) {
      await rejectIfViolation(protection.checkTranslationWrite(await readWikiIdsOfTranslations((meta.keys as unknown[]) ?? [])), eventContext);
    }
    return payload;
  });

  filter(WIKIS_TRANSLATIONS + '.items.delete', async (keys, _meta, eventContext: MyEventContext) => {
    if (eventContext?.accountability?.user) {
      await rejectIfViolation(protection.checkTranslationWrite(await readWikiIdsOfTranslations((keys as unknown[]) ?? [])), eventContext);
    }
    return keys;
  });
});
