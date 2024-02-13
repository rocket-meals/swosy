import {MyDrawer, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {getMyScreenHeaderFoodOffers} from "@/compositions/foodoffers/MyScreenHeaderFoodOffers";
import {IconNames} from "@/constants/IconNames";

export const MyDrawerAuthenticated = (props: any) => {
    const [isDevelopMode, setIsDevelopMode] = useSyncState<boolean>(PersistentStore.develop);

    const translation_home = useTranslation(TranslationKeys.home);
    const translation_settings = useTranslation(TranslationKeys.settings);
    const translation_canteens = useTranslation(TranslationKeys.canteens);

    const customDrawerItems: MyDrawerCustomItemProps[] = [
        /**
        {
            label: "Hallo",
            onPress: undefined,
            onPressInternalRouteTo: undefined,
            onPressExternalRouteTo: undefined,
            icon: "home",
            position: 0
        }
        */
    ]

    return(
        <MyDrawer
            customDrawerItems={customDrawerItems}
        >
            {renderMyDrawerScreen({
                routeName: "home/index",
                label: translation_home,
                title: translation_home,
                icon: "home",
                visibleInDrawer: false
            })}
            {renderMyDrawerScreen({
                    routeName: "foodoffers/index",
                    label: translation_canteens,
                    title: translation_canteens,
                    icon: IconNames.foodoffers_icon,
                    header: getMyScreenHeaderFoodOffers()
            })}
            {renderMyDrawerScreen({
                routeName: "settings/index",
                label: translation_settings,
                title: translation_settings,
                icon: IconNames.settings_icon,
            })}
            {renderMyDrawerScreen({
                routeName: "components/index",
                label: "Components",
                title: "Components",
                icon: "drawing-box",
                visibleInDrawer: isDevelopMode
            })}
        </MyDrawer>
    )
}