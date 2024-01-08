// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {View, Text} from "native-base";
import {BaseTemplate, DirectusMarkdown, ServerAPI} from "../../../kitcheningredients";
import {WikiLoader} from "../../components/wiki/WikiLoader";
import {DirectusTranslatedMarkdown} from "../../components/translations/DirectusTranslatedMarkdown";
import {useDirectusTranslation} from "../../components/translations/DirectusTranslationUseFunction";
import {useSynchedWikis} from "../../helper/synchedJSONState";

interface AppState {

}
export const Wikis: FunctionComponent<AppState> = (props) => {

    const wiki_id = props?.route?.params?.id;
    let custom_id = props?.custom_id;
    const hideHeader = props?.hideHeader;

    const [wikis, setWikis] = useSynchedWikis();

    const data = getWiki(wikis, wiki_id, custom_id);

    function getWiki(wikis, wiki_id, custom_id){
        if(!!wiki_id){
            return wikis?.[wiki_id];
        } else {
            if(!!custom_id){
                let wikiIds = Object.keys(wikis);
                for(let wikiId of wikiIds){
                    let wiki = wikis[wikiId];
                    if(wiki?.custom_id === props?.custom_id){
                        return wiki;
                    }
                }
            }
        }
        return null;
    }

    let translations = data?.translations;
    const title = useDirectusTranslation(translations, "title") || "Loading";

    // corresponding componentDidMount
    useEffect(() => {

    }, [props?.route?.params]);

    let content = <DirectusTranslatedMarkdown item={data} field={"content"} />

    if(hideHeader){
        return content
    } else {
        return (
            <BaseTemplate title={title}>
                {content}
            </BaseTemplate>
        )
    }
}
