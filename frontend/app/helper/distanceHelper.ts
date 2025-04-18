export type LocationType = {
  latitude: number;
  longitude: number;
};

export function calculateDistanceInMeter(
  selectedLocation: Array<number>,
  targetLocation: Array<number>
): Number {
  if (selectedLocation && targetLocation) {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const earthRadiusMeters = 6371000; // Earth's radius in meters
    const lat1 = toRadians(selectedLocation[0]);
    const lon1 = toRadians(selectedLocation[1]);
    const lat2 = toRadians(targetLocation[0]);
    const lon2 = toRadians(targetLocation[1]);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadiusMeters * c; // Distance in meters

    // if (distance > 1000) {
    //   return `${(distance / 1000).toFixed(2)} km`; // Return distance in kilometers with 2 decimal places
    // } else {
    return Math.round(distance); // Return distance in meters rounded to the nearest integer
    // }
  }
  return 0;
}

export function getDistanceUnit(distance: number): string {
  if (distance > 1000) {
    return `${(distance / 1000).toFixed(2)} km`; // Return distance in kilometers with 2 decimal places
  } else {
    return `${Math.round(distance)} m`; // Return distance in meters rounded to the nearest integer
  }
}