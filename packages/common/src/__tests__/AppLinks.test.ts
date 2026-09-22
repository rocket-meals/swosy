import { AppLinks, AppScreens, ROCKET_MEALS_WEB_HOST, WikiCustomIds } from '../AppLinks';

describe('AppLinks.getPublicWikiUrl', () => {
  it('builds the public privacy policy url of a tenant', () => {
    expect(AppLinks.getPublicWikiUrl('/swosy', WikiCustomIds.PRIVACY_POLICY)).toBe('https://rocket-meals.de/swosy/wikis?custom_id=privacy-policy');
    expect(AppLinks.getPublicWikiUrl('/studi-futter', WikiCustomIds.PRIVACY_POLICY)).toBe('https://rocket-meals.de/studi-futter/wikis?custom_id=privacy-policy');
  });

  it('uses the shared web host', () => {
    expect(AppLinks.getPublicWikiUrl('/rocket-meals', WikiCustomIds.PRIVACY_POLICY).startsWith(ROCKET_MEALS_WEB_HOST)).toBe(true);
  });
});

describe('AppLinks.getPublicWebUrl for an inventory item', () => {
  it('builds the url a printed inventory item QR code points to', () => {
    expect(
      AppLinks.getPublicWebUrl('/swosy', `${AppScreens.INVENTORY_ITEMS}/details`, [
        { key: 'id', value: '2f1b0d2e-6c3a-4f2e-9d4a-7b8c9d0e1f23' },
      ])
    ).toBe('https://rocket-meals.de/swosy/inventory-items/details?id=2f1b0d2e-6c3a-4f2e-9d4a-7b8c9d0e1f23');
  });

  it('keeps the tenant base url of the item link', () => {
    expect(
      AppLinks.getPublicWebUrl('/studi-futter', `${AppScreens.INVENTORY_ITEMS}/details`, [{ key: 'id', value: 'abc' }])
    ).toBe('https://rocket-meals.de/studi-futter/inventory-items/details?id=abc');
  });
});
