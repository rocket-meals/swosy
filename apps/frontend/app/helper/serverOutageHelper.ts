/**
 * Notices when the backend looks unreachable, so an app that is already
 * running can check for a maintenance window (see MaintenanceModal).
 *
 * Every Directus client gets createOutageDetectingFetch as its fetch (see
 * ServerAPI in redux/actions/Auth/Auth.ts). A response counts as an outage when:
 * - the request fails without any response (server or network down),
 * - the reverse proxy answers 502/503/504 (Directus down, maintenance server),
 * - the reverse proxy answers 404 without JSON: Traefik's "404 page not found"
 *   when no backend route exists at all. Directus' own 404 is JSON and is a
 *   normal "item not found", not an outage.
 */

export type ServerOutageListener = () => void;

const OUTAGE_STATUS_CODES = new Set([502, 503, 504]);
const NOT_FOUND_STATUS_CODE = 404;

const listeners = new Set<ServerOutageListener>();

export function isServerOutageResponse(status: number, contentType: string | null | undefined): boolean {
	if (OUTAGE_STATUS_CODES.has(status)) {
		return true;
	}
	return status === NOT_FOUND_STATUS_CODE && !(contentType ?? '').toLowerCase().includes('json');
}

/** Registers a listener for suspected outages. Returns the function to unregister it. */
export function onServerOutageSuspected(listener: ServerOutageListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function notifyServerOutageSuspected(): void {
	for (const listener of listeners) {
		try {
			listener();
		} catch (error) {
			console.log('serverOutageHelper: listener failed', error);
		}
	}
}

type FetchFunction = (input: any, init?: any) => Promise<any>;

/** Wraps fetch: behaves exactly like it, but reports responses that look like an outage. */
export function createOutageDetectingFetch(baseFetch: FetchFunction): FetchFunction {
	return async (input, init) => {
		let response;
		try {
			response = await baseFetch(input, init);
		} catch (error) {
			// An aborted request was cancelled by the app itself, the server may be fine.
			if ((error as { name?: string } | null)?.name !== 'AbortError') {
				notifyServerOutageSuspected();
			}
			throw error;
		}
		if (isServerOutageResponse(response?.status, response?.headers?.get?.('content-type'))) {
			notifyServerOutageSuspected();
		}
		return response;
	};
}

/** fetch for the Directus clients. Resolves globalThis.fetch per call, so a polyfill or test mock set later is used. */
export const outageDetectingFetch: FetchFunction = createOutageDetectingFetch((input, init) => globalThis.fetch(input, init));
