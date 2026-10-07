import { authentication, AuthenticationClient, AuthenticationConfig, AuthenticationData, AuthenticationStorage, createDirectus, deleteUser, DirectusClient, graphql, GraphqlClient, readMe, readPolicies, readProviders, readRoles, rest, RestClient, serverInfo, ServerInfoOutput } from '@directus/sdk';

import { DatabaseTypes } from 'repo-depkit-common';

import { UrlHelper } from '@/constants/UrlHelper';
import ServerConfiguration from '@/constants/ServerUrl';
import { setApiBaseUrl } from '@/redux/actions/ApiService/ApiService';
import { setBaseURL } from '@/interceptor';
import { buildSessionDiagnostics, hasRefreshToken, isAccessTokenExpiring, isSessionRejectedError, SessionDiagnostics } from '@/helper/authSessionHelper';

interface ExtendedProperties {
	project: {
		project_name: string | null;
		project_descriptor: string | null;
		project_logo: string | null;
		project_color: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		custom_css: string | null;
	};
}

type ExtendedServerInfoOutput = ServerInfoOutput & ExtendedProperties;

export interface ServerInfo {
	status: 'loading' | 'online' | 'offline' | 'error' | 'cached';
	info: ExtendedServerInfoOutput | null;
	errorMessage?: string;
}

export type SessionValidationResult =
	| { status: 'valid'; user: DatabaseTypes.DirectusUsers }
	| { status: 'invalid' }
	// Server not reachable or answered with an error that says nothing about the session.
	| { status: 'unknown' };

export type AuthProvider = {
	name: string;
	label?: string | null;
	icon?: string | null;
};

export class ServerAPI {
	private static client: (DirectusClient<any> & AuthenticationClient<any> & GraphqlClient<any> & RestClient<any>) | null = null;
	private static serverUrlCustom: string | null = null;
	static readonly ParamNameForAccessToken = 'directus_refresh_token';
	static readonly PROVIDER_NAME_APPLE = 'apple';
	static readonly PROVIDER_NAME_GOOGLE = 'google';
	private static simpleAuthentificationStorage: AuthenticationStorage | null = null;
	private static tokenRefreshInProgress: Promise<void> | null = null;
	// The SDK clears the stored tokens *before* it sends the refresh request. While our own
	// refresh runs, that clear is held back, so a refresh that fails because the device is
	// offline keeps the refresh token for the next attempt instead of losing the session.
	private static holdBackTokenClear = false;
	private static sessionInvalidListeners = new Set<() => void>();

	static updateServerUrl(url: string) {
		this.serverUrlCustom = url;
		ServerConfiguration.setServerUrl(url);
		setApiBaseUrl(url);
		setBaseURL(url);
		this.client = null;
	}

	// Retrieves server URL
	static getServerUrl() {
		return this.serverUrlCustom || ServerConfiguration.ServerUrl;
	}

	static getParamNameForDirectusAccessToken() {
		return this.ParamNameForAccessToken;
	}

	static getDirectusAccessTokenFromParams(params: any): string | null | undefined {
		return params?.[this.getParamNameForDirectusAccessToken()];
	}

	// Creates a public Directus client
	static getPublicClient() {
		return createDirectus<DatabaseTypes.CustomDirectusTypes>(this.getServerUrl()).with(rest());
	}

	// Initializes authentication storage
	static createAuthentificationStorage(get: () => Promise<AuthenticationData | null> | AuthenticationData | null, set: (value: AuthenticationData | null) => Promise<void> | void) {
		if (!this.simpleAuthentificationStorage) {
			this.simpleAuthentificationStorage = {
				get,
				set: async value => {
					if (this.holdBackTokenClear && !value?.refresh_token) {
						return;
					}
					await set(value);
				},
			};
		}
	}

	/**
	 * Called when the server rejected the session (refresh token expired or revoked, or a
	 * request came back as the public role). Returns an unsubscribe function.
	 */
	static onSessionInvalid(listener: () => void): () => void {
		this.sessionInvalidListeners.add(listener);
		return () => {
			this.sessionInvalidListeners.delete(listener);
		};
	}

