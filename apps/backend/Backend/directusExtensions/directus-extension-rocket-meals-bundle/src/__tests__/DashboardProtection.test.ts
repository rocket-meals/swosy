import { afterEach, describe, expect, it } from '@jest/globals';
import { ServerHelper, SystemDashboardHelper } from 'repo-depkit-common';
import { buildProtectedDashboardMessage, buildProtectedPanelMessage } from '../helpers/DashboardProtectionHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';

describe('DashboardProtectionHelper', () => {
  it('names the affected dashboards in the error message', () => {
    const message = buildProtectedDashboardMessage(['Mensen (System)', 'Speisen (System)']);
    expect(message).toContain('Mensen (System), Speisen (System)');
    expect(message).toContain('neues Dashboard');
  });

  it('explains the marker in the panel message', () => {
    const message = buildProtectedPanelMessage(['Mensen (System)']);
    expect(message).toContain('System-Dashboard');
    expect(message).toContain(SystemDashboardHelper.SYSTEM_NAME_SUFFIX);
  });

  it('builds a message even without known names', () => {
    expect(buildProtectedDashboardMessage([])).not.toContain('()');
    expect(buildProtectedPanelMessage([''])).not.toContain('()');
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

describe('EnvVariableHelper dashboard protection', () => {
  const originalProtection = process.env.DASHBOARD_PROTECTION;
  const originalPublicUrl = process.env.PUBLIC_URL;

  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  };

  afterEach(() => {
    restore('DASHBOARD_PROTECTION', originalProtection);
    restore('PUBLIC_URL', originalPublicUrl);
  });

  it('recognizes the test server by its public url', () => {
    process.env.PUBLIC_URL = ServerHelper.TEST_SERVER_CONFIG.server_url;
    expect(EnvVariableHelper.isTestServer()).toBe(true);

    process.env.PUBLIC_URL = `${ServerHelper.TEST_SERVER_CONFIG.server_url}/`;
    expect(EnvVariableHelper.isTestServer()).toBe(true);

    process.env.PUBLIC_URL = ServerHelper.SWOSY_SERVER_CONFIG.server_url;
    expect(EnvVariableHelper.isTestServer()).toBe(false);

    delete process.env.PUBLIC_URL;
    expect(EnvVariableHelper.isTestServer()).toBe(false);
  });

  it('protects everything but the test server by default', () => {
    delete process.env.DASHBOARD_PROTECTION;

    process.env.PUBLIC_URL = ServerHelper.SWOSY_SERVER_CONFIG.server_url;
    expect(EnvVariableHelper.isDashboardProtectionEnabled()).toBe(true);

    process.env.PUBLIC_URL = ServerHelper.TEST_SERVER_CONFIG.server_url;
    expect(EnvVariableHelper.isDashboardProtectionEnabled()).toBe(false);
  });

  it('can be overridden by the environment', () => {
    process.env.PUBLIC_URL = ServerHelper.SWOSY_SERVER_CONFIG.server_url;
    for (const value of ['false', 'FALSE', '0', 'no', 'off']) {
      process.env.DASHBOARD_PROTECTION = value;
      expect(EnvVariableHelper.isDashboardProtectionEnabled()).toBe(false);
    }

    process.env.PUBLIC_URL = ServerHelper.TEST_SERVER_CONFIG.server_url;
    process.env.DASHBOARD_PROTECTION = 'true';
    expect(EnvVariableHelper.isDashboardProtectionEnabled()).toBe(true);
  });
});
