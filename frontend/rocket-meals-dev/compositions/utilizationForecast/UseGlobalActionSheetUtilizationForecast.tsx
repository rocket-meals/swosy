import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {Canteens, UtilizationsEntries, UtilizationsGroups} from "@/helper/database/databaseTypes/types";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import React from "react";
import {UtilizationForecast} from "@/compositions/utilizationForecast/UtilizationForecast";

export function useGlobalActionSheetUtilizationForecast(utilizationEntires: UtilizationsEntries[]){

    const translation_title = useTranslation(TranslationKeys.utilization_forecast)
    const label = translation_title


    let items: MyGlobalActionSheetItem[] = [];

    const config = {
        onCancel: async () => {
            return true;
        },
        visible: true,
        title: translation_title,
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            return <UtilizationForecast utilizationEntires={utilizationEntires} />
        },
        items: items
    }

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    return onPress;
}
