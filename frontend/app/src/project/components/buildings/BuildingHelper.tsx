import {DistanceHelper} from "../../helper/geo/DistanceHelper";
import {LocationType} from "../../helper/geo/LocationType";
import {CommonSystemActionHelper} from "../../helper/SystemActionHelper";
import {Apartments, BuildingsTranslations, Canteens, DirectusFiles, DirectusUsers} from "../../directusTypes/types";

export class BuildingHelper {

    static openURL(building){
        const buildingUrl = BuildingHelper.getBuildingUrl(building);
        CommonSystemActionHelper.openExternalURL(buildingUrl)
    }

    static getBuildingUrl(building){
        return building?.url;
    }

    static openLocation(building){
        const buildingLocation = BuildingHelper.getBuildingLocation(building);
        CommonSystemActionHelper.openMaps(buildingLocation)
    }

    static getBuildingLocation(building): LocationType {
        const building_coord = building?.coord;
        const coordinates = building_coord?.coordinates;

        //https://gis.stackexchange.com/questions/244651/leafletgeojson-why-are-lat-lng-coordinates-in-the-wrong-order
        //GeoJSON is in [lon, lat] order, while the normal order is [lat, lon].
        //https://en.wikipedia.org/wiki/ISO_6709 says that the order is [lat, lon].
        const latitude = coordinates?.[1];
        const longitude = coordinates?.[0];
        return {
            latitude: latitude,
            longitude: longitude,
        }
    }

    static getBuildingDistance(building, location): number {
        const userLat = location?.latitude;
        const userLon = location?.longitude;

        if(!!building && !!userLat && !!userLon){
            const buildingLocation = BuildingHelper.getBuildingLocation(building);
            const buildingLat = buildingLocation.latitude;
            const buildingLon = buildingLocation.longitude;
            const distance = DistanceHelper.getDistanceInKm(userLat, userLon, buildingLat, buildingLon);
            return distance;
        } else {
            return undefined;
        }
    }

    static formatBuildingDistance(distance): string {
        if(distance !== undefined && distance !== null){ // distance can be 0
            if(distance<1){
                return (distance*1000).toFixed(0)+"m";
            } else if (distance<10){
                return distance.toFixed(1)+"km";
            } else {
                return distance.toFixed(0)+"km";
            }
        } else {
            return "";
        }
    }

    static getName(building): string {
        return building?.name;
    }


    public static getDemoBuildingsDict(){
        let amount = 20;
        let output = {};
        // a list of string names as titles containing headlines news
        let titles = [
            "Majestic Skyscraper",
            "Historic Brownstone",
            "Pristine Corporate Plaza",
            "Modern Tech Park",
            "Artistic Loft Building",
            "Suburban Office Park",
            "Classic Victorian Manor",
            "Innovative Greenhouse Complex",
            "Urban Retail Center",
            "Stately Government Building"
        ]
        for(let index = 0; index<amount; index++){
            let id = index+1;
            let title = titles[index%titles.length];
            let newsItem = BuildingHelper.getDemoNewsByIndex(title, id)
            output[newsItem.id] = newsItem;
        }
        return output;
    }

    private static getDemoNewsByIndex(custonName?, index?){
        let demoName = custonName || "Building Name";

        return {
            "id": index,
            "name": demoName,
            "coord": {
                "coordinates": [
                    9.713841832799663,
                    52.38629873875931
                ],
                "type": "Point"
            },
            year_of_construction: (2000+index)+"",
            url: "https://rocket-meals.de",
            "translations": [
                {
                    "id": 7469,
                    "languages_code": "de-DE",
                    "buildings_id": "1216-1884",
                    "content": "DEMO Content "+demoName+" DE",
                },
                {
                    "id": 7470,
                    "languages_code": "en-US",
                    "buildings_id": "1216-1884",
                    "content": "DEMO Content "+demoName+" EN",
                }
            ]
        }
    }



}
