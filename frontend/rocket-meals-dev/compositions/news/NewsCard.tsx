import React from 'react';
import {useBreakPointValue, useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {MyCard} from "@/components/card/MyCard";
import {DirectusImage} from "@/components/project/DirectusImage";
import {AspectRatio, Rectangle} from "@/components/shapes/Rectangle";
import {Heading, Text, View} from "@/components/Themed";
import {Divider} from "@gluestack-ui/themed";
import {MyButton} from "@/components/buttons/MyButton";
import {DateHelper} from "@/helper/date/DateHelper";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {MyExternalLink} from "@/components/link/MyExternalLink";
import {IconNames} from "@/constants/IconNames";


const DirectusImageWithAspectRatio = ({aspectRatio, image_url, assetId, thumbHash, accessibilityLabel}: {aspectRatio: AspectRatio | undefined, image_url: string | undefined, assetId: string | null | undefined, thumbHash: string | undefined, accessibilityLabel: string}) => {
    return <Rectangle aspectRatio={aspectRatio}>
        <DirectusImage image_url={image_url} assetId={assetId} thumbHash={thumbHash} style={{width: "100%", height: "100%"}} />
    </Rectangle>
}

// Define props types
interface NewsItemProps {
    image_url: string | undefined;
    accessibilityLabel: string;
    assetId: string | null | undefined;
    url: string | undefined | null;
    thumbHash: string | undefined;
    headline: string;
    text: string | null | undefined;
    date: string | null | undefined;
}

const NewsCard: React.FC<NewsItemProps> = ({ text, url, image_url, headline, assetId, thumbHash, date }) => {

    const jsLocale = useProfileLocaleForJsDate();
    const translation_read_more = useTranslation(TranslationKeys.read_more)

    // on small devices the image will be on top with a dynamic height
    const flexDirection = useBreakPointValue({
        sm: "column-reverse",
        md: "row",
        lg: "row",
        xl: "row"
    });

    const imageWidth = useBreakPointValue({
        sm: "100%",
        md: "40%",
        lg: "33%",
        xl: "25%"
    });

    let displayedDate = "";
    if(date){
        displayedDate = DateHelper.useSmartReadableDate(new Date(date), jsLocale)
    }

    // left 751
    // space 111
    // right 446

    function renderDateAndHeadline(){
        // headline
        // displayedDate

        let renderedDate: any = null;
        if(displayedDate){
            renderedDate = <Text style={{ marginLeft: 10 }}>{displayedDate}</Text>
        }

        // make a view which has the heading and the date, the date is on the right and take the required space, the heading takes the rest and wraps
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Heading style={{ flex: 1, flexWrap: 'wrap' }}>{headline}</Heading>
                {renderedDate}
            </View>
        );
    }

    function renderReadMoreButton(){
        if(url){
            return <MyExternalLink openInNewTab={true} href={url} accessibilityLabel={url}>
                <MyButton rightIcon={IconNames.news_open_external_icon} useOnlyNecessarySpace={true} text={translation_read_more} accessibilityLabel={url} />
            </MyExternalLink>
        } else {
            return null;
        }
    }

    return (
        <View style={{width: "100%", paddingBottom: 5}}>
            <View style={{flexDirection: flexDirection, width: "100%"}}>
                <View style={{flex: 1, padding: 10}}>
                    {renderDateAndHeadline()}
                    <Text numberOfLines={3}>{text}</Text>
                    <View style={{
                        marginTop: 10,
                        justifyContent: "flex-end",
                        alignItems: "flex-end",
                        flex: 1,
                        flexDirection: "row"
                    }}>
                        <View>
                            {renderReadMoreButton()}
                        </View>
                    </View>
                </View>
                <View style={{width: imageWidth}}>
                    <DirectusImageWithAspectRatio aspectRatio={2} image_url={image_url} assetId={assetId} thumbHash={thumbHash} />
                </View>
            </View>
        </View>
    );
};

export default NewsCard;
