// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {DirectusImage} from "@/components/project/DirectusImage";
import {MyCardWithText} from "@/components/card/MyCardWithText";
import {DirectusFiles} from "@/helper/database/databaseTypes/types";
import {MyCardProps} from "@/components/card/MyCard";

export type MyCardForResourcesWithImageProps = {
    text?: string,
    accessibilityLabel: string,
    thumbHash?: string,
    onPress?: () => void,
    assetId?: string | DirectusFiles | undefined,
    imageHeight?: number,
} & MyCardProps

// define the button component
export const MyCardForResourcesWithImage = ({text, accessibilityLabel, assetId, onPress, thumbHash, imageHeight, ...props}: MyCardForResourcesWithImageProps) => {

    const usedImageHeight = imageHeight || 200;

    const image = <DirectusImage assetId={assetId} thumbHash={thumbHash} style={{width: "100%", height: usedImageHeight}} />
    let topContent = image;

    if(onPress){
        topContent = (
            <MyTouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress} >
                {topContent}
            </MyTouchableOpacity>
        )
    }

    return(
        <MyCardWithText topComponent={topContent} heading={text} onPress={onPress} {...props} />
    )
}