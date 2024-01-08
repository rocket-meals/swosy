import React, {FunctionComponent, useCallback, useEffect, useState} from "react";
import {Divider, ScrollView, Spinner, Text, View} from "native-base";
import {BaseNoScrollTemplate, BasePadding, Icon, ServerAPI, useThemeTextColor} from "../../../kitcheningredients";
import {useSynchedChatroomsDict} from "../../helper/synchedJSONState";
import {ConversationHelper} from "../../components/conversations/ConversationHelper";
import Rectangle from "../../helper/Rectangle";
import {DateHelper} from "../../helper/DateHelper";
import {MyTouchableOpacity} from "../../components/buttons/MyTouchableOpacity";
import {TextInputGrowing} from "../../components/inputs/TextInputGrowing";
import {useAppTranslation} from "../../components/translations/AppTranslation";

export interface ConversationMessageProps {
    message: any,
}
export const ConversationMessage: FunctionComponent<ConversationMessageProps> = (props) => {

    const textColor = useThemeTextColor();

    const message = props?.message;
    let textarea = message?.textarea;
    let message_date_created = message?.date_created;
    let renderedDate = DateHelper.formatOfferDateToReadable(message_date_created, true, true);

    let icon = null;
    if(message?.pending){
        icon = <Spinner accessibilityLabel="Loading posts" color={textColor} />
    } else {
        icon = <Icon name={"check"} />;
    }
    if(message?.failed){
        //icon = <Icon name={"replay"} /> //TODO implement a retry button?
        icon = <Icon name={"replay"} />
    }
    //TODO implement seen by
    // then use this icon <Icon name={"check-all"} />

    let sizeAvatar = 40;

    let itemAvatar = (
        <View style={{width: sizeAvatar, height: sizeAvatar, backgroundColor: "orange", borderRadius: sizeAvatar, overflow: "hidden"}}>
            <Rectangle>

            </Rectangle>
        </View>
    )
    let itemSpacer = (
        <View style={{width: sizeAvatar/2, height: sizeAvatar/2, backgroundColor: "transparent", borderRadius: sizeAvatar/2, overflow: "hidden"}}>
            <Rectangle>

            </Rectangle>
        </View>
    )

    let itemLeft = null;
    let itemRight = null;

    let isOther = true;
    if(isOther){
        itemLeft = itemAvatar;
        itemRight = itemSpacer;
    } else {
        itemLeft = itemSpacer;
        itemRight = itemAvatar;
    }

    return (
        <View style={{flexDirection: "row", paddingBottom: 10}}>
            {itemLeft}
            <View style={{marginHorizontal: 10, flex: 1, backgroundColor: "gray", borderRadius: 10, paddingHorizontal: 10}}>
                <View style={{width: "100%"}}>
                    <Text>{textarea}</Text>
                </View>
                <View style={{width: "100%", alignItems: "flex-end", flex: 1, justifyContent: "flex-end"}}>
                    <View style={{flexDirection: "row"}}>
                        {icon}
                        <Text fontSize={"sm"} italic={true}>{renderedDate}</Text>
                    </View>
                </View>
            </View>
            {itemRight}
        </View>
    )

}
