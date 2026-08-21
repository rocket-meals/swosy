import { afterEach, describe, expect, it } from '@jest/globals';
import { ALL_TRANSLATION_LANGUAGES, DashboardNameHelper, LanguageCodes } from 'repo-depkit-common';
import { BackendTranslationKeys, BackendTranslator } from '../helpers/translations';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { EnvVariableHelper, SyncForCustomerEnum } from '../helpers/EnvVariableHelper';

describe('dashboard protection texts', () => {
  it('renders the marker into the message instead of restating it', () => {
    const message = BackendTranslator.translate(BackendTranslationKeys.dashboard_system_edit_forbidden, LanguageCodes.DE, {
      marker: DashboardNameHelper.SYSTEM_NAME_MARKER,
    });

    expect(message).toContain(DashboardNameHelper.SYSTEM_NAME_MARKER);
    expect(message).not.toContain('{{marker}}');
  });

  it('renders in the language of the user', () => {
    const message = BackendTranslator.translate(BackendTranslationKeys.dashboard_system_panel_edit_forbidden, LanguageCodes.EN, {
      marker: DashboardNameHelper.SYSTEM_NAME_MARKER,
    });

    expect(message).toContain('system dashboard');
  });

  it('explains why a name with the system marker was rejected', () => {
    const message = BackendTranslator.translate(BackendTranslationKeys.dashboard_system_marker_forbidden, LanguageCodes.DE, {
      marker: DashboardNameHelper.SYSTEM_NAME_MARKER,
    });

    expect(message).toContain(DashboardNameHelper.SYSTEM_NAME_MARKER);
    expect(message).not.toContain('{{marker}}');
  });

  it('has a text in every language for every message', () => {
    const keys = [BackendTranslationKeys.dashboard_system_edit_forbidden, BackendTranslationKeys.dashboard_system_panel_edit_forbidden, BackendTranslationKeys.dashboard_system_delete_forbidden, BackendTranslationKeys.dashboard_system_marker_forbidden];

    for (const key of keys) {
      for (const language of ALL_TRANSLATION_LANGUAGES) {
        const message = BackendTranslator.translate(key, language, { marker: DashboardNameHelper.SYSTEM_NAME_MARKER });

        expect(message).not.toBe(key);
        expect(message).toContain(DashboardNameHelper.SYSTEM_NAME_MARKER);
      }
    }
  });
});

describe('MyDirectusError', () => {
  it('is recognized by Directus so the message reaches the client', () => {
    const error = createMyForbiddenError('Nicht erlaubt');
    // See isDirectusError() in @directus/errors - the check is purely name based.
    expect(error.name).toBe('DirectusError');
    expect(error.code).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
    expect(error.message).toBe('Nicht erlaubt');
    expect(error instanceof Error).toBe(true);
  });
});

describe('EnvVariableHelper.isTestServer', () => {
  const originalValue = process.env.SYNC_FOR_CUSTOMER;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.SYNC_FOR_CUSTOMER;
    } else {
      process.env.SYNC_FOR_CUSTOMER = originalValue;
    }
  });

  it('recognizes the test system', () => {
    process.env.SYNC_FOR_CUSTOMER = SyncForCustomerEnum.TEST;
    expect(EnvVariableHelper.isTestServer()).toBe(true);
  });

  it('treats every customer instance as a customer server', () => {
    for (const value of [SyncForCustomerEnum.OSNABRUECK, SyncForCustomerEnum.HANNOVER, 'irgendwas']) {
      process.env.SYNC_FOR_CUSTOMER = value;
      expect(EnvVariableHelper.isTestServer()).toBe(false);
    }
  });

  it('treats an unset value as a customer server', () => {
    delete process.env.SYNC_FOR_CUSTOMER;
    expect(EnvVariableHelper.isTestServer()).toBe(false);
  });
});
