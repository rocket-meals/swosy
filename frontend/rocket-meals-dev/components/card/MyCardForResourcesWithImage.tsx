// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {DirectusImage} from "@/components/project/DirectusImage";
import {MyCardWithText, MyCardWithTextProps} from "@/components/card/MyCardWithText";
import {DirectusFiles} from "@/helper/database/databaseTypes/types";
import {MyCardProps} from "@/components/card/MyCard";
import {Rectangle} from "@/components/shapes/Rectangle";

export type MyCardForResourcesWithImageProps = {
    accessibilityLabel: string,
    thumbHash?: string | undefined | null,
    onPress?: () => void,
    assetId?: string | DirectusFiles | undefined | null,
    image_url?: string | undefined | null,
    imageHeight?: number,
} & MyCardWithTextProps

// define the button component
export const MyCardForResourcesWithImage = ({heading, accessibilityLabel, assetId, onPress, image_url, thumbHash, imageHeight, ...props}: MyCardForResourcesWithImageProps) => {

    const usedImageHeight = imageHeight || "100%";

    const image = <Rectangle>
        <DirectusImage image_url={image_url} assetId={assetId} thumbHash={thumbHash} style={{width: "100%", height: usedImageHeight}} />
    </Rectangle>
    let topContent = image;

    if(onPress){
        topContent = (
            <MyTouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress} >
                {topContent}
            </MyTouchableOpacity>
        )
    }

    return(
        <MyCardWithText topComponent={topContent} heading={heading} onPress={onPress} {...props} />
    )
}