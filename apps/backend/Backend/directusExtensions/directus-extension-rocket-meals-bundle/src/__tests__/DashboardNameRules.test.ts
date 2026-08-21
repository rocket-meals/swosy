import { describe, expect, it } from '@jest/globals';
import { DashboardNameHelper } from 'repo-depkit-common';
import { buildServerDashboardName, buildSystemDashboardName } from '../helpers/DashboardNameRules';
import { SyncForCustomerEnum } from '../helpers/EnvVariableHelper';

describe('buildSystemDashboardName', () => {
  it('marks what the ADMIN_EMAIL user creates as a system dashboard', () => {
    expect(buildSystemDashboardName('App')).toBe('App [System]');
    expect(buildSystemDashboardName('App [System]')).toBe('App [System]');
  });

  it('replaces the marker of a server, so the admin can turn a test dashboard into a system one', () => {
    expect(buildSystemDashboardName(`App [${SyncForCustomerEnum.TEST}]`)).toBe('App [System]');
    expect(buildSystemDashboardName(`App [${SyncForCustomerEnum.OSNABRUECK}]`)).toBe('App [System]');
  });

  it('puts the marker behind the "(copy)" Directus appends while duplicating', () => {
    expect(buildSystemDashboardName(`App [${SyncForCustomerEnum.TEST}] (copy)`)).toBe('App (copy) [System]');
    expect(buildSystemDashboardName('App [System] (copy)')).toBe('App (copy) [System]');
  });
});

describe('buildServerDashboardName', () => {
  it('marks a dashboard with the key of its server', () => {
    expect(buildServerDashboardName('Auswertung', SyncForCustomerEnum.OSNABRUECK)).toBe(`Auswertung [${SyncForCustomerEnum.OSNABRUECK}]`);
    expect(buildServerDashboardName('Auswertung', SyncForCustomerEnum.TEST)).toBe(`Auswertung [${SyncForCustomerEnum.TEST}]`);
  });

  it('never leaves the system marker on a dashboard of a server', () => {
    expect(buildServerDashboardName('Mensen [System]', SyncForCustomerEnum.TEST)).toBe(`Mensen [${SyncForCustomerEnum.TEST}]`);
    expect(buildServerDashboardName('Mensen [System] (copy)', SyncForCustomerEnum.OSNABRUECK)).toBe(`Mensen (copy) [${SyncForCustomerEnum.OSNABRUECK}]`);
    expect(DashboardNameHelper.isSystemDashboardName(buildServerDashboardName('Mensen [System]', SyncForCustomerEnum.TEST))).toBe(false);
  });

  it('does not add the marker twice', () => {
    const marked = buildServerDashboardName('Auswertung', SyncForCustomerEnum.HANNOVER);
    expect(buildServerDashboardName(marked, SyncForCustomerEnum.HANNOVER)).toBe(marked);
  });

  it('only cleans up the name when the instance has no server key', () => {
    expect(buildServerDashboardName('Mensen [System]', null)).toBe('Mensen');
    expect(buildServerDashboardName('Auswertung', undefined)).toBe('Auswertung');
  });
});
