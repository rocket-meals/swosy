/**
 * Shared GPS route/activity types used by the route-recording features in
 * multiple apps (rocket-meals map jogging overlay, geonexia activity storage),
 * so the field shapes stay in sync instead of being duplicated per app.
 */

/** A single recorded GPS track point. */
export type GpsRoutePoint = {
  lat: number;
  lng: number;
  /** Altitude in meters, when the device provides one. */
  altitude: number | null;
  /** Speed in m/s from GPS, may be null or negative. */
  speed: number | null;
  /** Unix epoch milliseconds at which the point was recorded. */
  timestamp: number;
};

/** Min/max/average speed observed over some span of GPS points. */
export type SpeedStats = {
  /** Maximum speed in km/h observed during the activity */
  maxSpeedKmh: number;
  /** Minimum speed in km/h observed during the activity */
  minSpeedKmh: number;
  /** Average speed in km/h during the activity */
  avgSpeedKmh: number;
};
