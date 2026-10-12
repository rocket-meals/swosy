import { StoreVersionHelper } from './StoreVersionHelper';

describe('StoreVersionHelper', () => {
	it('reads version and store url from the App Store lookup', () => {
		const json = { resultCount: 1, results: [{ version: '21.210.0', trackViewUrl: 'https://apps.apple.com/de/app/id1' }] };
		expect(StoreVersionHelper.parseAppStoreLookup(json)).toEqual({ version: '21.210.0', storeUrl: 'https://apps.apple.com/de/app/id1' });
		expect(StoreVersionHelper.parseAppStoreLookup({ resultCount: 0, results: [] })).toEqual({ version: null, storeUrl: null });
		expect(StoreVersionHelper.parseAppStoreLookup(null)).toEqual({ version: null, storeUrl: null });
	});

	it('reads the version out of the Google Play page', () => {
		const html = '<script>AF_initDataCallback({data:[null,[[["Mensa"]],[[["21.210.0"]],[[[34,"14"]]]]]});</script>';
		expect(StoreVersionHelper.parseGooglePlayHtml(html)).toBe('21.210.0');
		expect(StoreVersionHelper.parseGooglePlayHtml('<html></html>')).toBeNull();
	});

	it('compares major and build number only, never the patch', () => {
		expect(StoreVersionHelper.compare('21.210.140', '21.210.0')).toBe('up_to_date');
		expect(StoreVersionHelper.compare('21.210.140', '21.211.0')).toBe('newer_in_store');
		expect(StoreVersionHelper.compare('21.210.140', '22.1.0')).toBe('newer_in_store');
		expect(StoreVersionHelper.compare('21.210.140', '21.209.0')).toBe('older_in_store');
		expect(StoreVersionHelper.compare('21.210.140', null)).toBe('unknown');
		expect(StoreVersionHelper.compare('21.210.140', 'Varies with device')).toBe('unknown');
	});
});
