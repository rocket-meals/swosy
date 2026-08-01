import easBuildListSample from './__fixtures__/eas-build-list.sample.json';
import { extractLocalBuildNumber, extractOnlineBuildNumber, shouldBuild } from './check-build-version';

describe('extractLocalBuildNumber', () => {
  it('extracts the build number from a config.ts style getBuildNumber function', () => {
    const config = [
      "// DO NOT CHANGE THE NAME OF THIS FUNCTION: getBuildNumber",
      'export function getBuildNumber() {',
      '\treturn 201;',
      '}',
      '',
      'export function getMajorVersion() {',
      '\treturn 21;',
      '}',
    ].join('\n');
    expect(extractLocalBuildNumber(config)).toBe(201);
  });

  it('returns null when getBuildNumber is missing', () => {
    expect(extractLocalBuildNumber('export function getMajorVersion() { return 21; }')).toBeNull();
  });
});

describe('extractOnlineBuildNumber', () => {
  it('extracts the newest appBuildVersion from a real eas build:list response', () => {
    expect(extractOnlineBuildNumber(easBuildListSample)).toBe(201);
  });

  it('skips entries without a parseable appBuildVersion', () => {
    const list = [{ appBuildVersion: null }, { appBuildVersion: 'abc' }, { appBuildVersion: '199' }];
    expect(extractOnlineBuildNumber(list)).toBe(199);
  });

  it('accepts numeric appBuildVersion values', () => {
    expect(extractOnlineBuildNumber([{ appBuildVersion: 200 }])).toBe(200);
  });

  it('returns null for an empty build list', () => {
    expect(extractOnlineBuildNumber([])).toBeNull();
  });

  it('returns null when no entry has a build version', () => {
    expect(extractOnlineBuildNumber([{ status: 'FINISHED' }])).toBeNull();
  });
});

describe('shouldBuild', () => {
  it('builds when the local build number is higher than the online one', () => {
    expect(shouldBuild(202, 201)).toBe(true);
  });

  it('does not build when the online build number matches the local one', () => {
    expect(shouldBuild(201, 201)).toBe(false);
  });

  it('does not build when the online build number is higher', () => {
    expect(shouldBuild(200, 201)).toBe(false);
  });

  it('builds when no online build number could be determined (fail open)', () => {
    expect(shouldBuild(201, null)).toBe(true);
  });
});
