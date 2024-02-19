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
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";

interface AppState {

}
export const UtilizationButton: FunctionComponent<AppState> = ({...props}) => {

    const accessibilityLabel = useTranslation(TranslationKeys.utilization_forecast)
    const tooltip = useTranslation(TranslationKeys.utilization_forecast)
    const [app_settings, setAppSettings, lastUpdateAppSettings, updateAppSettingsFromServer] = useSynchedAppSettings()
    const visible = app_settings?.utilization_forecast_enabled
    const [utilizationEntries, setUtilizationEntries] = useState<UtilizationsEntries[]>([])
    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
    const selectedDateCopy = new Date(selectedDate);
    const [refreshDate, setRefreshDate] = useState<string>(new Date().toISOString());
    const isDemo = useIsDemo();
    const refreshDependencyKey: string = refreshDate+selectedDateCopy.toISOString()+isDemo;

    let utilizationGroup: string | UtilizationsGroups | null | undefined = profileCanteen?.utilization_group;

    const onPress = useGlobalActionSheetUtilizationForecast(utilizationEntries);

    const refreshEvery5MinutesInterval = 5 * 60 * 1000;
    // create a useEffect which updates every 5 minutes the date
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshDate(new Date().toISOString());
        }, refreshEvery5MinutesInterval);
        return () => clearInterval(interval);
    }, []);

    async function updateUtilizationEntries() {
        // and type of utilizationGroup is UtilizationsGroups
        if(utilizationGroup !== null && utilizationGroup !== undefined && typeof utilizationGroup !== "string") {
            let utilizationEntriesRemote = await loadUtilizationEntriesRemote(utilizationGroup, selectedDateCopy, isDemo);
            setUtilizationEntries(utilizationEntriesRemote)
        }
    }

    // create a useEffect which updates the utilization entries when the dateAsDependecy changes
    useEffect(() => {
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
