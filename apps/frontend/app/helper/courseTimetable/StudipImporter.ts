import { MyBuffer } from 'repo-depkit-common-ui';
import { COURSE_COLOR_SWATCHES, COURSE_TIMETABLE_WEEKDAYS, CourseTimetableEvent, CourseTimetableWeekday, isValidTime, timeToMinutes } from './CourseTimetableModel';

/**
 * Imports the current semester's timetable from a Stud.IP instance via its JSON:API.
 *
 * The app talks to Stud.IP directly: username and password go only into the HTTP Basic
 * header of these two requests and are never stored or sent to our server.
 *
 * - `GET /jsonapi.php/v1/users/me` → the user's id
 * - `GET /jsonapi.php/v1/users/{id}/schedule` → the current semester's schedule: the user's own
 *   `schedule-entries` plus the `seminar-cycle-dates` of their courses
 *
 * Stud.IP sends no CORS headers, so a browser blocks these requests; the import works in the
 * native apps.
 */

export type StudipInstance = {
	id: string;
	/** Proper name of the university, shown as is. */
	name: string;
	baseUrl: string;
	/**
	 * Path of the university's central login (SSO) on its Stud.IP. The app opens it in a WebView;
	 * once the user is logged in there, the schedule is read with that session (see
	 * {@link buildStudipSessionScheduleScript}) – no OAuth client id needed.
	 */
	ssoLoginPath?: string;
	/** Whether Stud.IP's own username/password check works for the university's students. */
	passwordLogin: boolean;
};

export const STUDIP_INSTANCES: StudipInstance[] = [
	{
		id: 'uni-osnabrueck',
		name: 'Universität Osnabrück',
		baseUrl: 'https://studip.uni-osnabrueck.de',
		ssoLoginPath: '/dispatch.php/login?again=yes&sso=oidc&cancel_login=1',
		passwordLogin: true,
	},
];

/**
 * Public CORS proxy, only for developers: in debug mode the web app routes the Stud.IP requests
 * through it (the login then passes a third party). Access has to be unlocked once per browser
 * on that page.
 */
export const STUDIP_DEBUG_CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

/** Page where developers unlock the public CORS proxy for their browser. */
export const STUDIP_DEBUG_CORS_PROXY_UNLOCK_URL = 'https://cors-anywhere.herokuapp.com/corsdemo';
/** The same address without the scheme, short enough to show as link text. */
export const STUDIP_DEBUG_CORS_PROXY_UNLOCK_LABEL = 'cors-anywhere.herokuapp.com/corsdemo';

export type CorsProxyStatus = 'ok' | 'locked' | 'unreachable';

type ProxyFetchLike = (url: string) => Promise<{ status: number; headers?: { get: (name: string) => string | null }; text: () => Promise<string> }>;

/**
 * Health check of the debug CORS proxy: an unauthenticated request to Stud.IP through it.
 * Any answer from Stud.IP (usually 401) means the proxy works; the proxy itself answers 403 with
 * a pointer to `/corsdemo` while it is not unlocked for this browser; a thrown fetch means it is
 * not reachable at all.
 */
export async function checkCorsProxy(instance: StudipInstance, corsProxy: string = STUDIP_DEBUG_CORS_PROXY, fetchFn: ProxyFetchLike = fetch as unknown as ProxyFetchLike): Promise<CorsProxyStatus> {
	let response;
	try {
		response = await fetchFn(`${corsProxy}${instance.baseUrl}/jsonapi.php/v1/users/me`);
	} catch {
		return 'unreachable';
	}
	if (response.status === 403) {
		const location = response.headers?.get('location') ?? '';
		const body = await response.text().catch(() => '');
		if (location.includes('corsdemo') || body.includes('corsdemo')) return 'locked';
	}
	return 'ok';
}

export type StudipImportErrorCode = 'unauthorized' | 'network' | 'unexpected';

export class StudipImportError extends Error {
	readonly code: StudipImportErrorCode;

