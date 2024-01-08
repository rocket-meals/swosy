// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import ServerAPI from "./../../ServerAPI";
import {DirectusMarkdown} from "./DirectusMarkdown";

export interface AppState{
    collection: string,
    fieldname: string
}
export const DirectusSingletonMarkdown: FunctionComponent<AppState> = (props) => {

    const [information, setInformations] = useState(undefined);

    async function load(){
        const directus = ServerAPI.getClient();
        let answer = await directus.items(props.collection).readByQuery({});
        console.log(answer)
        let data = answer?.data;
        setInformations(data);
    }

    // corresponding componentDidMount
    useEffect(() => {
        load();
    }, [])

    return (
      <View style={{width: "100%"}}>
          <DirectusMarkdown data={information} fieldname={props.fieldname} />
      </View>
    )
}
