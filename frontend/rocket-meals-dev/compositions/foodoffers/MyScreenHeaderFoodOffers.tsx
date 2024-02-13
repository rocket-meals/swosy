import React from "react";
import {Text, View} from "@/components/Themed"
import {getMyScreenHeaderFunction, MyScreenHeader, MyScreenHeaderProps} from "@/components/drawer/MyScreenHeader";
import {SettingsButtonProfileCanteen} from "@/compositions/settings/SettingsButtonProfileCanteen";

export const getMyScreenHeaderFoodOffers: getMyScreenHeaderFunction = () => {
    return (props: MyScreenHeaderProps) => {
        const title = undefined //"TEST"

        function renderSecondaryHeaderContent(props: any) {
            return (
                <View style={{
                    height: "100%",
                    backgroundColor: "orange",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "row",
                }} >
                    <SettingsButtonProfileCanteen />
                </View>
            );
        }

        return <View style={{
            width: "100%",
        }}>
            <MyScreenHeader {...props} custom_title={title} custom_renderHeaderDrawerOpposite={renderSecondaryHeaderContent} />
            <View style={{
                height: 100,
                width: "100%",
                backgroundColor: "orange",
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
            }}>
                <Text>{"Previous day"}</Text>
                <Text>{"Date Picker"}</Text>
                <Text>{"Next day"}</Text>
            </View>
        </View>
    }
}
