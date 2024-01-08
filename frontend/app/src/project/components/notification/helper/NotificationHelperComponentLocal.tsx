import React, {FunctionComponent} from "react";
import {PlatformHelper} from "../../../../kitcheningredients";
import {NotificationHelperComponentLocalMobile} from "./NotificationHelperComponentLocalMobile";
import {ComingSoonComponent} from "../../../helper/ComingSoonComponent";
import {NotificationIcon} from "../NotificationIcon";
import {View} from "native-base";

export type NotificationHelperComponentProps = {
    localNotificationKey?: string;
    getNotificationMessageObject?: () => any;
    style?: any;
}
export const NotificationHelperComponentLocal: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    if(PlatformHelper.isSmartPhone()) {
        return (
            <NotificationHelperComponentLocalMobile {...props} />
        )
    } else {
        return (
            <ComingSoonComponent>
                <View style={props?.style}>
                    <NotificationIcon active={false} />
                </View>
            </ComingSoonComponent>
        );
    }

}
