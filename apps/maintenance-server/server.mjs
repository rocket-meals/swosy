// Fallback server that answers in place of Directus while it is down, e.g.
// during the restart in scripts/update-and-generate-env.sh.
//
// Traefik routes the backend path here only while no healthy Directus
// container exists (same rule, lowest priority, see docker-compose.yaml).
//
// While Directus is up, this server polls every POLL_INTERVAL_SECONDS and
// keeps in memory what the app needs to look and work as before:
// - the public app_settings (the MaintenanceBanner reads the window from them),
// - /server/info (project name, color and logo id),
// - the project logo image.
// While Directus is down, it answers these from the copy. Every other request
// gets a Directus-style 503, so the app keeps its cached data.
//
// Right before a planned restart the restart script calls the control port
// (PREPARE, only reachable inside the container): the server polls once more
// and sets the maintenance window itself, from now until the estimated end.
// A window entered in Directus (app_settings.maintenance_start/_end) that is
// running at that time is used instead.
//
// SIGHUP polls immediately. No dependencies, plain Node.js, so the container
// needs no build step.

import http from 'node:http';
import { pathToFileURL } from 'node:url';

const MILLISECONDS_PER_MINUTE = 60 * 1000;

/** How far an unannounced or overrunning maintenance is extended into the future. */
export const MAINTENANCE_EXTENSION_MINUTES = 10;

/** A prepared window is forgotten this long after its end, so a later crash does not reuse it. */
export const PREPARED_WINDOW_VALID_AFTER_END_MINUTES = 60;

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

function extendedEnd(nowTime) {
	return new Date(roundUpToFiveMinutes(nowTime + MAINTENANCE_EXTENSION_MINUTES * MILLISECONDS_PER_MINUTE)).toISOString();
}

/** True if the window from app_settings is running at nowTime. */
function isRunning(maintenanceStart, maintenanceEnd, nowTime) {
	const start = parseTime(maintenanceStart);
	const end = parseTime(maintenanceEnd);
	return start !== null && end !== null && start <= nowTime && nowTime < end;
}

/**
 * Maintenance window to send while Directus is down, in this order:
 * 1. a window entered in Directus that is running now,
 * 2. the window the restart script prepared (extended if the restart takes longer),
 * 3. otherwise (crash, no preparation) from the first noticed request until
 *    MAINTENANCE_EXTENSION_MINUTES from now.
 * The start stays stable during one outage, because the app remembers a
 * dismissed banner per maintenance_start.
 */
export function resolveMaintenanceWindow(maintenanceStart, maintenanceEnd, preparedWindow, outageStart, now) {
	const nowTime = now.getTime();
	if (isRunning(maintenanceStart, maintenanceEnd, nowTime)) {
		return { maintenance_start: maintenanceStart, maintenance_end: maintenanceEnd };
	}
	if (preparedWindow) {
		const preparedEnd = parseTime(preparedWindow.maintenance_end);
		return {
			maintenance_start: preparedWindow.maintenance_start,
			maintenance_end: preparedEnd !== null && nowTime < preparedEnd ? preparedWindow.maintenance_end : extendedEnd(nowTime),
		};
	}
	return {
		maintenance_start: new Date(Math.min(outageStart.getTime(), nowTime)).toISOString(),
		maintenance_end: extendedEnd(nowTime),
	};
}

/**
 * The window to prepare before a planned restart: a window entered in
 * Directus that is running now, otherwise from now until estimatedEnd.
 */
export function prepareMaintenanceWindow(appSettings, estimatedEnd, now) {
	const nowTime = now.getTime();
	if (isRunning(appSettings?.maintenance_start, appSettings?.maintenance_end, nowTime)) {
		return { maintenance_start: appSettings.maintenance_start, maintenance_end: appSettings.maintenance_end };
	}
	const end = parseTime(estimatedEnd);
	return {
		maintenance_start: new Date(nowTime).toISOString(),
		maintenance_end: end !== null && end > nowTime ? new Date(end).toISOString() : extendedEnd(nowTime),
	};
}

