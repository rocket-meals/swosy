import {LocationType} from "@/helper/geo/LocationType";

export class CoordinateHelper{

    static getDemoDirectusCoordinates(latitudeAdd?: number, longitudeAdd?: number): any {
        return {
            "coordinates": [
                13.388818685699732 + (longitudeAdd || 0),
                52.534529900904914 + (latitudeAdd || 0)
            ],
            "type": "Point"
        }
    }

    static getLocation(coordinatesDirectusObj: unknown | null | any): LocationType | null {
        console.log("CoordinateHelper.getLocation", coordinatesDirectusObj);

        /**
         * {
         *     "coordinates": [
         *         13.388818685699732,
         *         52.534529900904914
         *     ],
         *     "type": "Point"
         * }
         */

        if(!coordinatesDirectusObj){
            return null;
        }
        const coordinates = coordinatesDirectusObj?.coordinates;
        if(!coordinates){
            return null;
        }

        //https://gis.stackexchange.com/questions/244651/leafletgeojson-why-are-lat-lng-coordinates-in-the-wrong-order
        //GeoJSON is in [lon, lat] order, while the normal order is [lat, lon].
        //https://en.wikipedia.org/wiki/ISO_6709 says that the order is [lat, lon].
        console.log("CoordinateHelper.getLocation - coordinates", coordinates);
        let latitude = coordinates?.[1];
        let longitude = coordinates?.[0];
        console.log("CoordinateHelper.getLocation", latitude, longitude);
        if(!latitude || !longitude){
            return null;
        }

        // transform to float if it is a string or a number
        try{
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);
            return {
                latitude: latitude,
                longitude: longitude,
            }
        } catch (e){
            console.error("CoordinateHelper.getLocation", e);
            return null;

        }
    }

    static getLocationAsString(location: LocationType, shorten?: boolean): string {
        const latitude = location?.latitude;
        const longitude = location?.longitude;
        if(shorten){
            // now shortened to 5 decimal places
            return latitude?.toFixed(5) + ", " + longitude?.toFixed(5);
        } else {
            return latitude + ", " + longitude;
        }
    }
}