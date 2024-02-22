import {MyDrawer, useRenderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {getMyScreenHeaderFoodOffers} from "@/compositions/foodoffers/MyScreenHeaderFoodOffers";
import {IconNames} from "@/constants/IconNames";
import {Custom_Wiki_Ids, useSynchedWikisDict} from "@/states/SynchedWikis";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {useMyDrawerWikiItems, useRenderedMyDrawerWikiScreens} from "@/components/drawer/useMyDrawerWikiItems";

export const MyDrawerAuthenticated = (props: any) => {
    const [isDevelopMode, setIsDevelopMode] = useSyncState<boolean>(PersistentStore.develop);

    const translation_home = useTranslation(TranslationKeys.home);
    const translation_settings = useTranslation(TranslationKeys.settings);
    const translation_canteens = useTranslation(TranslationKeys.canteens);

    let [languageCode, setLanguageCode] = useProfileLanguageCode();

    const customDrawerWikiItems = useMyDrawerWikiItems()
    const renderedMyDrawerWikiItems = useRenderedMyDrawerWikiScreens()

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

    if(!!customDrawerWikiItems) {
        customDrawerItems.push(...customDrawerWikiItems)
    }


    return(
        <MyDrawer
            customDrawerItems={customDrawerItems}
        >
            {useRenderMyDrawerScreen({
                routeName: "home/index",
                label: translation_home,
                title: translation_home,
                icon: "home",
                visibleInDrawer: false
            })}
            {useRenderMyDrawerScreen({
                    routeName: "foodoffers/index",
                    label: translation_canteens,
                    title: translation_canteens,
                    icon: IconNames.foodoffers_icon,
                    header: getMyScreenHeaderFoodOffers()
            })}
            {useRenderMyDrawerScreen({
                routeName: "settings/index",
                label: translation_settings,
                title: translation_settings,
                icon: IconNames.settings_icon,
            })}
            {useRenderMyDrawerScreen({
                routeName: "components/index",
                label: "Components",
                title: "Components",
                icon: "drawing-box",
                visibleInDrawer: isDevelopMode
            })}
            {renderedMyDrawerWikiItems}
        </MyDrawer>
    )
}