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

  it('removes the marker again', () => {
    expect(SystemDashboardHelper.withoutSystemSuffix('Mensen (System)')).toBe('Mensen');
    expect(SystemDashboardHelper.withoutSystemSuffix('Mensen')).toBe('Mensen');
    expect(SystemDashboardHelper.withoutSystemSuffix(undefined)).toBe('');
  });
});
