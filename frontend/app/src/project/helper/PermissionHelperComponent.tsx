import {ConfigHolder, MyActionsheet, NavigatorHelper, ServerAPI} from "../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {View, Text} from "native-base";
import {PermissionHelper} from "./PermissionHelper";
import {TouchableOpacity} from "react-native";
import {NotAllowed} from "../components/animations/NotAllowed";
import {AppTranslation, useAppTranslation} from "../components/translations/AppTranslation";
import {AccountRequiredComponent} from "./AccountRequiredComponent";
import {TouchableOpacityIgnoreChildEvents} from "./overlay/TouchableOpacityIgnoreChildEvents";

export type PermissonHelperComponentProps = {
    collection: string,
    fields: string[],
    actions: string[],
    hideIfNotAllowed?: boolean,
}
export const PermissionHelperComponent: FunctionComponent<PermissonHelperComponentProps> = (props) => {

    const translationNoPermission = useAppTranslation("noPermission");

    const user = ConfigHolder.instance.getUser();
    const actionsheet = MyActionsheet.useActionsheet();

    let allowed = true;
    for(let field of props.fields){
        for(let action of props.actions){
            allowed = allowed && PermissionHelper.isFieldAllowedForAction(ConfigHolder.instance.getRole(), ConfigHolder.instance.getPermissions(), props.collection, props.fields, action);
        }
    }

    if(allowed){
        return (
            <>
                {props.children}
            </>
        )
    }

    let title = translationNoPermission;
    let acceptLabel = <AppTranslation id={"okay"} />;
    let onAccept = () => {};

    if(user.isGuest){
        return (
            <AccountRequiredComponent>
                {props.children}
            </AccountRequiredComponent>
        )
    }

    return (
        <TouchableOpacityIgnoreChildEvents
            useDefaultOpacity={true}
            onPress={() => {
                actionsheet.show({
                    title: title,
                    onAccept: onAccept,
                    acceptLabel: acceptLabel,
                    cancelLabel: <AppTranslation id={"cancel"}/>,
                    renderDescription: () => {
                        return (
                            <NotAllowed/>
                        )
                    }
                });
            }}
        >
            {props.children}
        </TouchableOpacityIgnoreChildEvents>
    )
}
