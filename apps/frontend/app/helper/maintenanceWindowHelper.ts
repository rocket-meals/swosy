/**
 * Decides whether the app warns about a server maintenance, based on
 * app_settings.maintenance_start / maintenance_end.
 *
 * The backend restart (scripts/update-and-generate-env.sh) writes both fields
 * shortly before it restarts the server, an admin can also enter them by hand
 * in Directus. The fields are dateTime without time zone in Berlin local time,
 * so they are parsed as local time of the device.
 */

/** How long before maintenance_start the app starts to warn. */
export const MAINTENANCE_NOTICE_LEAD_MINUTES = 30;

/** Assumed length when maintenance_end is missing, so a forgotten start never warns forever. */
export const MAINTENANCE_DEFAULT_DURATION_MINUTES = 60;

const MILLISECONDS_PER_MINUTE = 60 * 1000;

export type MaintenanceNotice = {
	phase: 'upcoming' | 'active';
	start: Date;
	end: Date;
};

function parseDate(value: string | null | undefined): Date | null {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function resolveMaintenanceWindow(maintenanceStart: string | null | undefined, maintenanceEnd: string | null | undefined): { start: Date; end: Date } | null {
	const start = parseDate(maintenanceStart);
	if (!start) {
		return null;
	}
	const parsedEnd = parseDate(maintenanceEnd);
	const end = parsedEnd && parsedEnd.getTime() > start.getTime() ? parsedEnd : new Date(start.getTime() + MAINTENANCE_DEFAULT_DURATION_MINUTES * MILLISECONDS_PER_MINUTE);
	return { start, end };
}

export function getMaintenanceNotice(maintenanceStart: string | null | undefined, maintenanceEnd: string | null | undefined, now: Date, leadMinutes: number = MAINTENANCE_NOTICE_LEAD_MINUTES): MaintenanceNotice | null {
	const window = resolveMaintenanceWindow(maintenanceStart, maintenanceEnd);
	if (!window) {
		return null;
	}
	const { start, end } = window;
	const nowTime = now.getTime();
	if (nowTime < start.getTime() - leadMinutes * MILLISECONDS_PER_MINUTE || nowTime >= end.getTime()) {
		return null;
	}
	return { phase: nowTime < start.getTime() ? 'upcoming' : 'active', start, end };
}

/** Milliseconds until the notice appears, changes its phase or disappears, or null if it never changes again. */
export function getMillisecondsUntilNextMaintenanceChange(maintenanceStart: string | null | undefined, maintenanceEnd: string | null | undefined, now: Date, leadMinutes: number = MAINTENANCE_NOTICE_LEAD_MINUTES): number | null {
	const window = resolveMaintenanceWindow(maintenanceStart, maintenanceEnd);
	if (!window) {
		return null;
	}
	const nowTime = now.getTime();
	const changes = [window.start.getTime() - leadMinutes * MILLISECONDS_PER_MINUTE, window.start.getTime(), window.end.getTime()];
	const next = changes.find(change => change > nowTime);
	return next === undefined ? null : next - nowTime;
}
