// Fallback server that answers in place of Directus while it is down, e.g.
// during the restart in scripts/update-and-generate-env.sh.
//
// Traefik routes the backend path here only while no healthy Directus
// container exists (same rule, lowest priority, see docker-compose.yaml).
//
// While Directus is up, this server polls the public app_settings every
// POLL_INTERVAL_SECONDS and keeps the last answer in memory. While Directus is
// down, it answers GET /items/app_settings with that copy, so the app keeps its
// full settings and the MaintenanceBanner shows the maintenance window. Every
// other request gets a Directus-style 503, so the app keeps its cached data.
//
// SIGHUP polls immediately. The restart script sends it right before it stops
// Directus, so the copy already contains the freshly announced window.
//
// No dependencies, plain Node.js, so the container needs no build step.

import http from 'node:http';
import { pathToFileURL } from 'node:url';

const MILLISECONDS_PER_MINUTE = 60 * 1000;

/** How far an unannounced or overrunning maintenance is extended into the future. */
export const MAINTENANCE_EXTENSION_MINUTES = 10;

/**
 * Same query as AppSettingsHelper.fetchAppSettings in
 * apps/frontend/app/redux/actions/AppSettings/AppSettings.ts, so the copy
 * contains everything the app loads on start.
 */
export const APP_SETTINGS_QUERY = 'fields=*,translations.*,housing_translations.*,balance_translations.*,login_screen_translations.*';

function parseTime(value) {
	if (!value) {
		return null;
	}
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? null : time;
}

function roundUpToFiveMinutes(time) {
	const step = 5 * MILLISECONDS_PER_MINUTE;
	return Math.ceil(time / step) * step;
}

/**
 * Maintenance window to send while Directus is down.
 *
 * An announced window that is currently active is kept as it is. Otherwise
 * (outage without announcement, outage before the announced start, restart
 * takes longer than announced) the window starts when the outage was first
 * noticed and ends MAINTENANCE_EXTENSION_MINUTES from now. The start stays
 * stable during one outage, because the app remembers a dismissed banner per
 * maintenance_start.
 */
export function resolveMaintenanceWindow(maintenanceStart, maintenanceEnd, outageStart, now) {
	const start = parseTime(maintenanceStart);
	const end = parseTime(maintenanceEnd);
	const nowTime = now.getTime();
	if (start !== null && end !== null && start <= nowTime && nowTime < end) {
		return { maintenance_start: maintenanceStart, maintenance_end: maintenanceEnd };
	}
	const extendedEnd = roundUpToFiveMinutes(nowTime + MAINTENANCE_EXTENSION_MINUTES * MILLISECONDS_PER_MINUTE);
	return {
		maintenance_start: new Date(Math.min(outageStart.getTime(), nowTime)).toISOString(),
		maintenance_end: new Date(extendedEnd).toISOString(),
	};
}

/** The app_settings answer while Directus is down, or null if no copy was polled yet. */
export function buildAppSettingsResponse(appSettings, outageStart, now) {
	if (!appSettings) {
		return null;
	}
	return {
		data: {
			...appSettings,
			...resolveMaintenanceWindow(appSettings.maintenance_start, appSettings.maintenance_end, outageStart, now),
		},
	};
}

/** Strips query and trailing slash: "/items/app_settings/?fields=x" -> "/items/app_settings". */
export function normalizePath(url) {
	const path = (url ?? '/').split('?')[0];
	return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

const SERVICE_UNAVAILABLE_BODY = {
	errors: [{ message: 'Server is under maintenance.', extensions: { code: 'SERVICE_UNAVAILABLE' } }],
};

export function createMaintenanceServer({ directusUrl, pollIntervalSeconds, log = console.log }) {
	let appSettings = null;
	let outageStart = null;

	async function poll() {
		try {
			const response = await fetch(`${directusUrl}/items/app_settings?${APP_SETTINGS_QUERY}`, { signal: AbortSignal.timeout(10_000) });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const body = await response.json();
			if (!body?.data || typeof body.data !== 'object') {
				throw new Error('response has no data object');
			}
			if (!appSettings || outageStart) {
				log('Directus reachable, app_settings copy updated');
			}
			appSettings = body.data;
			outageStart = null;
		} catch (error) {
			// Expected while Directus restarts, the last copy is kept.
			if (!outageStart) {
				log(`Directus not reachable (${JSON.stringify(error.message)}), keeping the last app_settings copy`);
			}
		}
	}

	function setCorsHeaders(request, response) {
		// Same behaviour as Directus with CORS_ORIGIN=true: reflect the origin.
		const origin = request.headers.origin;
		if (origin) {
			response.setHeader('Access-Control-Allow-Origin', origin);
			response.setHeader('Access-Control-Allow-Credentials', 'true');
			response.setHeader('Vary', 'Origin');
		}
		response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
		response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers'] ?? 'Content-Type,Authorization');
	}

	function sendJson(response, status, body) {
		response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
		response.end(JSON.stringify(body));
	}

	function handle(request, response) {
		setCorsHeaders(request, response);
		if (request.method === 'OPTIONS') {
			response.writeHead(204);
			response.end();
			return;
		}
		const now = new Date();
		// Traefik only sends requests here while Directus is down.
		outageStart ??= now;
		if (request.method === 'GET' && normalizePath(request.url) === '/items/app_settings') {
			const body = buildAppSettingsResponse(appSettings, outageStart, now);
			if (body) {
				sendJson(response, 200, body);
				return;
			}
			// Without a copy a partial answer would replace the settings the app has cached.
		}
		response.setHeader('Retry-After', String(MAINTENANCE_EXTENSION_MINUTES * 60));
		sendJson(response, 503, SERVICE_UNAVAILABLE_BODY);
	}

	const server = http.createServer(handle);
	let pollTimer = null;

	return {
		server,
		poll,
		start(port) {
			server.listen(port, () => log(`Maintenance server listening on port ${port}, polling ${directusUrl} every ${pollIntervalSeconds}s`));
			poll();
			pollTimer = setInterval(poll, pollIntervalSeconds * 1000);
		},
		stop() {
			clearInterval(pollTimer);
			server.close();
		},
	};
}

function main() {
	const { DIRECTUS_URL, PORT = '8080', POLL_INTERVAL_SECONDS = '60' } = process.env;
	if (!DIRECTUS_URL) {
		console.error('DIRECTUS_URL is not set');
		process.exit(1);
	}
	const maintenanceServer = createMaintenanceServer({
		directusUrl: DIRECTUS_URL,
		pollIntervalSeconds: Number.parseInt(POLL_INTERVAL_SECONDS, 10),
	});
	maintenanceServer.start(Number.parseInt(PORT, 10));
	process.on('SIGHUP', () => {
		console.log('SIGHUP received, polling Directus now');
		maintenanceServer.poll();
	});
	for (const signal of ['SIGTERM', 'SIGINT']) {
		process.on(signal, () => {
			maintenanceServer.stop();
			process.exit(0);
		});
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
