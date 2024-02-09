import {MyDrawer, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useLogoutCallback} from "@/states/User";

export const MyDrawerSetup = (props: any) => {
    const translation_logout = useTranslation(TranslationKeys.logout);
    const handleLogout = useLogoutCallback();

    const customDrawerItems: MyDrawerCustomItemProps[] = [
        {
            label: translation_logout,
            onPress: handleLogout,
            onPressInternalRouteTo: undefined,
            onPressExternalRouteTo: undefined,
            icon: "logout",
            position: 0
        }
    ]

    return(
        <MyDrawer
            customDrawerItems={customDrawerItems}
        >
            {renderMyDrawerScreen("setup/index", "Setup", "Setup", undefined, false)}
        </MyDrawer>
    )
}