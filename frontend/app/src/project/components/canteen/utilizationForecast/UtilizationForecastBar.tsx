import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {ViewPercentageBorderradius} from "../../../helper/ViewPercentageBorderradius";
import {ColorHelper} from "../../../helper/ColorHelper";

const paddingLeft = 5;

/**
 * RushMinutes can show the user how full the canteen is probably
 */
export const UtilizationForecastBar: FunctionComponent = (props) => {

    let width = props?.width;
    let height = props?.height
    let bgColor = props?.bgColor;
    let textInside = props?.textInside;
    let textBelow = props?.textBelow;
    let isActive = props?.isActive

    let bgContrast = ColorHelper.useContrastColor(bgColor);

    isActive = true;
    let borderColor = isActive ? bgContrast : "transparent";

    let textStyle = bgColor ? {color: bgContrast} : undefined

    return(

        <View style={{alignItems: "center", paddingRight: 0, paddingLeft: paddingLeft}}
        >
            <ViewPercentageBorderradius
                style={{
                    width: width,
                    height: height,
                    borderRadius: "20%",
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
            </ViewPercentageBorderradius>
            <Text style={textStyle}>{textBelow}</Text>
        </View>
    )
}
