/**
 * Data model of the course timetable, stored in `profiles.course_timetable`.
 *
 * The stored shape predates this module: a record keyed by id whose entries carry
 * `weekday` as `{ id: 'monday', name: 'Mon' }`. Older app versions read that shape, so
 * {@link serializeCourseTimetable} keeps writing it; {@link normalizeCourseTimetable} also
 * accepts a bare weekday string.
 */

export const COURSE_TIMETABLE_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type CourseTimetableWeekday = (typeof COURSE_TIMETABLE_WEEKDAYS)[number];

/** Where an event came from. Imported events are replaced on the next import; manual ones stay. */
export type CourseTimetableEventSource = 'manual' | 'import';

export type CourseTimetableEvent = {
	id: string;
	title: string;
	/** Free-text room, e.g. "69/E15". */
	location?: string | null;
	/** Hex color '#rrggbb'. */
	color: string;
	/** 'HH:mm' */
	start: string;
	/** 'HH:mm' */
	end: string;
	weekday: CourseTimetableWeekday;
	/** e.g. "Vorlesung", "Übung" – shown as given by the source. */
	kind?: string | null;
	source?: CourseTimetableEventSource;
	/** Building the room belongs to, when the source knows it. */
	building_id?: string | null;
	/** The entry exactly as the import source sent it (e.g. the Stud.IP JSON:API resource), shown in debug mode. */
	source_data?: unknown;
};

/** Short weekday names used in the stored `{ id, name }` weekday object (and translation keys). */
export const WEEKDAY_SHORT_KEYS: Record<CourseTimetableWeekday, string> = {
	monday: 'Mon',
	tuesday: 'Tue',
	wednesday: 'Wed',
	thursday: 'Thu',
	friday: 'Fri',
	saturday: 'Sat',
	sunday: 'Sun',
};

export const DEFAULT_COURSE_COLOR = '#3A78D8';

/** Colors offered as swatches in the event details. */
export const COURSE_COLOR_SWATCHES = ['#3A78D8', '#2A9C95', '#3D9A5C', '#A88B4A', '#E07A2A', '#D9497F', '#7E57D9'];

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: unknown): value is string {
	return typeof value === 'string' && TIME_PATTERN.test(value.trim());
}

/** 'HH:mm' (or 'HH:mm:ss') → minutes since midnight; NaN for invalid input. */
export function timeToMinutes(value: string): number {
	const [hours, minutes] = value.split(':');
	const h = Number.parseInt(hours ?? '', 10);
	const m = Number.parseInt(minutes ?? '', 10);
	if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN;
	return h * 60 + m;
}

/** Minutes since midnight → 'HH:mm'. */
export function minutesToTime(totalMinutes: number): string {
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Normalizes 'H:mm' to 'HH:mm'. */
function normalizeTime(value: string): string {
	return minutesToTime(timeToMinutes(value.trim()));
}

export function isWeekday(value: unknown): value is CourseTimetableWeekday {
	return typeof value === 'string' && (COURSE_TIMETABLE_WEEKDAYS as readonly string[]).includes(value);
}

/** Accepts 'monday', 'Monday' or `{ id: 'monday' }`. */
function parseWeekday(value: unknown): CourseTimetableWeekday | null {
	let raw: unknown = value;
	if (value && typeof value === 'object' && 'id' in value) {
		raw = (value as { id?: unknown }).id;
	}
	if (typeof raw !== 'string') return null;
	const lower = raw.toLowerCase();
	return isWeekday(lower) ? lower : null;
}

/** Weekday of a local Date. */
export function weekdayOfDate(date: Date): CourseTimetableWeekday {
	// Date.getDay(): 0 = Sunday
	const index = (date.getDay() + 6) % 7;
	return COURSE_TIMETABLE_WEEKDAYS[index] ?? 'monday';
}

/** Reads `profiles.course_timetable` into a clean, sorted event list; drops broken entries. */
export function normalizeCourseTimetable(raw: unknown): CourseTimetableEvent[] {
	if (!raw || typeof raw !== 'object') return [];
	const entries = Array.isArray(raw) ? raw : Object.entries(raw as Record<string, unknown>).map(([key, value]) => ({ ...(value as object), id: (value as { id?: unknown })?.id ?? key }));
	const events: CourseTimetableEvent[] = [];
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const item = entry as Record<string, unknown>;
		const weekday = parseWeekday(item.weekday);
		const start = item.start;
		const end = item.end;
		if (!weekday || !isValidTime(start) || !isValidTime(end)) continue;
		if (timeToMinutes(start) >= timeToMinutes(end)) continue;
		events.push({
			id: String(item.id ?? ''),
			title: typeof item.title === 'string' ? item.title : '',
			location: typeof item.location === 'string' ? item.location : null,
			color: typeof item.color === 'string' && item.color.length > 0 ? item.color : DEFAULT_COURSE_COLOR,
			start: normalizeTime(start),
			end: normalizeTime(end),
			weekday,
			kind: typeof item.kind === 'string' ? item.kind : null,
			source: item.source === 'import' ? 'import' : 'manual',
			building_id: typeof item.building_id === 'string' ? item.building_id : null,
			...(item.source_data !== undefined && item.source_data !== null ? { source_data: item.source_data } : {}),
		});
	}
	return sortEvents(events);
}

