import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';
import { CollectionKeys } from '@/constants/collectionKeys';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class LanguagesHelper extends CollectionHelper<DatabaseTypes.Languages> {
	constructor(client?: any) {
		super(CollectionKeys.LANGUAGES, client);
	}

	// The codes of the `languages` collection ("de-DE", ...). Readable without login.
	async fetchLanguageCodes(): Promise<string[]> {
		const languages = await this.readItems({ fields: ['code'], limit: -1 });
		return (languages ?? []).map(language => language?.code).filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
	}
}

// The `languages` table has a handful of rows and does not change while the app runs, so it is read
// once per server. Kept per server URL: the developer settings can switch to another customer.
export class LanguageCodesCache {
	private static readonly codesByServerUrl: Map<string, string[]> = new Map();
	private static readonly pendingByServerUrl: Map<string, Promise<string[] | null>> = new Map();

	// The codes of the current server, or null when they could not be read (offline, server error).
	// A failed read is not cached, the next call tries again. Concurrent calls share one request.
	static getLanguageCodes(): Promise<string[] | null> {
		const serverUrl = ServerAPI.getServerUrl() ?? '';
		const cached = LanguageCodesCache.codesByServerUrl.get(serverUrl);
		if (cached) return Promise.resolve(cached);
		const pending = LanguageCodesCache.pendingByServerUrl.get(serverUrl);
		if (pending) return pending;

		const request = (async () => {
			try {
				const codes = await new LanguagesHelper().fetchLanguageCodes();
				LanguageCodesCache.codesByServerUrl.set(serverUrl, codes);
				return codes;
			} catch (error) {
				console.log('LanguageCodesCache: could not read the languages collection', error);
				return null;
			} finally {
				LanguageCodesCache.pendingByServerUrl.delete(serverUrl);
			}
		})();
		LanguageCodesCache.pendingByServerUrl.set(serverUrl, request);
		return request;
	}
}
