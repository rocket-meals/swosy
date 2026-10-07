/**
 * Runs ServerAPI against the real Directus SDK with a mocked fetch. Reproduces the bug behind
 * the feedback "Essgewohnheiten setzen sich immer zurück": a failed token refresh used to wipe
 * the stored tokens and every following request silently ran as the public role.
 */
jest.mock('@/constants/UrlHelper', () => ({ UrlHelper: { getURLToLogin: () => 'app://login' } }));
jest.mock('@/constants/ServerUrl', () => ({ __esModule: true, default: { ServerUrl: 'https://server.example', setServerUrl: jest.fn() } }));
jest.mock('@/redux/actions/ApiService/ApiService', () => ({ setApiBaseUrl: jest.fn() }));
jest.mock('@/interceptor', () => ({ setBaseURL: jest.fn() }));

// The SDK captures globalThis.fetch when its module loads, so the mock has to be in place first.
const fetchMock = jest.fn();
(globalThis as any).fetch = fetchMock;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ServerAPI } = require('@/redux/actions/Auth/Auth') as typeof import('@/redux/actions/Auth/Auth');

type StoredAuth = { access_token: string | null; refresh_token: string | null; expires: number | null; expires_at: number | null } | null;

let stored: StoredAuth = null;
ServerAPI.createAuthentificationStorage(
	() => stored,
	value => {
		stored = value as StoredAuth;
	}
);

const jsonResponse = (status: number, body: unknown) =>
	({
		ok: status >= 200 && status < 300,
		status,
		headers: { get: () => 'application/json' },
		json: async () => body,
		text: async () => JSON.stringify(body),
	}) as unknown as Response;

const expiredSession = (): StoredAuth => ({ access_token: 'old-access', refresh_token: 'old-refresh', expires: 900000, expires_at: Date.now() - 1000 });

describe('ServerAPI token refresh', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		stored = expiredSession();
		jest.spyOn(console, 'warn').mockImplementation(() => {});
	});

	it('keeps the refresh token when the refresh fails because the device is offline', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network request failed'));
		const onInvalid = jest.fn();
		const unsubscribe = ServerAPI.onSessionInvalid(onInvalid);

		await ServerAPI.getValidAccessToken();

		expect(stored?.refresh_token).toBe('old-refresh');
		expect(onInvalid).not.toHaveBeenCalled();
		unsubscribe();
	});

	it('reports an expired session and clears the tokens when the server rejects the refresh', async () => {
		fetchMock.mockResolvedValue(jsonResponse(401, { errors: [{ message: 'Invalid user credentials.', extensions: { code: 'INVALID_CREDENTIALS' } }] }));
		const onInvalid = jest.fn();
		const unsubscribe = ServerAPI.onSessionInvalid(onInvalid);

		const token = await ServerAPI.getValidAccessToken();

		expect(token).toBeNull();
		expect(stored).toBeNull();
		expect(onInvalid).toHaveBeenCalledTimes(1);
		unsubscribe();
	});

	it('stores the new tokens after a successful refresh and sends one refresh for parallel requests', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { data: { access_token: 'new-access', refresh_token: 'new-refresh', expires: 900000 } }));

		const tokens = await Promise.all([ServerAPI.getValidAccessToken(), ServerAPI.getValidAccessToken()]);

		expect(tokens).toEqual(['new-access', 'new-access']);
		expect(stored?.refresh_token).toBe('new-refresh');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('uses the SDK client getToken override for requests', async () => {
		stored = { access_token: 'valid-access', refresh_token: 'r', expires: 900000, expires_at: Date.now() + 600000 };
		expect(await ServerAPI.getClient().getToken()).toBe('valid-access');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('debug: expiring the access token makes the next request refresh, the refresh token stays', async () => {
		stored = { access_token: 'valid-access', refresh_token: 'r', expires: 900000, expires_at: Date.now() + 600000 };
		fetchMock.mockResolvedValue(jsonResponse(200, { data: { access_token: 'new-access', refresh_token: 'new-refresh', expires: 900000 } }));

		expect(await ServerAPI.debugExpireAccessToken()).toBe(true);
		expect(await ServerAPI.getValidAccessToken()).toBe('new-access');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('debug: an invalidated refresh token is rejected and reported like an expired session', async () => {
		stored = { access_token: 'valid-access', refresh_token: 'r', expires: 900000, expires_at: Date.now() + 600000 };
		fetchMock.mockResolvedValue(jsonResponse(401, { errors: [{ message: 'Invalid user credentials.', extensions: { code: 'INVALID_CREDENTIALS' } }] }));
		const onInvalid = jest.fn();
		const unsubscribe = ServerAPI.onSessionInvalid(onInvalid);

		expect(await ServerAPI.debugInvalidateRefreshToken()).toBe(true);
		const refreshBody = JSON.parse((await ServerAPI.getValidAccessToken(), fetchMock.mock.calls[0][1].body));

		expect(refreshBody.refresh_token).toBe('debug-invalid-refresh-token');
		expect(onInvalid).toHaveBeenCalledTimes(1);
		expect(stored).toBeNull();
		unsubscribe();
	});

	it('debug: does nothing without a session', async () => {
		stored = null;
		expect(await ServerAPI.debugExpireAccessToken()).toBe(false);
		expect(await ServerAPI.debugInvalidateRefreshToken()).toBe(false);
	});

	it('treats a missing session as invalid on app start', async () => {
		stored = null;
		expect(await ServerAPI.validateSession()).toEqual({ status: 'invalid' });
	});
});
