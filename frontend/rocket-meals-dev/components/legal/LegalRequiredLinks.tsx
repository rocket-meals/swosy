import React from "react";
import {LegalRequiredLink} from "@/components/legal/LegalRequiredLink";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {View, Text} from "@/components/Themed";

export const LegalRequiredLinks = (props: any) => {

    const translation_privacy_policy = useTranslation(TranslationKeys.privacy_policy);
    const translation_about_us = useTranslation(TranslationKeys.about_us);
    const translation_license = useTranslation(TranslationKeys.license);
    const translation_cookie_policy = useTranslation(TranslationKeys.cookie_policy);

    let content = [];
    content.push(<LegalRequiredLink href={"/(aux)/about-us"}  text={translation_about_us} />);
    content.push(<LegalRequiredLink href={"/(aux)/privacy-policy"} text={translation_privacy_policy} />);
    content.push(<LegalRequiredLink href={"/(aux)/license"} text={translation_license} />);
    content.push(<LegalRequiredLink href={"/(aux)/cookie-policy"} text={translation_cookie_policy} />);

    function renderSpacer(key: string) {
        return (
            <View key={key} style={{flexDirection: "row", margin: 5}}>
                <Text style={{fontSize: 12}}>{" | "}</Text>
            </View>
        )
    }

    let renderedContent = [];
    for (let i = 0; i < content.length; i++) {
        let last = i === content.length - 1;
        let first = i === 0;
        if (first) {
            renderedContent.push(renderSpacer("legalRequiredLinksSpacerFirst-"+i));
        }
        renderedContent.push(<View key={"legalRequiredLinks-"+i} style={{flexDirection: "row", margin: 5}}>{content[i]}</View>);
        if (!last) {
            renderedContent.push(renderSpacer("legalRequiredLinksSpacerLast-"+i));
        }
    }

    return (
        <View style={{width: "100%", margin: 10, flexDirection: "row", flexWrap: "wrap", justifyContent: "center"}}>
            {renderedContent}
        </View>
    )

}
