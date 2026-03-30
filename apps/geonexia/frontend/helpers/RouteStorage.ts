import { Directory, File, Paths } from 'expo-file-system';
import { SportType } from '../store/sportTypeSlice';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type SavedRoute = {
	id: string;
	name: string;
	/** Ordered sequence of H3 hex tile indices representing the route. */
	hexTiles: string[];
	/** H3 resolution used when recording the route. */
	h3Resolution: number;
	/** Unix timestamp (ms) when the route was first created. */
	createdAt: number;
	/** Sport type associated with the route (optional). */
	sportType?: SportType;
};

// ─── Storage directories and files ───────────────────────────────────────────

function getRoutesDir(): Directory {
	return new Directory(Paths.document, 'geonexia-routes');
}

function getRouteFile(id: string): File {
	return new File(getRoutesDir(), id + '.json');
}

// ─── Route persistence ───────────────────────────────────────────────────────

export function saveRoute(route: SavedRoute): void {
	const dir = getRoutesDir();
	if (!dir.exists) {
		dir.create({ idempotent: true });
	}
	getRouteFile(route.id).write(JSON.stringify(route));
}

export async function loadRoutes(): Promise<SavedRoute[]> {
	const dir = getRoutesDir();
	if (!dir.exists) return [];

	let entries: (File | Directory)[];
	try {
		entries = dir.list();
	} catch {
		return [];
	}

	const routes: SavedRoute[] = [];
	for (const entry of entries) {
		if (!(entry instanceof File)) continue;
		if (!entry.name.endsWith('.json')) continue;
		try {
			const content = await entry.text();
			routes.push(JSON.parse(content) as SavedRoute);
		} catch {
			// Skip corrupted files
		}
	}
	// Sort by createdAt descending (newest first)
	routes.sort((a, b) => b.createdAt - a.createdAt);
	return routes;
}

export async function loadRoute(id: string): Promise<SavedRoute | null> {
	const file = getRouteFile(id);
	if (!file.exists) return null;
	try {
		const content = await file.text();
		return JSON.parse(content) as SavedRoute;
	} catch {
		return null;
	}
}

export function deleteRoute(id: string): void {
	try {
		const file = getRouteFile(id);
		if (file.exists) file.delete();
	} catch {
		// Ignore errors
	}
}

export function deleteAllRoutes(): void {
	try {
		const dir = getRoutesDir();
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
