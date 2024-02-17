import React from "react";
import {DimensionValue} from "react-native";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {Text, View} from "@/components/Themed";

const paddingLeft = 5;

/**
 * RushMinutes can show the user how full the canteen is probably
 */
export type UtilizationForecastBarProps = {
    width: DimensionValue,
    height: DimensionValue,
    bgColor: string,
    textInside: string | null,
    textBelow: string | null,
    isActive: boolean | undefined,
}
export const UtilizationForecastBar = (props: UtilizationForecastBarProps) => {

    let width = props?.width;
    let height = props?.height
    let bgColor = props?.bgColor;
    let textInside = props?.textInside;
    let textBelow = props?.textBelow;
    let isActive = props?.isActive

    let bgContrast = useMyContrastColor(bgColor)

    isActive = true;
    let borderColor = isActive ? bgContrast : "transparent";

    let textStyle = bgColor ? {color: bgContrast} : undefined

    return(

        <View style={{alignItems: "center", paddingRight: 0, paddingLeft: paddingLeft}}
        >
            <View
                style={{
                    width: width,
                    height: height,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <View style={{width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1
                }}>
                    <Text style={textStyle}>{textInside}</Text>
                </View>
            </View>
            <Text style={textStyle}>{textBelow}</Text>
        </View>
    )
}
