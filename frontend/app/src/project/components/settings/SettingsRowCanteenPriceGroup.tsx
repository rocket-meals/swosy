// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowNavigator} from "./SettingsRowNavigator";
import {ProfileAPI} from "../profile/ProfileAPI";
import {SettingPriceGroup} from "../../screens/settings/SettingPriceGroup";
import {PriceGroupIcon} from "../icons/PriceGroupIcon";

export const SettingsRowCanteenPriceGroup: FunctionComponent = (props) => {

    const [priceGroup, setPriceGroup, priceGroups] = ProfileAPI.useSynchedPriceGroup();
    const title = useAppTranslation("price_group");
    const translationEdit = useAppTranslation("edit");
    const priceGroupInformation = priceGroups[priceGroup];
    const priceGroupTranslation = priceGroupInformation?.label

    return (
        <SettingsRowNavigator rightContent={priceGroupTranslation} accessibilityLabel={translationEdit+": "+title + " " + priceGroupTranslation} destinationComponent={SettingPriceGroup} leftContent={title} leftIcon={<PriceGroupIcon />} />
    )

}
