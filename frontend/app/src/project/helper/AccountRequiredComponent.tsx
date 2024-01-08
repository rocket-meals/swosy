import {ConfigHolder, MyActionsheet, Navigation, NavigatorHelper, ServerAPI} from "../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {View, Text} from "native-base";
import {PermissionHelper} from "./PermissionHelper";
import {TouchableOpacity} from "react-native";
import {NotAllowed} from "../components/animations/NotAllowed";
import {AppTranslation, useAppTranslation} from "../components/translations/AppTranslation";
import {TouchableOpacityIgnoreChildEvents} from "./overlay/TouchableOpacityIgnoreChildEvents";

export type PermissonHelperComponentProps = {
    collection: string,
    fields: string[],
    actions: string[],
    hideIfNotAllowed?: boolean,
}
export const AccountRequiredComponent: FunctionComponent<PermissonHelperComponentProps> = (props) => {

    const translationNoPermission = useAppTranslation("noPermission");
    const translationCreateAnAccount = useAppTranslation("createAnAccount");
    const loginOrRegister = useAppTranslation("loginOrCreate");

    const user = ConfigHolder.instance.getUser();
    const actionsheet = MyActionsheet.useActionsheet();

    if(user.isGuest){
        return (
            <TouchableOpacityIgnoreChildEvents
                style={props?.style}
                useDefaultOpacity={true}
                onPress={() => {
                actionsheet.show({
                    title: translationNoPermission+". "+translationCreateAnAccount,
                    onAccept: async () => {
                        Navigation.navigateHome()
//                        NavigatorHelper.navigateHome();
                        ServerAPI.handleLogout();
                    },
                    acceptLabel: loginOrRegister,
                    cancelLabel: <AppTranslation id={"cancel"} />,
                    renderDescription: () => {
                        return (
                            <NotAllowed />
                        )
                    }
                });
            }}>
                    {props.children}
            </TouchableOpacityIgnoreChildEvents>
        )
    }

    return (
        <>
            {props.children}
        </>
    )
}