	constructor(code: StudipImportErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

type JsonApiResource = {
	type?: string;
	id?: string;
	attributes?: Record<string, unknown>;
	relationships?: { owner?: { data?: { id?: string } | null } };
};

/**
 * Stud.IP weekdays: course cycle dates use 0 = Sunday … 6 = Saturday, own schedule entries
 * 1 = Monday … 7 = Sunday. Both agree on 1–6, so 0 and 7 are Sunday.
 */
export function studipWeekdayToWeekday(value: unknown): CourseTimetableWeekday | null {
	const day = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
	if (Number.isNaN(day) || day < 0 || day > 7) return null;
	if (day === 0 || day === 7) return 'sunday';
	return COURSE_TIMETABLE_WEEKDAYS[day - 1] ?? null;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** A room name from one `locations` entry: a plain string or an object with a name-like field. */
function locationName(value: unknown): string | null {
	if (typeof value === 'string') return textOrNull(value);
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		return textOrNull(record.name) ?? textOrNull(record.room) ?? textOrNull(record.title) ?? textOrNull(record.description);
	}
	return null;
}

/**
 * Room names of a cycle date. Stud.IP sends `locations` as a list, but a PHP array with
 * gaps in its keys (e.g. after `array_unique`) arrives as an object; both are read.
 */
export function studipLocations(value: unknown): string[] {
	if (typeof value === 'string') return textOrNull(value) ? [value.trim()] : [];
	if (!value || typeof value !== 'object') return [];
	const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
	const names: string[] = [];
	for (const entry of entries) {
		const name = locationName(entry);
		if (name && !names.includes(name)) names.push(name);
	}
	return names;
}

/** Maps a `users/{id}/schedule` response to timetable events (source `import`). */
export function mapStudipSchedule(response: unknown): CourseTimetableEvent[] {
	const data = (response as { data?: unknown })?.data;
	if (!Array.isArray(data)) {
		throw new StudipImportError('unexpected', 'Stud.IP schedule response has no data array');
	}
	// One color per course, so lecture and exercise of the same course look alike.
	const colorByGroup = new Map<string, string>();
	const colorFor = (group: string) => {
		let color = colorByGroup.get(group);
		if (!color) {
			color = COURSE_COLOR_SWATCHES[colorByGroup.size % COURSE_COLOR_SWATCHES.length] ?? COURSE_COLOR_SWATCHES[0] ?? '#3A78D8';
			colorByGroup.set(group, color);
		}
		return color;
	};

	const events: CourseTimetableEvent[] = [];
	for (const resource of data as JsonApiResource[]) {
		if (resource?.type !== 'seminar-cycle-dates' && resource?.type !== 'schedule-entries') continue;
		const attributes = resource.attributes ?? {};
		const weekday = studipWeekdayToWeekday(attributes.weekday);
		const start = attributes.start;
		const end = attributes.end;
		if (!weekday || !isValidTime(start) || !isValidTime(end) || timeToMinutes(start) >= timeToMinutes(end)) continue;

		const title = textOrNull(attributes.title) ?? '';
		const locations = studipLocations(attributes.locations ?? attributes.location ?? attributes.room);
		const group = resource.relationships?.owner?.data?.id ?? title;
		events.push({
			id: `studip-${resource.type}-${resource.id ?? events.length}`,
			title,
			location: locations.length > 0 ? locations.join(', ') : null,
			kind: textOrNull(attributes.description),
			color: textOrNull(attributes.color) ?? colorFor(group),
			start,
			end,
			weekday,
			source: 'import',
			building_id: null,
			source_data: resource,
		});
	}
	return events;
}

type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{ status: number; json: () => Promise<unknown> }>;

async function getJson(fetchFn: FetchLike, url: string, authorization: string): Promise<unknown> {
	let response;
	try {
		response = await fetchFn(url, { headers: { Authorization: authorization, Accept: 'application/vnd.api+json' } });
	} catch (error) {
		throw new StudipImportError('network', error instanceof Error ? error.message : 'Network error');
	}
	// Only 401 means a wrong login; a 403 also comes from the debug CORS proxy while it is locked.
	if (response.status === 401) {
		throw new StudipImportError('unauthorized', `Stud.IP responded with HTTP ${response.status}`);
	}
	if (response.status !== 200) {
		throw new StudipImportError('unexpected', `Stud.IP responded with HTTP ${response.status}`);
	}
	try {
		return await response.json();
	} catch {
		throw new StudipImportError('unexpected', 'Stud.IP sent no JSON');
	}
}

export function buildBasicAuthorization(username: string, password: string): string {
	return `Basic ${MyBuffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
}

/** Loads the user's current semester schedule from Stud.IP. */
export async function fetchStudipSchedule(instance: StudipInstance, username: string, password: string, fetchFn: FetchLike = fetch as unknown as FetchLike, options: { corsProxy?: string } = {}): Promise<CourseTimetableEvent[]> {
	const authorization = buildBasicAuthorization(username.trim(), password);
	const apiBase = `${options.corsProxy ?? ''}${instance.baseUrl}/jsonapi.php/v1`;
	const me = (await getJson(fetchFn, `${apiBase}/users/me`, authorization)) as { data?: { id?: string } };
	const userId = me?.data?.id;
	if (!userId) {
		throw new StudipImportError('unexpected', 'Stud.IP returned no user id');
	}
	const schedule = await getJson(fetchFn, `${apiBase}/users/${encodeURIComponent(userId)}/schedule`, authorization);
	return mapStudipSchedule(schedule);
}

/** Message type the injected script posts back to the app. */
export const STUDIP_SESSION_MESSAGE_TYPE = 'rocket-meals-studip-schedule';

/**
 * JavaScript injected into the Stud.IP page in the WebView after every page load. Once the
 * user is logged in (`users/me` answers 200 with the session cookie), it loads the schedule
 * from the same origin – so neither CORS nor an OAuth client is involved – and posts it to
 * the app. Before the login it stays silent.
 */
export function buildStudipSessionScheduleScript(instance: StudipInstance): string {
	const base = JSON.stringify(`${instance.baseUrl}/jsonapi.php/v1`);
	const origin = JSON.stringify(new URL(instance.baseUrl).origin);
	const type = JSON.stringify(STUDIP_SESSION_MESSAGE_TYPE);
	return `(function () {
	if (window.location.origin !== ${origin} || window.__rocketMealsStudipRunning) { return; }
	window.__rocketMealsStudipRunning = true;
	var headers = { Accept: 'application/vnd.api+json' };
	var post = function (payload) { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); };
	fetch(${base} + '/users/me', { credentials: 'include', headers: headers })
		.then(function (me) {
			if (me.status !== 200) { window.__rocketMealsStudipRunning = false; return null; }
			return me.json().then(function (json) {
				var id = json && json.data && json.data.id;
				return fetch(${base} + '/users/' + encodeURIComponent(id) + '/schedule', { credentials: 'include', headers: headers }).then(function (schedule) {
					return schedule.text().then(function (body) { post({ type: ${type}, status: schedule.status, body: body }); });
				});
			});
		})
		.catch(function (error) { window.__rocketMealsStudipRunning = false; post({ type: ${type}, status: 0, body: String(error) }); });
})();
true;`;
}

/**
 * Turns a message of the injected script into events. Returns null for messages that are not
 * ours (the page may post its own); throws StudipImportError for a failed request.
 */
export function parseStudipSessionMessage(data: string): CourseTimetableEvent[] | null {
	let message: { type?: unknown; status?: unknown; body?: unknown };
	try {
		message = JSON.parse(data);
	} catch {
		return null;
	}
	if (message?.type !== STUDIP_SESSION_MESSAGE_TYPE) return null;
	if (message.status === 0) {
		throw new StudipImportError('network', typeof message.body === 'string' ? message.body : 'Network error');
	}
	if (message.status !== 200 || typeof message.body !== 'string') {
		throw new StudipImportError('unexpected', `Stud.IP responded with HTTP ${String(message.status)}`);
	}
	let schedule: unknown;
	try {
		schedule = JSON.parse(message.body);
	} catch {
		throw new StudipImportError('unexpected', 'Stud.IP sent no JSON');
	}
	return mapStudipSchedule(schedule);
}
