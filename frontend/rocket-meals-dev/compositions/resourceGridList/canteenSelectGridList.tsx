import React, {FunctionComponent} from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";

interface AppState {
    onPress?: (canteen: Canteens | undefined) => void;
}
export const CanteenSelectGridList: FunctionComponent<AppState> = ({onPress, ...props}) => {

    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const onSelectCanteen = (canteen: Canteens) => {
        setProfileCanteen(canteen);
        if (onPress) {
            onPress(canteen);
        }
    }

    return(
        <CanteenGridList onPress={onSelectCanteen} />
    )
}
