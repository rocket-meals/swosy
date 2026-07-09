import type { SportType } from '../store/sportTypeSlice';
import type { RoutePoint } from './ActivityStorage';

// ─── Shared types across SavedActivity, SavedRoute & InterruptedRecordingSnapshot ──

/**
 * Fields shared by `SavedActivity` (ActivityStorage.ts) and `SavedRoute`
 * (RouteStorage.ts): identity/sport-type metadata plus the "red line"
 * walked-edge geometry (a finer-grained walk path than the displayed h10
 * hex tiles).
 *
 * `h3Resolution` is optional here (matching `SavedActivity`'s backward-compat
 * needs); `SavedRoute` narrows it back to required via intersection since
 * routes have always required it.
 */
export type RedLineRouteFields = {
	id: string;
	/** Sport type associated with the activity/route. Optional for backward-compat with older saves. */
	sportType?: SportType;
	/** H3 resolution used during recording. Optional for backward-compat with older saves. */
	h3Resolution?: number;
	/**
	 * Ordered H3 cell transitions at the red-line resolution, stored as
	 * "cellA:cellB" strings where cellA is lexicographically smaller than cellB.
	 * Used to draw the red walk-path line at a finer granularity than the h10
	 * tile centres.
	 * Optional for backward-compat with older saves that lack this field.
	 */
	walkedEdgesRedLine?: string[];
	/**
	 * H3 resolution used to compute `walkedEdgesRedLine`.
	 * Stored alongside the edges so consumers do not need to hard-code the
	 * resolution — the field is the single source of truth.
	 * Optional for backward-compat with older saves that lack this field.
	 */
	walkedEdgesRedLineResolution?: number;
};

/**
 * Fields shared by `SavedActivity` (ActivityStorage.ts) and
 * `InterruptedRecordingSnapshot` (InterruptedRecordingStorage.ts) describing
 * a GPS recording session. Reuses `sportType`/`h3Resolution` from
 * `RedLineRouteFields` rather than redeclaring them with a conflicting shape.
 *
 * All fields here are optional (matching `SavedActivity`'s backward-compat
 * needs); `InterruptedRecordingSnapshot` narrows the ones it always writes
 * fresh (`sportType`, `h3Resolution`, `hexTilesOrdered`) back to required via
 * intersection.
 */
export type RecordingSessionFields = Pick<RedLineRouteFields, 'sportType' | 'h3Resolution'> & {
	/** Unix timestamp (ms) when the recording/activity was started */
	startedAt: number;
	/** GPS route points recorded during the session */
	routePoints: RoutePoint[];
	/**
	 * Ordered sequence of H3 hex tile indices visited during the session.
	 * Optional for backward-compat with older saves.
	 */
	hexTilesOrdered?: string[];
	/**
	 * ID of the saved route this session was matched or assigned to.
	 * - `undefined` (field absent): the user has not yet been asked to assign a route.
	 * - `null`: the user explicitly chose not to assign any route.
	 * - `string`: the ID of the assigned `SavedRoute`.
	 */
	routeId?: string | null;
};
