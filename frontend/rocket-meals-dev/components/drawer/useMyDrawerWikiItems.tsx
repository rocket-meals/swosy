import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {Custom_Wiki_Ids, useSynchedWikisDict} from "@/states/SynchedWikis";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import React from "react";
import {
    getMyScreenHeaderFunction,
    MyScreenHeader,
    MyScreenHeaderPropsRequired
} from "@/components/drawer/MyScreenHeader";
import {Wikis} from "@/helper/database/databaseTypes/types";
import {
    renderMyDrawerScreen,
    useDrawerActiveBackgroundColor,
    useRenderMyDrawerScreen
} from "@/components/drawer/MyDrawer";
import {View, Text} from "@/components/Themed";
import {useGlobalSearchParams, useLocalSearchParams} from "expo-router";

export const getInternalRouteToWiki = (wiki: Wikis) => {
    return `wikis/${wiki.id}`

}

export function useMyDrawerWikiItems() {
    let [languageCode, setLanguageCode] = useProfileLanguageCode();

    const [wikisDict, setWikisDict] = useSynchedWikisDict()

    const customDrawerItems: MyDrawerCustomItemProps[] = [
        /**
         {
         label: "Hallo",
         onPress: undefined,
         onPressInternalRouteTo: undefined,
         onPressExternalRouteTo: undefined,
         icon: "home",
         position: 0
         }
         */
    ]

    if(!!wikisDict){
        let wikisDictKeys = Object.keys(wikisDict)
        for(let i = 0; i < wikisDictKeys.length; i++){
            let wikiKey = wikisDictKeys[i]
            let wiki = wikisDict[wikiKey]
            const wiki_custom_id = wiki.custom_id

            const show_in_drawer = wiki.show_in_drawer

            if(!!show_in_drawer){
                if(!!wiki_custom_id){
                    // if wiki is not Custom_Wiki_Ids (about_us, contact, terms_of_service, privacy_policy)
                    let reservedCustomIds = Object.values(Custom_Wiki_Ids) as string[]
                    if(reservedCustomIds.indexOf(wiki_custom_id) >= 0){
                        continue;
                    }
                }

                const icon = wiki.icon || "home"

                const translations = wiki.translations as TranslationEntry[]
                const fallback_text = wiki.id
                let label = getDirectusTranslation(languageCode, translations, "title", false, fallback_text)

                customDrawerItems.push({
                    label: label,
                    onPress: undefined,
                    onPressInternalRouteTo: getInternalRouteToWiki(wiki),
                    onPressExternalRouteTo: wiki?.url,
                    icon: icon,
                    position: wiki?.position || undefined,
                })
            }
        }
    }

    return customDrawerItems;
}

export function useRenderedMyDrawerWikiScreens(){
    const [wikisDict, setWikisDict] = useSynchedWikisDict()
    let [languageCode, setLanguageCode] = useProfileLanguageCode();
    const drawerActiveBackgroundColor = useDrawerActiveBackgroundColor()

    return renderMyDrawerScreen({
            routeName: "wikis/[id]",
            label: "Test",
            title: "Test",
            icon: "home",
            visibleInDrawer: false,
            header: (props: MyScreenHeaderPropsRequired) => {
                const { id } = useLocalSearchParams();
                const usedId = id as string

                let custom_title = "Undefined"

                if(!!wikisDict && !!usedId){
                    const wiki = wikisDict[usedId]
                    const translations = wiki.translations as TranslationEntry[]
                    const fallback_text = wiki.id
                    let label = getDirectusTranslation(languageCode, translations, "title", false, fallback_text)
                    if(!!label){
                        custom_title = label
                    }
                }

                return <MyScreenHeader custom_title={custom_title} {...props} />
            }
        },
        drawerActiveBackgroundColor
    );

}