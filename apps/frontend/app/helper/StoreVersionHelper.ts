// Reads the version an app currently has in the Apple App Store and in Google
// Play, so it can be compared with the installed one. Only major and build
// number are compared (e.g. "21.210" of "21.210.0"): the patch number is an OTA
// update and never reaches the stores.

export type StoreVersionResult = {
	version: string | null;
	storeUrl: string | null;
	error: string | null;
};

export type StoreVersionComparison = 'newer_in_store' | 'up_to_date' | 'older_in_store' | 'unknown';

export class StoreVersionHelper {
	static getAppStoreLookupUrl(bundleIdIos: string): string {
		// country=de: the lookup only finds apps that are listed in that storefront
		return `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleIdIos)}&country=de`;
	}

	static getGooglePlayUrl(bundleIdAndroid: string): string {
		return `https://play.google.com/store/apps/details?id=${encodeURIComponent(bundleIdAndroid)}&hl=en&gl=DE`;
	}

	static parseAppStoreLookup(json: unknown): { version: string | null; storeUrl: string | null } {
		const results = (json as { results?: { version?: unknown; trackViewUrl?: unknown }[] } | null)?.results;
		const first = Array.isArray(results) ? results[0] : undefined;
		return {
			version: typeof first?.version === 'string' ? first.version : null,
			storeUrl: typeof first?.trackViewUrl === 'string' ? first.trackViewUrl : null,
		};
	}

	// Google Play has no public API for this. The details page embeds the
	// current version in its inline data as [[["21.210.0"]] - the first such
	// entry is the version.
	static parseGooglePlayHtml(html: string): string | null {
		const match = /\[\[\["(\d+(?:\.\d+)+)"\]\]/.exec(html);
		return match?.[1] ?? null;
	}

	static parseMajorAndBuild(version: string | null | undefined): [number, number] | null {
		if (!version) return null;
		const parts = version.trim().split('.');
		if (parts.length < 2) return null;
		const major = Number.parseInt(parts[0] ?? '', 10);
		const build = Number.parseInt(parts[1] ?? '', 10);
		if (Number.isNaN(major) || Number.isNaN(build)) return null;
		return [major, build];
	}

	static compare(installedVersion: string, storeVersion: string | null | undefined): StoreVersionComparison {
		const installed = StoreVersionHelper.parseMajorAndBuild(installedVersion);
		const store = StoreVersionHelper.parseMajorAndBuild(storeVersion);
		if (!installed || !store) return 'unknown';
		const diff = store[0] !== installed[0] ? store[0] - installed[0] : store[1] - installed[1];
		if (diff > 0) return 'newer_in_store';
		if (diff < 0) return 'older_in_store';
		return 'up_to_date';
	}

	static async fetchAppStoreVersion(bundleIdIos: string | undefined): Promise<StoreVersionResult> {
		if (!bundleIdIos) return { version: null, storeUrl: null, error: 'No iOS bundle id configured' };
		try {
			const response = await fetch(StoreVersionHelper.getAppStoreLookupUrl(bundleIdIos));
			if (!response.ok) return { version: null, storeUrl: null, error: `HTTP ${response.status}` };
			const parsed = StoreVersionHelper.parseAppStoreLookup(await response.json());
			return { ...parsed, error: parsed.version ? null : 'App not found in the App Store' };
		} catch (error) {
			return { version: null, storeUrl: null, error: (error as Error).message };
		}
	}

	static async fetchGooglePlayVersion(bundleIdAndroid: string | undefined): Promise<StoreVersionResult> {
		if (!bundleIdAndroid) return { version: null, storeUrl: null, error: 'No Android package configured' };
		const storeUrl = StoreVersionHelper.getGooglePlayUrl(bundleIdAndroid);
		try {
			// On the web this is blocked by CORS - Google Play sends no CORS headers.
			const response = await fetch(storeUrl);
			if (!response.ok) return { version: null, storeUrl, error: `HTTP ${response.status}` };
			const version = StoreVersionHelper.parseGooglePlayHtml(await response.text());
			return { version, storeUrl, error: version ? null : 'Version not found on the Google Play page' };
		} catch (error) {
			return { version: null, storeUrl, error: (error as Error).message };
		}
	}
}
