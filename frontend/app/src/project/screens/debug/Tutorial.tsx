import {Text, View} from "native-base";
import React from "react";

export const Tutorial = (props: any) => {

    return (
        <View style={{width: "100%", height: "100%", backgroundColor: "orange"}}>
            <Text>{"Tutorial page"}</Text>
            <Text>{JSON.stringify(props)}</Text>
        </View>
    );
}
