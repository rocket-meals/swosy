import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {Canteens, UtilizationsEntries, UtilizationsGroups} from "@/helper/database/databaseTypes/types";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import React from "react";
import {UtilizationForecast} from "@/compositions/utilizationForecast/UtilizationForecast";

export function useGlobalActionSheetUtilizationForecast(utilizationEntires: UtilizationsEntries[] | undefined){

    const translation_title = useTranslation(TranslationKeys.utilization_forecast)

    const config = {
        onCancel: async () => {
            return true;
        },
        visible: true,
        title: translation_title,
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            return <UtilizationForecast key={JSON.stringify(utilizationEntires)} utilizationEntires={utilizationEntires} />
        }
    }

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    return onPress;
}
