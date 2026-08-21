import { describe, expect, it } from '@jest/globals';
import { DashboardNameHelper } from '../DashboardNameHelper';

describe('DashboardNameHelper', () => {
  it('recognizes a shipped dashboard by its name', () => {
    expect(DashboardNameHelper.isSystemDashboardName('Mensen [System]')).toBe(true);
    expect(DashboardNameHelper.isSystemDashboardName('Mensen [System] ')).toBe(true);
    expect(DashboardNameHelper.isSystemDashboardName('Mensen')).toBe(false);
    expect(DashboardNameHelper.isSystemDashboardName('Mensen (System)')).toBe(false);
    expect(DashboardNameHelper.isSystemDashboardName(null)).toBe(false);
    expect(DashboardNameHelper.isSystemDashboardName(undefined)).toBe(false);
  });

  it('still recognizes a duplicate Directus appended a "(copy)" to', () => {
    expect(DashboardNameHelper.isSystemDashboardName('Mensen [System] (copy)')).toBe(true);
    expect(DashboardNameHelper.withoutSystemMarker('Mensen [System] (copy)')).toBe('Mensen (copy)');
  });

  it('adds the marker to a name', () => {
    expect(DashboardNameHelper.withSystemMarker('Mensen')).toBe('Mensen [System]');
    expect(DashboardNameHelper.withSystemMarker('  Mensen  ')).toBe('Mensen [System]');
  });

  it('does not add the marker twice', () => {
    const marked = DashboardNameHelper.withSystemMarker('Mensen');
    expect(DashboardNameHelper.withSystemMarker(marked)).toBe(marked);
    expect(DashboardNameHelper.withSystemMarker('Mensen [System] (copy)')).toBe('Mensen [System] (copy)');
  });

  it('handles an empty name', () => {
    expect(DashboardNameHelper.withSystemMarker('')).toBe('[System]');
    expect(DashboardNameHelper.withSystemMarker(undefined)).toBe('[System]');
  });

  it('marks a dashboard with the key of a server', () => {
    expect(DashboardNameHelper.buildNameMarker('Osnabrück')).toBe('[Osnabrück]');
    expect(DashboardNameHelper.withNameMarker('Auswertung', 'Osnabrück')).toBe('Auswertung [Osnabrück]');
    expect(DashboardNameHelper.hasNameMarker('Auswertung [Osnabrück]', 'Osnabrück')).toBe(true);
    expect(DashboardNameHelper.hasNameMarker('Auswertung [Osnabrück]', 'Hannover')).toBe(false);
    expect(DashboardNameHelper.withoutNameMarker('Auswertung [Osnabrück]', 'Osnabrück')).toBe('Auswertung');
  });

  it('does not add a server marker twice', () => {
    const marked = DashboardNameHelper.withNameMarker('Auswertung', 'Hannover');
    expect(DashboardNameHelper.withNameMarker(marked, 'Hannover')).toBe(marked);
  });

  it('builds the system marker from the system key', () => {
    expect(DashboardNameHelper.SYSTEM_NAME_MARKER).toBe(DashboardNameHelper.buildNameMarker(DashboardNameHelper.SYSTEM_NAME_KEY));
    expect(DashboardNameHelper.SYSTEM_NAME_MARKER).toBe('[System]');
  });

  it('removes a marker wherever it stands and leaves no double spaces behind', () => {
    expect(DashboardNameHelper.withoutSystemMarker('Mensen [System]')).toBe('Mensen');
    expect(DashboardNameHelper.withoutSystemMarker('Vergleich [System] Auswertung')).toBe('Vergleich Auswertung');
    expect(DashboardNameHelper.withoutSystemMarker('[System]')).toBe('');
    expect(DashboardNameHelper.withoutSystemMarker('Mensen')).toBe('Mensen');
    expect(DashboardNameHelper.withoutSystemMarker(undefined)).toBe('');
  });
});
