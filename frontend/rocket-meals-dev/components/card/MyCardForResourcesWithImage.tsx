// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import DirectusImage from "@/components/project/DirectusImage";
import {MyCardWithText, MyCardWithTextProps} from "@/components/card/MyCardWithText";
import {DirectusFiles} from "@/helper/database/databaseTypes/types";
import {MyCardProps} from "@/components/card/MyCard";
import {Rectangle} from "@/components/shapes/Rectangle";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";
import {ReactNode} from "react";
import {View} from "@/components/Themed";

export type MyCardForResourcesWithImageProps = {
    accessibilityLabel: string,
    thumbHash?: string | undefined | null,
    onPress?: () => void,
    assetId?: string | DirectusFiles | undefined | null,
    image_url?: string | undefined | null,
    imageHeight?: number,
    bottomRightComponent?: ReactNode,
    topRightComponent?: ReactNode,
    bottomLeftComponent?: ReactNode,
    topLeftComponent?: ReactNode,
    innerPadding?: number,
} & MyCardWithTextProps

// define the button component
export const MyCardForResourcesWithImage = ({heading, accessibilityLabel, assetId, onPress, image_url, thumbHash, imageHeight, ...props}: MyCardForResourcesWithImageProps) => {
    const innerPadding = props.innerPadding ?? 10;
    const usedImageHeight = imageHeight || "100%";

    const image = <Rectangle>
        <DirectusImage image_url={image_url} assetId={assetId} thumbHash={thumbHash} style={{width: "100%", height: usedImageHeight}} />
        <View style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: innerPadding,
        }}>
            {props.bottomRightComponent}
        </View>
        <View style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: innerPadding,
        }}>
            {props.topRightComponent}
        </View>
        <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            padding: innerPadding,
        }}>
            {props.bottomLeftComponent}
        </View>
        <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: innerPadding,
        }}>
            {props.topLeftComponent}
        </View>
    </Rectangle>
    let topContent = image;

    if(onPress){
        topContent = (
            <MyTouchableOpacity accessibilityRole={MyAccessibilityRoles.ImageButton} accessibilityLabel={accessibilityLabel} onPress={onPress} >
                {topContent}
            </MyTouchableOpacity>
        )
    }

    return(
        <MyCardWithText topComponent={topContent} heading={heading} onPress={onPress} {...props} />
    )
}