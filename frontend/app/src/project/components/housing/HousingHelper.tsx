import {useSynchedRemoteSettings, useSynchedSettingsHousing} from "../../helper/synchedJSONState";
import {Buildings, DirectusUsers, Washingmachines} from "../../directusTypes/types";
import {WashingmashineHelper} from "../washingmachine/WashingmashineHelper";

export class HousingHelper{
    static useHousingVisiblity(): boolean{
        const [housingSettings, setHousingSettings] = useSynchedSettingsHousing();
        const housingVisibility = housingSettings?.["enabled"]
        return housingVisibility;
    }

    public static getDemoHousingDict(){
        let amount = 20;
        let output = {};
        // a list of string names as titles containing headlines news
        let titles = [
            "Small City Apartment",
            "Luxury Riverside House",
            "Modern Loft Condo",
            "Charming Suburban Bungalow",
            "Vintage Townhouse",
            "Cozy Studio Apartment",
            "Elegant Penthouse Suite",
            "Rustic Mountain Cabin",
            "Beachfront Villa",
            "Traditional Farmhouse"
        ]
        for(let index = 0; index<amount; index++){
            let id = index+1;
            let title = titles[index%titles.length];
            let newsItem = HousingHelper.getDemoHousingByIndex(title, id)
            output[newsItem.id] = newsItem;
        }
        return output;
    }

    private static getDemoHousingByIndex(custonName?, index?){
        let demoName = custonName || "Food Name";

        let availablefromDate = index%2==0 ? new Date() : undefined;

        return {
            "id": index,
            available_from: availablefromDate,
            building: index,
            washingmachines: WashingmashineHelper.getDemoWashingmachineIdList()
        }
    }
}
