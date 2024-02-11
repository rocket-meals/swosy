import React, {FunctionComponent} from "react";
import {useIsDebug} from "@/states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {
    useSynchedProfile,
    useSynchedProfileCanteen
} from "@/states/SynchedProfile";
import {Text, View} from "@/components/Themed";
import {MyGlobalActionSheetItem} from "@/components/actionsheet/MyGlobalActionSheet";
import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";

interface AppState {

}
export const SettingsRowProfileCanteen: FunctionComponent<AppState> = ({...props}) => {

    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

    const leftIcon = "warehouse"
    const translation_title = useTranslation(TranslationKeys.canteen)
    const label = translation_title
    const canteenId = profileCanteen?.id;
    const canteenIdAsString = canteenId ? canteenId+"" : undefined;
    const labelRight: string = profileCanteen?.label || canteenIdAsString || "unknown";

    const accessibilityLabel = translation_title;

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

    return(
        <>
            <SettingsRowActionsheet label={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} {...props}  />
        </>
    )
}
