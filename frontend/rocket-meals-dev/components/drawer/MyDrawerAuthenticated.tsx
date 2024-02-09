import {MyDrawer, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";

export const MyDrawerAuthenticated = (props: any) => {
    const [isDevelopMode, setIsDevelopMode] = useSyncState<boolean>(PersistentStore.develop);

    const translation_home = useTranslation(TranslationKeys.home);
    const translation_settings = useTranslation(TranslationKeys.settings);

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
            {renderMyDrawerScreen("home/index", translation_home, translation_home, "home")}
            {renderMyDrawerScreen("settings/index", translation_settings, translation_settings, "cog")}
            {renderMyDrawerScreen("components/index", "Components", "Components", "drawing-box", isDevelopMode)}
        </MyDrawer>
    )
}