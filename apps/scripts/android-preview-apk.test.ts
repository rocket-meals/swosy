import easBuildOutputSample from './__fixtures__/eas-build-output.sample.json';
import { extractApkUrl, updateReadmeApkLink } from './android-preview-apk';

describe('extractApkUrl', () => {
  it('extracts the APK URL from a real eas build --json response', () => {
    expect(extractApkUrl(easBuildOutputSample)).toBe('https://expo.dev/artifacts/eas/agNvd7IersQRJKvRJ-dk6Qltyz--qSooN4s1aC0ouPo.apk');
  });

  it('falls back to artifacts.buildUrl when applicationArchiveUrl is missing', () => {
    const build = { artifacts: { buildUrl: 'https://expo.dev/artifacts/eas/fallback.apk' } };
    expect(extractApkUrl([build])).toBe('https://expo.dev/artifacts/eas/fallback.apk');
  });

  it('accepts a single build object as well as an array of builds', () => {
    const build = easBuildOutputSample[0];
    expect(extractApkUrl(build)).toBe(extractApkUrl([build]));
  });

  it('returns an empty string when no artifact URL is present', () => {
    expect(extractApkUrl([{ status: 'ERRORED' }])).toBe('');
    expect(extractApkUrl([])).toBe('');
    expect(extractApkUrl(undefined)).toBe('');
  });
});

describe('updateReadmeApkLink', () => {
  const readme = ['# Rocket Meals', '', '<!-- android-preview-apk:frontend:start -->', 'Wird nach dem nächsten Build auf `master` automatisch aktualisiert.', '<!-- android-preview-apk:frontend:end -->', '', '## Next section'].join('\n');

  it('replaces the content between the app-specific markers', () => {
    const updated = updateReadmeApkLink(readme, 'frontend', 'Rocket Meals (Frontend)', 'https://expo.dev/artifacts/eas/agNvd7...apk');

    expect(updated).not.toBeNull();
    expect(updated).toContain('<!-- android-preview-apk:frontend:start -->');
    expect(updated).toContain('<!-- android-preview-apk:frontend:end -->');
    expect(updated).toContain('**Rocket Meals (Frontend):** 📱 [Neueste Android Preview APK herunterladen](https://expo.dev/artifacts/eas/agNvd7...apk)');
    expect(updated).not.toContain('Wird nach dem nächsten Build');
    expect(updated).toContain('## Next section');
  });

  it('leaves markers for other apps untouched', () => {
    const multiAppReadme = ['<!-- android-preview-apk:frontend:start -->old frontend link<!-- android-preview-apk:frontend:end -->', '<!-- android-preview-apk:geonexia:start -->old geonexia link<!-- android-preview-apk:geonexia:end -->'].join('\n');

    const updated = updateReadmeApkLink(multiAppReadme, 'frontend', 'Rocket Meals (Frontend)', 'https://expo.dev/new.apk');

    expect(updated).toContain('old geonexia link');
    expect(updated).not.toContain('old frontend link');
  });

  it('returns null when the markers for the given app-key are missing', () => {
    expect(updateReadmeApkLink(readme, 'geonexia', 'Geonexia', 'https://expo.dev/artifacts/eas/geonexia.apk')).toBeNull();
  });
});
