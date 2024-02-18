import React from "react";
import {DimensionValue} from "react-native";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {Text, View} from "@/components/Themed";
import {Tooltip, TooltipContent, TooltipText} from "@gluestack-ui/themed";

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
    accessibilityLabel: string
    tooltip: string
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

    let textStyle = {color: bgContrast}

    return( <View style={{alignItems: "center", paddingRight: 0, paddingLeft: paddingLeft}}
    >
        <View

            accessibilityLabel={props?.accessibilityLabel}
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
            <Tooltip
                placement="top"
                trigger={(triggerProps) => {
                    return (
                            <View {...triggerProps}  style={{

                                width: "100%",
                                justifyContent: "center",
                                alignItems: "center",
                                flex: 1
                            }}>
                                <Text >{textInside}</Text>
                            </View>

                    )
                }}
            >
                <TooltipContent>
                    <TooltipText>{props?.tooltip}</TooltipText>
                </TooltipContent>
            </Tooltip> </View>
            <Text >{textBelow}</Text>
        </View>
    )
}
