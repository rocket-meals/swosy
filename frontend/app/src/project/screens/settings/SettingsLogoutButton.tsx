// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {ConfigHolder, Icon, MyActionsheet, ServerAPI, TranslationKeys} from "../../../kitcheningredients";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {AlertDialog, Button, Text} from "native-base";
import {AppTranslation} from "../../components/translations/AppTranslation";

interface AppState {

}
export const SettingsLogoutButton: FunctionComponent<AppState> = (props) => {

    const actionsheet = MyActionsheet.useActionsheet();

    const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
    const accessibilityLabel = useTranslation(TranslationKeys.logout);
    const logout_confirm_message = useTranslation(TranslationKeys.logout_confirm_message);

    return(
        <>
            <SettingsRow
                leftContent={accessibilityLabel}
                leftIcon={<Icon
                name={"logout"}
            />} accessibilityRole={"button"} accessibilityLabel={accessibilityLabel} {...props} rightIcon={(
                <Icon name={"chevron-right"}  />
            )} onPress={() => {
                actionsheet.show({
                    title: <Text>{logout_confirm_message}</Text>,
                    acceptIcon: "home",
                    acceptLabel: accessibilityLabel,
                    cancelLabel: <AppTranslation id={"cancel"} />,
                    onAccept: async () => {
                        try{
                            await ServerAPI.handleLogout();
                        } catch (err){
                            toast.show({
                                description: <AppTranslation id={"error"} postfix={": "} />
                            });
                            toast.show({
                                description: err.toString()
                            });
                        }
                    }
                })
            }} />
        </>
    )
}
