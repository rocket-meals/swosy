import {MyActionsheet} from "../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {AppTranslation, useAppTranslation} from "../components/translations/AppTranslation";
import {TouchableOpacityIgnoreChildEvents} from "./overlay/TouchableOpacityIgnoreChildEvents";
import {CommingSoonAnimation} from "../components/animations/CommingSoonAnimation";

export const ComingSoonComponent: FunctionComponent = (props) => {

    const translationNoPermission = useAppTranslation("comingSoon");
    const actionsheet = MyActionsheet.useActionsheet();

    let title = translationNoPermission;
    let acceptLabel = <AppTranslation id={"okay"} />;
    let onAccept = () => {};

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
                            <CommingSoonAnimation/>
                        )
                    }
                });
            }}
        >
            {props.children}
        </TouchableOpacityIgnoreChildEvents>
    )
}
