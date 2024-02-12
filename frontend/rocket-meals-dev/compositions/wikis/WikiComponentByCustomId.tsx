import React, {FunctionComponent} from "react";
import {Wikis} from "@/helper/database/databaseTypes/types";
import {DirectusTranslatedMarkdown} from "@/components/markdown/DirectusTranslatedMarkdown";
import {Custom_Wiki_Ids, useSynchedWikiByCustomId} from "@/states/SynchedWikis";
import {WikiComponent} from "@/compositions/wikis/WikiComponent";

interface AppState {
    custom_id: string
}
export const WikiComponentByCustomId: FunctionComponent<AppState> = ({custom_id}) => {

    const wiki = useSynchedWikiByCustomId(custom_id);

    if(!wiki){
        return null;
    }

    return <WikiComponent wiki={wiki} />
}
