import { AppLinks, ROCKET_MEALS_WEB_HOST, WikiCustomIds } from '../AppLinks';

describe('AppLinks.getPublicWikiUrl', () => {
  it('builds the public privacy policy url of a tenant', () => {
    expect(AppLinks.getPublicWikiUrl('/swosy', WikiCustomIds.PRIVACY_POLICY)).toBe('https://rocket-meals.de/swosy/wikis?custom_id=privacy-policy');
    expect(AppLinks.getPublicWikiUrl('/studi-futter', WikiCustomIds.PRIVACY_POLICY)).toBe('https://rocket-meals.de/studi-futter/wikis?custom_id=privacy-policy');
  });

  it('uses the shared web host', () => {
    expect(AppLinks.getPublicWikiUrl('/rocket-meals', WikiCustomIds.PRIVACY_POLICY).startsWith(ROCKET_MEALS_WEB_HOST)).toBe(true);
  });
});
