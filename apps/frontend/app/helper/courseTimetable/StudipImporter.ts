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
};

export const STUDIP_INSTANCES: StudipInstance[] = [{ id: 'uni-osnabrueck', name: 'Universität Osnabrück', baseUrl: 'https://studip.uni-osnabrueck.de' }];

/**
 * Public CORS proxy, only for developers: in debug mode the web app routes the Stud.IP requests
 * through it (the login then passes a third party). Access has to be unlocked once per browser
 * on that page.
 */
export const STUDIP_DEBUG_CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

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
		const locations = Array.isArray(attributes.locations) ? attributes.locations.filter((location): location is string => typeof location === 'string' && location.trim().length > 0) : [];
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
