// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowNavigator} from "./SettingsRowNavigator";
import {SettingCanteen} from "../../screens/settings/SettingCanteen";
import {CanteenIcon} from "../canteen/CanteenIcon";
import {useSynchedCanteen, useSynchedCanteensDict} from "../../helper/synchedJSONState";
import {useSynchedProfileCanteen} from "../profile/ProfileAPI";

export const SettingsRowCanteen: FunctionComponent = (props) => {

    const translation = useAppTranslation("settingcanteen")
    const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();
    const resource = useSynchedCanteen(profileCanteenId);
    const canteen = resource;
    const label = canteen?.label;

    return <SettingsRowNavigator rightContent={label} accessibilityLabel={translation+": "+label} destinationComponent={SettingCanteen} leftContent={translation} leftIcon={<CanteenIcon />} />
}
