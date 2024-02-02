// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Box} from "@gluestack-ui/themed";
import {useViewBackgroundColor, View} from "@/components/Themed";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";

export type MyCardProps = {
    onPress?: () => void,
    children?: React.ReactNode,
    borderRaidus?: number,
    topComponent?: React.ReactNode,
    bottomComponent?: React.ReactNode,
    style?: any,
}

export const MyCardDefaultBorderRadius = 20;

// define the button component
export const MyCard = ({topComponent, bottomComponent, children}: MyCardProps) => {

    const viewBackgroundColor = useViewBackgroundColor()
    const viewBackgroundColorDark = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const textContrastColor = useMyContrastColor(viewBackgroundColorDark)

    const borderRaidus = MyCardDefaultBorderRadius

    let renderedTopComponent = null;
    if(!!topComponent){
        renderedTopComponent = topComponent;
    }

    let renderedBottomComponent = null;
    if(!!bottomComponent){
        renderedBottomComponent = bottomComponent;
    }

    return(
        <View style={{"width": "100%", height: "100%"}}>
            <Box
                maxWidth="100%"
                maxHeight="100%"
                width="100%"
                height="100%"
                borderColor={textContrastColor}
                borderRadius={borderRaidus}
                borderWidth="$1"
                overflow="hidden"
                $dark-bg="$backgroundDark900"
                $dark-borderColor="$borderDark800"
            >
                {renderedTopComponent}
                {renderedBottomComponent}
                {children}
            </Box>
        </View>
    )
}