export function sortEvents(events: CourseTimetableEvent[]): CourseTimetableEvent[] {
	return [...events].sort((a, b) => {
		const dayDiff = COURSE_TIMETABLE_WEEKDAYS.indexOf(a.weekday) - COURSE_TIMETABLE_WEEKDAYS.indexOf(b.weekday);
		if (dayDiff !== 0) return dayDiff;
		return timeToMinutes(a.start) - timeToMinutes(b.start);
	});
}

/** Writes events back into the stored record shape (see module comment). */
export function serializeCourseTimetable(events: CourseTimetableEvent[]): Record<string, Record<string, unknown>> {
	const result: Record<string, Record<string, unknown>> = {};
	for (const event of events) {
		result[event.id] = {
			id: event.id,
			title: event.title,
			location: event.location ?? null,
			color: event.color,
			start: event.start,
			end: event.end,
			weekday: { id: event.weekday, name: WEEKDAY_SHORT_KEYS[event.weekday] },
			kind: event.kind ?? null,
			source: event.source ?? 'manual',
			building_id: event.building_id ?? null,
			...(event.source_data !== undefined ? { source_data: event.source_data } : {}),
		};
	}
	return result;
}

/** A new id that does not collide with existing ones (ids used to be "count + 1", which collided after a delete). */
export function createEventId(existing: CourseTimetableEvent[]): string {
	const used = new Set(existing.map(event => event.id));
	let id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
	while (used.has(id)) {
		id = `${id}x`;
	}
	return id;
}

export function upsertEvent(events: CourseTimetableEvent[], event: CourseTimetableEvent): CourseTimetableEvent[] {
	const exists = events.some(e => e.id === event.id);
	const next = exists ? events.map(e => (e.id === event.id ? event : e)) : [...events, event];
	return sortEvents(next);
}

export function removeEvent(events: CourseTimetableEvent[], id: string): CourseTimetableEvent[] {
	return events.filter(event => event.id !== id);
}

/**
 * Replaces all imported events by a fresh import; manual events stay untouched.
 * With `overwriteAll`, manual events are dropped too (the "import and replace" action).
 */
export function mergeImportedEvents(current: CourseTimetableEvent[], imported: CourseTimetableEvent[], overwriteAll: boolean): CourseTimetableEvent[] {
	const kept = overwriteAll ? [] : current.filter(event => event.source !== 'import');
	const importedWithSource = imported.map(event => ({ ...event, source: 'import' as const }));
	return sortEvents([...kept, ...importedWithSource]);
}

export function eventsForWeekday(events: CourseTimetableEvent[], weekday: CourseTimetableWeekday): CourseTimetableEvent[] {
	return events.filter(event => event.weekday === weekday).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export type PositionedEvent = CourseTimetableEvent & {
	startMinutes: number;
	endMinutes: number;
	/** Column within a group of overlapping events (0-based). */
	lane: number;
	/** Number of columns the overlapping group needs. */
	laneCount: number;
	/** True when another event of the same day overlaps this one. */
	overlaps: boolean;
};

/** Places the events of one day into side-by-side lanes so overlapping events do not cover each other. */
export function layoutDayEvents(dayEvents: CourseTimetableEvent[]): PositionedEvent[] {
	const sorted = dayEvents.map(event => ({ ...event, startMinutes: timeToMinutes(event.start), endMinutes: timeToMinutes(event.end), lane: 0, laneCount: 1, overlaps: false })).sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

	const clusters: PositionedEvent[][] = [];
	let current: PositionedEvent[] = [];
	let currentEnd = -1;
	for (const event of sorted) {
		if (current.length > 0 && event.startMinutes >= currentEnd) {
			clusters.push(current);
			current = [];
		}
		current.push(event);
		currentEnd = Math.max(currentEnd, event.endMinutes);
	}
	if (current.length > 0) clusters.push(current);

	for (const cluster of clusters) {
		const laneEnds: number[] = [];
		for (const event of cluster) {
			let lane = laneEnds.findIndex(end => end <= event.startMinutes);
			if (lane === -1) {
				lane = laneEnds.length;
				laneEnds.push(0);
			}
			laneEnds[lane] = event.endMinutes;
			event.lane = lane;
		}
		for (const event of cluster) {
			event.laneCount = laneEnds.length;
			event.overlaps = cluster.length > 1;
		}
	}
	return sorted;
}

/**
 * Finds the building a free-text room belongs to: an explicit `building_id` wins, otherwise
 * the location must equal a building's alias / external identifier, or start with it followed
 * by a separator ("69/E15" → building "69").
 */
export function findBuildingIdForLocation(event: Pick<CourseTimetableEvent, 'location' | 'building_id'>, buildings: { id: string; alias?: string | null; external_identifier?: string | null }[]): string | null {
	if (event.building_id && buildings.some(building => building.id === event.building_id)) {
		return event.building_id;
	}
	const location = event.location?.trim().toLowerCase();
	if (!location) return null;
	let best: { id: string; length: number } | null = null;
	for (const building of buildings) {
		for (const candidate of [building.alias, building.external_identifier]) {
			const name = candidate?.trim().toLowerCase();
			if (!name) continue;
			const matches = location === name || (location.startsWith(name) && /[\s/,.\-:]/.test(location.charAt(name.length)));
			if (matches && (!best || name.length > best.length)) {
				best = { id: building.id, length: name.length };
			}
		}
	}
	return best?.id ?? null;
}
