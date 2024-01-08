// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {View, Text} from "native-base";
import {KitchenSkeleton} from "./../../project/KitchenSkeleton";
import {StringHelper} from "../../helper/StringHelper";

export const MarkdownSkeleton = (props) => {

    function renderTextRow(rows: number){
        return (
            <>
                <Text>{StringHelper.renderZeroSpaceHeight(1)}</Text>
                <View style={{flexDirection: "row"}}>
                    <Text>{StringHelper.renderZeroSpaceHeight(rows)}</Text>
                    <KitchenSkeleton style={{width: "100%", height: "100%", position: "absolute"}} >
                    </KitchenSkeleton>
                </View>
            </>
        )
    }

    return(
        <View style={{width: "100%"}}>
            <View style={{width: "50%"}} >
                {renderTextRow(2)}
            </View>
            {renderTextRow(1)}
            {renderTextRow(1)}
            {renderTextRow(1)}
            {renderTextRow(1)}
        </View>
    )
}
