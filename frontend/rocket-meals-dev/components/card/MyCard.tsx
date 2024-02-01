// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Box, VStack} from "@gluestack-ui/themed";
import {Text, View, Heading, useViewBackgroundColor} from "@/components/Themed";
import {Image} from "expo-image";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";

export type MyFabProps = {
    onPress?: () => void,
    children?: React.ReactNode,
    date?: string,
    heading?: string,
    imageUri?: string,
    topComponent?: React.ReactNode,
    bottomComponent?: React.ReactNode,
    text?: string,
    style?: any,
    accessibilityLabel: string,
}

// define the button component
export const MyCard = ({date, heading, text, topComponent, bottomComponent, imageUri, onPress, children, accessibilityLabel, style}: MyFabProps) => {

    const viewBackgroundColor = useViewBackgroundColor()
    const viewBackgroundColorDark = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const textContrastColor = useMyContrastColor(viewBackgroundColorDark)

    let renderedTopComponent = null;
    if(!!topComponent){
        renderedTopComponent = topComponent;
    } else if(!!imageUri){
        renderedTopComponent = <Image style={{width: "100%", height: 100}} source={{uri: imageUri}} />
    }

    let renderedBottomComponent = null;
    if(!!bottomComponent){
        renderedBottomComponent = bottomComponent;
    } else {

        let renderedDate = null;
        if(!!date){
            renderedDate = <Text style={{color: textContrastColor}} fontSize="$sm" my="$1.5">
                {date}
            </Text>
        }

        let renderedHeading = null;
        if(!!heading){
            renderedHeading = <Heading style={{color: textContrastColor}} size="sm">
                {heading}
            </Heading>
        }

        let renderedText = null;
        if(!!text){
            renderedText = <Text style={{color: textContrastColor}} my="$1.5"  fontSize="$xs">
                {text}
            </Text>
        }

        renderedBottomComponent = (
            <View style={{backgroundColor: viewBackgroundColorDark, width: "100%", height: "100%"}}>
                <VStack px="$4" pt="$2" pb="$2">
                        {renderedDate}
                        {renderedHeading}
                        {renderedText}
                        {children}
                </VStack>
            </View>
        )
    }

    return(
        <MyTouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress} style={{"width": "100%", height: "100%"}}>
            <Box
                maxWidth="100%"
                maxHeight="100%"
                borderColor="$borderLight200"
                borderRadius="$lg"
                borderWidth="$1"
                my="$2"
                overflow="hidden"
                $base-mx="$2"
                $dark-bg="$backgroundDark900"
                $dark-borderColor="$borderDark800"
            >
                <Box>
                    {renderedTopComponent}
                </Box>
                {renderedBottomComponent}
            </Box>
        </MyTouchableOpacity>
    )
}