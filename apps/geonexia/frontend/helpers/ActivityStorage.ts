import { Directory, File, Paths } from 'expo-file-system';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type RoutePoint = {
	lat: number;
	lng: number;
	altitude: number | null;
	speed: number | null;
	timestamp: number;
};

export type RunStats = {
	distanceKm: number;
	durationSeconds: number;
	paceMinPerKm: number;
	maxSpeedKmh: number;
	minSpeedKmh: number;
	avgSpeedKmh: number;
	kcal: number;
	steps: number;
	elevationGainM: number;
	elevationLossM: number;
	fluidNeedsMl: number;
};

export type SavedActivity = {
	id: string;
	startedAt: number;
	endedAt: number;
	routePoints: RoutePoint[];
	stats: RunStats;
};

// ─── Storage directories and files ───────────────────────────────────────────

function getActivitiesDir(): Directory {
	return new Directory(Paths.document, 'geonexia-activities');
}

function getActivityFile(id: string): File {
	return new File(getActivitiesDir(), id + '.json');
}

function getConsentFile(): File {
	return new File(Paths.document, 'geonexia-osm-consent.json');
}

// ─── Activity persistence ─────────────────────────────────────────────────────

export function saveActivity(activity: SavedActivity): void {
	const dir = getActivitiesDir();
	if (!dir.exists) {
		dir.create({ idempotent: true });
	}
	getActivityFile(activity.id).write(JSON.stringify(activity));
}

export async function loadActivities(): Promise<SavedActivity[]> {
	const dir = getActivitiesDir();
	if (!dir.exists) return [];

	let entries: (File | Directory)[];
	try {
		entries = dir.list();
	} catch {
		return [];
	}

	const activities: SavedActivity[] = [];
	for (const entry of entries) {
		if (!(entry instanceof File)) continue;
		if (!entry.name.endsWith('.json')) continue;
		try {
			const content = await entry.text();
			activities.push(JSON.parse(content) as SavedActivity);
		} catch {
			// Skip corrupted files
		}
	}
	// Sort by startedAt descending (newest first)
	activities.sort((a, b) => b.startedAt - a.startedAt);
	return activities;
}

export async function loadActivity(id: string): Promise<SavedActivity | null> {
	const file = getActivityFile(id);
	if (!file.exists) return null;
	try {
		const content = await file.text();
		return JSON.parse(content) as SavedActivity;
	} catch {
		return null;
	}
}

export function deleteActivity(id: string): void {
	try {
		const file = getActivityFile(id);
		if (file.exists) file.delete();
	} catch {
		// Ignore errors
	}
}

export function deleteAllActivities(): void {
	try {
		const dir = getActivitiesDir();
		if (!dir.exists) return;
		const entries = dir.list();
		for (const entry of entries) {
			if (entry instanceof File && entry.name.endsWith('.json')) {
				entry.delete();
			}
		}
	} catch {
		// Ignore errors
	}
}

// ─── OSM consent persistence ──────────────────────────────────────────────────

export function saveOsmConsent(consented: boolean): void {
	try {
		getConsentFile().write(JSON.stringify({ consented }));
	} catch {
		// Ignore write errors
	}
}

export async function loadOsmConsent(): Promise<boolean> {
	try {
		const file = getConsentFile();
		if (!file.exists) return false;
		const content = await file.text();
		const data = JSON.parse(content) as { consented?: boolean };
		return data.consented === true;
	} catch {
		return false;
	}
}
