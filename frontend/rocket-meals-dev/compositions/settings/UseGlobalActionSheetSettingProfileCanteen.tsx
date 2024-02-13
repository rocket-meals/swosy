import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import React from "react";

export function useGlobalActionSheetSettingProfileCanteen(){

    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const translation_title = useTranslation(TranslationKeys.canteen)
    const label = translation_title


    let items: MyGlobalActionSheetItem[] = [];

    const onSelectCanteen = (canteen: Canteens, hide: () => void) => {
        console.log("onPress:")
        console.log(canteen);
        setProfileCanteen(canteen);
        hide();
    }

    items.push({
        key: "gridList",
        label: label,
        //icon: "test",
        accessibilityLabel: translation_title,
        render: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
            // Use the custom context provider to provide the input value and setter
            const onPress = (canteen: Canteens) => {
                onSelectCanteen(canteen, hide)
            }

            return <CanteenGridList onPress={onPress} />
        }
    })

    const config = {
        onCancel: async () => {
            return true;
        },
        visible: true,
        title: translation_title,
        items: items
    }

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    return onPress;
}