/** The app_settings answer while Directus is down, or null if no copy was polled yet. */
export function buildAppSettingsResponse(appSettings, preparedWindow, outageStart, now) {
	if (!appSettings) {
		return null;
	}
	return {
		data: {
			...appSettings,
			...resolveMaintenanceWindow(appSettings.maintenance_start, appSettings.maintenance_end, preparedWindow, outageStart, now),
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

async function fetchJsonData(url) {
	const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const body = await response.json();
	if (!body?.data || typeof body.data !== 'object') {
		throw new Error('response has no data object');
	}
	return body.data;
}

export function createMaintenanceServer({ directusUrl, pollIntervalSeconds, log = console.log }) {
	let appSettings = null;
	let serverInfo = null;
	// { id, contentType, body } of the project logo
	let logo = null;
	let preparedWindow = null;
	let outageStart = null;

	async function pollLogo(logoId) {
		if (!logoId || logo?.id === logoId) {
			return;
		}
		const response = await fetch(`${directusUrl}/assets/${encodeURIComponent(logoId)}`, { signal: AbortSignal.timeout(10_000) });
		if (!response.ok) {
			throw new Error(`logo HTTP ${response.status}`);
		}
		logo = { id: logoId, contentType: response.headers.get('content-type') ?? 'application/octet-stream', body: Buffer.from(await response.arrayBuffer()) };
	}

	async function poll() {
		try {
			const [nextAppSettings, nextServerInfo] = await Promise.all([fetchJsonData(`${directusUrl}/items/app_settings?${APP_SETTINGS_QUERY}`), fetchJsonData(`${directusUrl}/server/info`)]);
			if (!appSettings || outageStart) {
				log('Directus reachable, copy of app_settings and server info updated');
			}
			appSettings = nextAppSettings;
			serverInfo = nextServerInfo;
			outageStart = null;
			await pollLogo(serverInfo?.project?.project_logo).catch(error => log(`Project logo not loaded (${JSON.stringify(error.message)})`));
		} catch (error) {
			// Expected while Directus restarts, the last copy is kept.
			if (!outageStart) {
				log(`Directus not reachable (${JSON.stringify(error.message)}), keeping the last copy`);
			}
		}
		const preparedEnd = parseTime(preparedWindow?.maintenance_end);
		if (preparedEnd !== null && Date.now() > preparedEnd + PREPARED_WINDOW_VALID_AFTER_END_MINUTES * MILLISECONDS_PER_MINUTE) {
			preparedWindow = null;
		}
	}

	/** Called by the restart script right before Directus is stopped. */
	async function prepare(estimatedEnd) {
		await poll();
		preparedWindow = prepareMaintenanceWindow(appSettings, estimatedEnd, new Date());
		log(`Prepared for a restart, maintenance window ${preparedWindow.maintenance_start} - ${preparedWindow.maintenance_end}`);
		return preparedWindow;
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
		const path = normalizePath(request.url);
		if (request.method === 'GET' && path === '/items/app_settings') {
			const body = buildAppSettingsResponse(appSettings, preparedWindow, outageStart, now);
			if (body) {
				sendJson(response, 200, body);
				return;
			}
			// Without a copy a partial answer would replace the settings the app has cached.
		}
		if (request.method === 'GET' && path === '/server/info' && serverInfo) {
			sendJson(response, 200, { data: serverInfo });
			return;
		}
		if (request.method === 'GET' && logo && path === `/assets/${logo.id}`) {
			// The app asks for resized variants via query parameters, the original fits all of them.
			response.writeHead(200, { 'Content-Type': logo.contentType, 'Cache-Control': 'no-store' });
			response.end(logo.body);
			return;
		}
		response.setHeader('Retry-After', String(MAINTENANCE_EXTENSION_MINUTES * 60));
		sendJson(response, 503, SERVICE_UNAVAILABLE_BODY);
	}

	/** Control port, bound to 127.0.0.1: only reachable with "docker compose exec" into this container. */
	function handleControl(request, response) {
		if (request.method !== 'POST' || normalizePath(request.url) !== '/prepare') {
			sendJson(response, 404, { error: 'unknown control request' });
			return;
		}
		let raw = '';
		request.on('data', chunk => {
			raw += chunk;
		});
		request.on('end', () => {
			let estimatedEnd = null;
			try {
				estimatedEnd = JSON.parse(raw || '{}').maintenance_end ?? null;
			} catch {
				// No or invalid body: the window gets the default length.
			}
			prepare(estimatedEnd).then(
				window => sendJson(response, 200, window),
				error => sendJson(response, 500, { error: error.message })
			);
		});
	}

	const server = http.createServer(handle);
	const controlServer = http.createServer(handleControl);
	let pollTimer = null;

	return {
		server,
		controlServer,
		poll,
		prepare,
		start(port, controlPort) {
			server.listen(port, () => log(`Maintenance server listening on port ${port}, polling ${directusUrl} every ${pollIntervalSeconds}s`));
			controlServer.listen(controlPort, '127.0.0.1', () => log(`Control port ${controlPort} on 127.0.0.1`));
			poll();
			pollTimer = setInterval(poll, pollIntervalSeconds * 1000);
		},
		stop() {
			clearInterval(pollTimer);
			server.close();
			controlServer.close();
		},
	};
}

function main() {
	const { DIRECTUS_URL, PORT = '8080', CONTROL_PORT = '8081', POLL_INTERVAL_SECONDS = '60' } = process.env;
	if (!DIRECTUS_URL) {
		console.error('DIRECTUS_URL is not set');
		process.exit(1);
	}
	const maintenanceServer = createMaintenanceServer({
		directusUrl: DIRECTUS_URL,
		pollIntervalSeconds: Number.parseInt(POLL_INTERVAL_SECONDS, 10),
	});
	maintenanceServer.start(Number.parseInt(PORT, 10), Number.parseInt(CONTROL_PORT, 10));
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
