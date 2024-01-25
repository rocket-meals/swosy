import React from "react";
import {AllRoutes, Link, router} from "expo-router";
import {View, Text} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";

export type LegalRequiredInternalLinkProps = {
    href: AllRoutes,
    text: string,
}
export const LegalRequiredLink = (props: LegalRequiredInternalLinkProps) => {

    return <View style={{flexDirection: "row"}}>
        <MyTouchableOpacity accessibilityLabel={props.text} onPress={() => {
            router.push(props.href)
        }}>
            <Text style={{fontSize: 12}}>{props.text}</Text>
        </MyTouchableOpacity>
    </View>

}
