import {MyDrawer, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const MyDrawerAuthenticated = (props: any) => {
    const translation_sign_in = useTranslation(TranslationKeys.sign_in);

    return(
        <MyDrawer
        >
            {renderMyDrawerScreen("login", translation_sign_in, translation_sign_in, "sign-in")}
        </MyDrawer>
    )
}