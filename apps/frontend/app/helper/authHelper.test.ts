jest.mock('expo-web-browser', () => ({
	openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => {
	const store = new Map<string, string>();
	return {
		setItemAsync: jest.fn(async (key: string, value: string) => {
			store.set(key, value);
		}),
		getItemAsync: jest.fn(async (key: string) => (store.has(key) ? (store.get(key) as string) : null)),
		deleteItemAsync: jest.fn(async (key: string) => {
			store.delete(key);
		}),
	};
});

jest.mock('@/redux/actions/ApiService/ApiService', () => ({
	fetchToken: jest.fn(),
}));

jest.mock('./platformHelper', () => ({
	getPlatformHelper: () => ({
		getAndroidPreferredBrowserPackageOption: async () => ({ browserPackage: 'com.android.chrome' }),
	}),
}));

const REDIRECT_URL = 'app-rocket-meals://login';
const LOGIN_URL = 'https://server.example/auth/login/google?redirect=...';
const CODE_VERIFIER_STORAGE_KEY = 'pkce_pending_code_verifier';

type UrlListener = (event: { url: string }) => void;

describe('authHelper native login', () => {
	let authHelper: typeof import('./authHelper');
	let WebBrowser: { openAuthSessionAsync: jest.Mock };
	let SecureStore: { setItemAsync: jest.Mock; getItemAsync: jest.Mock; deleteItemAsync: jest.Mock };
	let ApiService: { fetchToken: jest.Mock };
	let urlListeners: UrlListener[];
	let removeListenerMock: jest.Mock;

	const emitUrlEvent = (url: string) => {
		urlListeners.forEach(listener => listener({ url }));
	};

	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		jest.useRealTimers();

		const reactNative = require('react-native');
		reactNative.Platform.OS = 'android';

		urlListeners = [];
		removeListenerMock = jest.fn();
		jest.spyOn(reactNative.Linking, 'addEventListener').mockImplementation(((_type: string, handler: UrlListener) => {
			urlListeners.push(handler);
			return { remove: removeListenerMock };
		}) as never);

		WebBrowser = require('expo-web-browser');
		SecureStore = require('expo-secure-store');
		ApiService = require('@/redux/actions/ApiService/ApiService');
		authHelper = require('./authHelper');
	});

	it('exchanges the code when the auth session resolves with success', async () => {
		WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: `${REDIRECT_URL}?code=code-success` });
		const getToken = jest.fn();

		await authHelper.handleNativeLogin(LOGIN_URL, REDIRECT_URL, 'verifier-success', getToken);

		expect(getToken).toHaveBeenCalledTimes(1);
		expect(getToken).toHaveBeenCalledWith('verifier-success', 'code-success');
		expect(removeListenerMock).toHaveBeenCalled();
	});

	// The core Android bug: expo-web-browser's internal race can resolve with
	// 'dismiss' although the redirect arrived; the deep link event that still
	// follows must complete the login.
	it('completes the login via its own listener when the auth session resolves with dismiss', async () => {
		WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });
		const getToken = jest.fn();
		jest.useFakeTimers();

		const loginPromise = authHelper.handleNativeLogin(LOGIN_URL, REDIRECT_URL, 'verifier-dismiss', getToken);
		await jest.advanceTimersByTimeAsync(0); // flush until the grace period timer is pending

		expect(getToken).not.toHaveBeenCalled();
		emitUrlEvent(`${REDIRECT_URL}?code=code-dismiss`);
		expect(getToken).toHaveBeenCalledTimes(1);
		expect(getToken).toHaveBeenCalledWith('verifier-dismiss', 'code-dismiss');

		await jest.advanceTimersByTimeAsync(3000);
		await loginPromise;
		expect(removeListenerMock).toHaveBeenCalled();
	});

	it('ignores events that do not match the redirect url or carry no code', async () => {
		WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });
		const getToken = jest.fn();
		jest.useFakeTimers();

		const loginPromise = authHelper.handleNativeLogin(LOGIN_URL, REDIRECT_URL, 'verifier-ignore', getToken);
		await jest.advanceTimersByTimeAsync(0);

		emitUrlEvent('other-scheme://login?code=foreign-code');
		emitUrlEvent(REDIRECT_URL);
		expect(getToken).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(3000);
		await loginPromise;
	});

	it('exchanges a code only once even when listener and session result both deliver it', async () => {
		WebBrowser.openAuthSessionAsync.mockImplementation(async () => {
			emitUrlEvent(`${REDIRECT_URL}?code=code-dup`);
			return { type: 'success', url: `${REDIRECT_URL}?code=code-dup` };
		});
		const getToken = jest.fn();

		await authHelper.handleNativeLogin(LOGIN_URL, REDIRECT_URL, 'verifier-dup', getToken);

		expect(getToken).toHaveBeenCalledTimes(1);
	});

	it('completes the login from the deep link code with the persisted verifier', async () => {
		await SecureStore.setItemAsync(CODE_VERIFIER_STORAGE_KEY, 'persisted-verifier');
		ApiService.fetchToken.mockResolvedValue({ directus_refresh_token: 'refresh-token-1' });
		const onToken = jest.fn();

		await authHelper.completeLoginFromDeepLinkCode('code-deeplink', onToken);

		expect(ApiService.fetchToken).toHaveBeenCalledWith('persisted-verifier', 'code-deeplink');
		expect(onToken).toHaveBeenCalledWith('refresh-token-1');

		// same code again is a no-op (codes are single-use on the backend)
		await authHelper.completeLoginFromDeepLinkCode('code-deeplink', onToken);
		expect(ApiService.fetchToken).toHaveBeenCalledTimes(1);
		expect(onToken).toHaveBeenCalledTimes(1);
	});

	it('does nothing on a deep link code without pending verifier', async () => {
		const onToken = jest.fn();

		await authHelper.completeLoginFromDeepLinkCode('code-without-verifier', onToken);

		expect(ApiService.fetchToken).not.toHaveBeenCalled();
		expect(onToken).not.toHaveBeenCalled();
	});

	it('does not exchange a code via deep link that the auth session already handled', async () => {
		WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: `${REDIRECT_URL}?code=code-both-paths` });
		const getToken = jest.fn();
		await authHelper.handleNativeLogin(LOGIN_URL, REDIRECT_URL, 'verifier-both', getToken);
		expect(getToken).toHaveBeenCalledTimes(1);

		const onToken = jest.fn();
		await authHelper.completeLoginFromDeepLinkCode('code-both-paths', onToken);

		expect(ApiService.fetchToken).not.toHaveBeenCalled();
		expect(onToken).not.toHaveBeenCalled();
	});
});