	static notifySessionInvalid() {
		this.sessionInvalidListeners.forEach(listener => {
			try {
				listener();
			} catch (err) {
				console.error('Session invalid listener failed:', err);
			}
		});
	}

	static async clearSession() {
		await this.simpleAuthentificationStorage?.set(null);
	}

	/**
	 * Replaces the SDK's getToken. The SDK swallows every refresh error and then sends the
	 * request without a token - the app silently continued as the public role. Here a rejected
	 * refresh is reported via onSessionInvalid, and a network error keeps the session.
	 */
	static async getValidAccessToken(): Promise<string | null> {
		const storage = this.simpleAuthentificationStorage;
		if (!storage) return null;
		if (this.tokenRefreshInProgress) {
			await this.tokenRefreshInProgress;
		}
		const data = await storage.get();
		if (hasRefreshToken(data) && isAccessTokenExpiring(data)) {
			await this.refreshTokensOnce();
			return (await storage.get())?.access_token ?? null;
		}
		return data?.access_token ?? null;
	}

	private static refreshTokensOnce(): Promise<void> {
		if (!this.tokenRefreshInProgress) {
			this.tokenRefreshInProgress = this.refreshTokensKeepingSessionOnNetworkError().finally(() => {
				this.tokenRefreshInProgress = null;
			});
		}
		return this.tokenRefreshInProgress;
	}

	private static async refreshTokensKeepingSessionOnNetworkError() {
		let rejected = false;
		this.holdBackTokenClear = true;
		try {
			await this.getClient().refresh();
		} catch (err) {
			rejected = isSessionRejectedError(err);
			if (!rejected) {
				console.warn('Token refresh failed, keeping the session for the next attempt:', err);
			}
		} finally {
			this.holdBackTokenClear = false;
		}
		if (rejected) {
			console.warn('Server rejected the refresh token - the login session has expired');
			await this.clearSession();
			this.notifySessionInvalid();
		}
	}

	/**
	 * Debug: marks the access token as expired, the refresh token stays. The next request has to
	 * refresh - exactly the moment in which the SDK used to lose the session when it failed.
	 * Returns false when there is no session to expire.
	 */
	static async debugExpireAccessToken(): Promise<boolean> {
		const data = await this.simpleAuthentificationStorage?.get();
		if (!data?.refresh_token) return false;
		await this.simpleAuthentificationStorage?.set({ ...data, expires_at: Date.now() - 1000 });
		return true;
	}

	/**
	 * Debug: replaces the refresh token with one the server does not know and expires the access
	 * token. The next request is rejected like an expired session (login hint, guests re-login).
	 */
	static async debugInvalidateRefreshToken(): Promise<boolean> {
		const data = await this.simpleAuthentificationStorage?.get();
		if (!data?.refresh_token) return false;
		await this.simpleAuthentificationStorage?.set({ ...data, refresh_token: 'debug-invalid-refresh-token', expires_at: Date.now() - 1000 });
		return true;
	}

	/** Session flags for the feedback snapshot - never the token values themselves. */
	static async getSessionDiagnostics(): Promise<SessionDiagnostics | null> {
		try {
			return buildSessionDiagnostics(await this.simpleAuthentificationStorage?.get());
		} catch (err) {
			console.warn('Could not read session diagnostics:', err);
			return null;
		}
	}

	/**
	 * Checks with the server whether the stored session still belongs to a logged-in user.
	 * Used on app start: without it, a dead session went unnoticed for months.
	 */
	static async validateSession(): Promise<SessionValidationResult> {
		const data = await this.simpleAuthentificationStorage?.get();
		if (!data?.refresh_token && !data?.access_token) {
			return { status: 'invalid' };
		}
		try {
			const user = (await this.getMe()) as DatabaseTypes.DirectusUsers;
			return user?.id ? { status: 'valid', user } : { status: 'invalid' };
		} catch (err) {
			return isSessionRejectedError(err) ? { status: 'invalid' } : { status: 'unknown' };
		}
	}

