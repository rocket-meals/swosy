// In-memory debug log for the SSO login flow. Every step of the native login
// (authorize request, browser opening, redirect events, token exchange) writes
// into this log so device problems can be diagnosed from the login screen's
// debug panel, where the log can be copied and shared.

const MAX_ENTRIES = 300;

type LoginLogListener = () => void;

let entries: string[] = [];
const listeners = new Set<LoginLogListener>();

const notify = () => {
	listeners.forEach(listener => listener());
};

const getTimestamp = () => {
	const now = new Date();
	const pad = (value: number, length = 2) => value.toString().padStart(length, '0');
	return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
};

// Auth codes are single-use and short-lived, but the log is meant to be copied
// and shared - mask everything after the first characters anyway.
export const maskCodeInText = (text: string): string => {
	return text.replace(/([?&]code=)([^&\s]+)/gi, (_match, prefix: string, code: string) => `${prefix}${code.slice(0, 6)}...(${code.length})`);
};

export const addLoginLog = (message: string) => {
	const entry = `[${getTimestamp()}] ${maskCodeInText(message)}`;
	entries = [...entries, entry].slice(-MAX_ENTRIES);
	console.log('[LoginDebug]', entry);
	notify();
};

export const clearLoginLog = () => {
	entries = [];
	notify();
};

// Stable reference between changes, as required by useSyncExternalStore.
export const getLoginLogEntries = (): string[] => entries;

export const getLoginLogText = (): string => entries.join('\n');

export const subscribeLoginLog = (listener: LoginLogListener): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const describeError = (error: unknown): string => {
	const anyError = error as { message?: string; response?: { status?: number; data?: unknown } };
	const parts: string[] = [];
	if (anyError?.message) parts.push(anyError.message);
	if (anyError?.response?.status !== undefined) parts.push(`status=${anyError.response.status}`);
	if (anyError?.response?.data !== undefined) {
		try {
			parts.push(`data=${JSON.stringify(anyError.response.data)}`);
		} catch {
			// ignore serialization errors
		}
	}
	return parts.length > 0 ? parts.join(' ') : String(error);
};
