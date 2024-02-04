import {MyDrawer, MyDrawerCustomItem, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const MyDrawerAuthenticated = (props: any) => {
    const translation_home = useTranslation(TranslationKeys.home);
    const translation_settings = useTranslation(TranslationKeys.settings);

    const customDrawerItems: MyDrawerCustomItem[] = [
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
        </MyDrawer>
    )
}