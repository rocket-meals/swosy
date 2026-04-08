import { SavedActivity } from './ActivityStorage';

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
}

export function formatDuration(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
	if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
	return `${s}s`;
}

export function formatSpeed(kmh: number): string {
	return `${kmh.toFixed(1)} km/h`;
}

export function formatPace(minPerKm: number): string {
	if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:-- /km';
	const m = Math.floor(minPerKm);
	const s = Math.round((minPerKm - m) * 60);
	return `${m}:${String(s).padStart(2, '0')} /km`;
}

// ─── Aggregate stats type ─────────────────────────────────────────────────────

export type AggregateStats = {
	count: number;
	totalDistanceKm: number;
	totalDurationSeconds: number;
	maxSpeedKmh: number;
	totalAvgSpeedSum: number;
	bestPaceMinPerKm: number;
	/** Average pace computed from total distance and total duration. */
	avgPaceMinPerKm: number;
	/** Pace of the most recently finished activity (sorted by startedAt desc). */
	lastPaceMinPerKm: number;
	totalElevationGainM: number;
	totalElevationLossM: number;
	totalKcal: number;
	totalSteps: number;
	totalFluidNeedsMl: number;
};

// ─── Aggregate computation ────────────────────────────────────────────────────

/**
 * Compute aggregate statistics over a list of activities.
 * Activities are expected to be sorted newest-first (by startedAt desc)
 * so that `activities[0]` is the most recent.
 */
export function computeStats(activities: SavedActivity[]): AggregateStats {
	const result: AggregateStats = {
		count: activities.length,
		totalDistanceKm: 0,
		totalDurationSeconds: 0,
		maxSpeedKmh: 0,
		totalAvgSpeedSum: 0,
		bestPaceMinPerKm: Infinity,
		avgPaceMinPerKm: 0,
		lastPaceMinPerKm: 0,
		totalElevationGainM: 0,
		totalElevationLossM: 0,
		totalKcal: 0,
		totalSteps: 0,
		totalFluidNeedsMl: 0,
	};

	for (const act of activities) {
		const s = act.stats;
		result.totalDistanceKm += s.distanceKm;
		result.totalDurationSeconds += s.durationSeconds;
		if (s.maxSpeedKmh > result.maxSpeedKmh) result.maxSpeedKmh = s.maxSpeedKmh;
		result.totalAvgSpeedSum += s.avgSpeedKmh;
		if (s.paceMinPerKm > 0 && s.paceMinPerKm < result.bestPaceMinPerKm) {
			result.bestPaceMinPerKm = s.paceMinPerKm;
		}
		result.totalElevationGainM += s.elevationGainM;
		result.totalElevationLossM += s.elevationLossM;
		result.totalKcal += s.kcal;
		result.totalSteps += s.steps;
		result.totalFluidNeedsMl += s.fluidNeedsMl;
	}

	// Average pace = total minutes / total distance km
	if (result.totalDistanceKm > 0) {
		result.avgPaceMinPerKm = (result.totalDurationSeconds / 60) / result.totalDistanceKm;
	}

	// Last pace = pace of the most recent activity (activities sorted newest-first)
	if (activities.length > 0) {
		result.lastPaceMinPerKm = activities[0].stats.paceMinPerKm;
	}

	return result;
}
