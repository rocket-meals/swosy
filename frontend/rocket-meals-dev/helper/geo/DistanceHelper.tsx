import {LocationType} from "@/helper/geo/LocationType";

export class DistanceHelper {

    static EARTH_RADIUS_IN_KM = 6371; // Radius of the earth in km

    static getDistanceInM(lat1: number, lon1: number, lat2: number, lon2: number, precision = 2) {
        return DistanceHelper.getDistanceInMWithPlanetRadius(lat1, lon1, lat2, lon2, DistanceHelper.EARTH_RADIUS_IN_KM, precision);
    }

    static getDistanceInMWithPlanetRadius(lat1: number, lon1: number, lat2: number, lon2: number, planetRadius: number, precision = 2) {
        let dLat = DistanceHelper.deg2rad(lat2-lat1);  // DistanceHelper.deg2rad below
        let dLon = DistanceHelper.deg2rad(lon2-lon1);
        let a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(DistanceHelper.deg2rad(lat1)) * Math.cos(DistanceHelper.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = planetRadius * c; // Distance in km

        let d_in_m = d * 1000; // convert to meters
        if(precision>0){
            let rounded = Math.round(d_in_m * Math.pow(10, precision)) / Math.pow(10, precision);
            return rounded;
        }
        return d_in_m;
    }

    static getDistanceOfLocationInM(location1: LocationType, location2: LocationType, precision = 2) {
        return DistanceHelper.getDistanceInM(location1.latitude, location1.longitude, location2.latitude, location2.longitude, precision);
    }

    private static deg2rad(number: number) {
        return number * (Math.PI/180)
    }
}