	static getClient() {
		if (!this.client) {
			if (!this.simpleAuthentificationStorage) {
				throw new Error('Authentication storage not initialized. Call createAuthentificationStorage() first.');
			}
			const authConfig: Partial<AuthenticationConfig> = {
				// The SDK's refresh timer swallows errors and wipes the tokens on any failure
				// (e.g. while offline). Tokens are refreshed on demand in getValidAccessToken.
				autoRefresh: false,
				credentials: 'include',
				storage: this.simpleAuthentificationStorage,
			};

			const client = createDirectus(this.getServerUrl()).with(authentication('json', authConfig)).with(graphql()).with(rest());
			// rest() and graphql() call `this.getToken()` on the client for every request.
			client.getToken = () => this.getValidAccessToken();
			this.client = client;
		}
		return this.client;
	}

	static async authenticateWithAccessToken(accessToken: string | null) {
		try {
			if (accessToken) {
				await this.simpleAuthentificationStorage?.set({
					access_token: null,
					refresh_token: accessToken,
					expires: null,
					expires_at: null,
				});
			}
			return await this.getClient().refresh();
		} catch (err) {
			console.error('Authentication failed with access token:', err);
			throw err;
		}
	}

	static async authenticateWithEmailAndPassword(email: string, password: string) {
		try {
			const client = this.getClient();
			const result = await client.login(email, password);
			await this.simpleAuthentificationStorage?.set({
				access_token: result.access_token,
				refresh_token: result.refresh_token,
				expires: result.expires,
				expires_at: result.expires_at,
			});
			return await client.refresh();
		} catch (err) {
			console.error('Login failed with email and password:', err);
			throw err;
		}
	}

	static async getAuthProviders(isDemo?: boolean): Promise<AuthProvider[]> {
		if (isDemo) return this.getDemoAuthProviders();

		const client = this.getPublicClient();
		const providers = await client.request(readProviders());
		return providers.map(({ name, label, icon }) => ({ name, label, icon }));
	}

	static getDemoAuthProviders(): AuthProvider[] {
		return [
			{ name: this.PROVIDER_NAME_APPLE, icon: 'apple' },
			{ name: this.PROVIDER_NAME_GOOGLE, icon: 'google' },
		];
	}

	static async readRemoteRoles() {
		return this.getClient().request<DatabaseTypes.DirectusRoles[]>(
			readRoles({
				fields: ['*'],
				deep: { users: { _limit: 0 }, policies: { _limit: 0 } },
				limit: -1,
			})
		);
	}

	static async readRemotePolicies() {
		return this.getClient().request<DatabaseTypes.DirectusPolicies[]>(
			readPolicies({
				fields: ['*', 'permissions.*', 'roles.*'],
				deep: {
					permissions: { _limit: -1 },
					roles: { _limit: -1 },
					users: { _limit: 0 },
				},
				limit: -1,
			})
		);
	}

	static async downloadServerInfo(): Promise<ServerInfo> {
		try {
			const remoteInfo = await this.getPublicClient().request(serverInfo());
			return {
				status: 'online',
				info: remoteInfo as ExtendedServerInfoOutput,
				errorMessage: '',
			};
		} catch (err) {
			console.error('Error fetching server info:', err);
			return {
				status: 'offline',
				info: null,
				errorMessage: err?.toString() || 'Unknown error',
			};
		}
	}

	static getUrlToProviderLogin(provider: AuthProvider) {
		const redirectURL = UrlHelper.getURLToLogin();
		return `${this.getServerUrl()}/auth/login/${provider?.name?.toLowerCase()}?redirect=${redirectURL}`;
	}

	static async getMe() {
		return this.getClient().request(readMe({ fields: ['*'] }));
	}

	static async deleteMe() {
		const me = await this.getMe();
		return this.getClient().request(deleteUser(me.id));
	}

	static async logout() {
		try {
			// Without a refresh token (e.g. "continue without account") there is no server
			// session to end - Directus would only answer 400 "refresh token is required".
			const authData = await this.simpleAuthentificationStorage?.get();
			if (!authData?.refresh_token) {
				return;
			}
			await this.getClient().logout();
		} catch (err) {
			console.error('Backend logout failed (local logout will proceed):', err);
		}
	}
}
