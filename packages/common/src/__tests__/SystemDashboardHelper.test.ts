import { describe, expect, it } from '@jest/globals';
import { SystemDashboardHelper } from '../SystemDashboardHelper';

describe('SystemDashboardHelper', () => {
  it('recognizes a shipped dashboard by its name', () => {
    expect(SystemDashboardHelper.isSystemDashboardName('Mensen (System)')).toBe(true);
    expect(SystemDashboardHelper.isSystemDashboardName('Mensen (System) ')).toBe(true);
    expect(SystemDashboardHelper.isSystemDashboardName('Mensen')).toBe(false);
    expect(SystemDashboardHelper.isSystemDashboardName('(System) Mensen')).toBe(false);
    expect(SystemDashboardHelper.isSystemDashboardName(null)).toBe(false);
    expect(SystemDashboardHelper.isSystemDashboardName(undefined)).toBe(false);
  });

  it('adds the marker to a name', () => {
    expect(SystemDashboardHelper.withSystemSuffix('Mensen')).toBe('Mensen (System)');
    expect(SystemDashboardHelper.withSystemSuffix('  Mensen  ')).toBe('Mensen (System)');
  });

  it('does not add the marker twice', () => {
    const marked = SystemDashboardHelper.withSystemSuffix('Mensen');
    expect(SystemDashboardHelper.withSystemSuffix(marked)).toBe(marked);
  });

  it('handles an empty name', () => {
    expect(SystemDashboardHelper.withSystemSuffix('')).toBe('(System)');
    expect(SystemDashboardHelper.withSystemSuffix(undefined)).toBe('(System)');
  });

  it('marks a dashboard with the key of a customer server', () => {
    expect(SystemDashboardHelper.buildNameSuffix('Osnabrück')).toBe('(Osnabrück)');
    expect(SystemDashboardHelper.withNameSuffix('Auswertung', 'Osnabrück')).toBe('Auswertung (Osnabrück)');
    expect(SystemDashboardHelper.hasNameSuffix('Auswertung (Osnabrück)', 'Osnabrück')).toBe(true);
    expect(SystemDashboardHelper.hasNameSuffix('Auswertung (Osnabrück)', 'Hannover')).toBe(false);
    expect(SystemDashboardHelper.withoutNameSuffix('Auswertung (Osnabrück)', 'Osnabrück')).toBe('Auswertung');
  });

  it('does not add a customer marker twice', () => {
    const marked = SystemDashboardHelper.withNameSuffix('Auswertung', 'Hannover');
    expect(SystemDashboardHelper.withNameSuffix(marked, 'Hannover')).toBe(marked);
  });

  it('builds the system marker from the system key', () => {
    expect(SystemDashboardHelper.SYSTEM_NAME_SUFFIX).toBe(SystemDashboardHelper.buildNameSuffix(SystemDashboardHelper.SYSTEM_NAME_KEY));
  });

  it('removes the marker again', () => {
    expect(SystemDashboardHelper.withoutSystemSuffix('Mensen (System)')).toBe('Mensen');
    expect(SystemDashboardHelper.withoutSystemSuffix('Mensen')).toBe('Mensen');
    expect(SystemDashboardHelper.withoutSystemSuffix(undefined)).toBe('');
  });
});
