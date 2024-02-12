import React from "react";
import {Text, View} from "@/components/Themed"
import {getMyScreenHeaderFunction, MyScreenHeader, MyScreenHeaderProps} from "@/components/drawer/MyScreenHeader";

export const getMyScreenHeaderFoodOffers: getMyScreenHeaderFunction = () => {
    return (props: MyScreenHeaderProps) => {
        const title = "TEST"

        function renderSecondaryHeaderContent(props: any) {
            return (
                <View style={{

                }} >
                    <Text>{"TODO: Render Quick Action (Select Canteen, Markings, Price Group)"}</Text>
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
                backgroundColor: "black"
            }}>
            </View>
        </View>
    }
}
