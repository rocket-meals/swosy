export class DistanceHelper {

    static EARTH_RADIUS_IN_KM = 6371; // Radius of the earth in km

    static getDistanceInKm(lat1, lon1, lat2, lon2, precision = 2) {
        return DistanceHelper.getDistanceInKmWithPlanetRadius(lat1, lon1, lat2, lon2, DistanceHelper.EARTH_RADIUS_IN_KM, precision);
    }

    static getDistanceInKmWithPlanetRadius(lat1, lon1, lat2, lon2, planetRadius, precision = 2) {
        let dLat = DistanceHelper.deg2rad(lat2-lat1);  // DistanceHelper.deg2rad below
        let dLon = DistanceHelper.deg2rad(lon2-lon1);
        let a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(DistanceHelper.deg2rad(lat1)) * Math.cos(DistanceHelper.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = planetRadius * c; // Distance in km

        if(precision>0){
            let rounded = Math.round(d * Math.pow(10, precision)) / Math.pow(10, precision);
            return rounded;
        }
        return d;
    }

    private static deg2rad(number: number) {
        return number * (Math.PI/180)
    }
}
