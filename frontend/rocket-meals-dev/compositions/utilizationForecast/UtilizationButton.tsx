import React, {FunctionComponent, useEffect, useState} from "react";
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import {Text, View} from "@/components/Themed";
import {
    useGlobalActionSheetUtilizationForecast
} from "@/compositions/utilizationForecast/UseGlobalActionSheetUtilizationForecast";
import {UtilizationsEntries, UtilizationsGroups} from "@/helper/database/databaseTypes/types";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {loadUtilizationEntriesRemote} from "@/states/SynchedUtiliztations";
import {useIsDemo} from "@/states/SynchedDemo";
import {useFoodOfferSelectedDate} from "@/states/SynchedFoodOfferStates";

interface AppState {

}
export const UtilizationButton: FunctionComponent<AppState> = ({...props}) => {

    const accessibilityLabel = useTranslation(TranslationKeys.utilization_forecast)
    const tooltip = useTranslation(TranslationKeys.utilization_forecast)
    const [app_settings, setAppSettings, lastUpdateAppSettings, updateAppSettingsFromServer] = useSynchedAppSettings()
    const visible = app_settings?.utilization_forecast_enabled || true
    const [utilizationEntries, setUtilizationEntries] = useState<UtilizationsEntries[]>([])

    const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
    const selectedDateCopy = new Date(selectedDate);
    const [refreshDate, setRefreshDate] = useState<string>(new Date().toISOString());
    const isDemo = useIsDemo();
    const refreshDependencyKey: string = refreshDate+selectedDateCopy.toISOString()+isDemo;

    let utilizationGroup: UtilizationsGroups = {
        id: "1",
        utilization_entries: []
    }

    const onPress = useGlobalActionSheetUtilizationForecast(utilizationEntries);

    // create a useEffect which updates every 5 minutes the date
    useEffect(() => {
        console.log("useEffect of UtilizationButton")
        const interval = setInterval(() => {
            setRefreshDate(new Date().toISOString());
        }, 300000);
        return () => clearInterval(interval);
    }, []);

    async function updateUtilizationEntries() {
        let utilizationEntriesRemote = await loadUtilizationEntriesRemote(utilizationGroup, selectedDateCopy, isDemo);
        console.log("updateUtilizationEntries")
        console.log(utilizationEntriesRemote)
        setUtilizationEntries(utilizationEntriesRemote)
    }

    // create a useEffect which updates the utilization entries when the dateAsDependecy changes
    useEffect(() => {
        console.log("dateAsDependecy changed")
        console.log("refreshDate: "+refreshDate)
        console.log("selectedDate: "+selectedDateCopy.toISOString())
        console.log("isDemo: "+isDemo)
        updateUtilizationEntries()
    }, [refreshDependencyKey]);


    if(!visible){
        return null;
    } else {
        return (
            <MyButton key={refreshDependencyKey} useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel}
                      useTransparentBackgroundColor={true} useTransparentBorderColor={true}
                      leftIcon={IconNames.utilization_icon} {...props} onPress={onPress}/>
        )
    }
}
