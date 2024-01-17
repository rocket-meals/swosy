import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {Image} from "expo-image";
import {TouchableOpacity} from "react-native";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {View} from "@/components/Themed";

interface AppState {
    assetId: string | undefined | null;
    style?: any;
    alt?: string;
    showLoading?: boolean
    useUnsafeAccessTokenInURL?: boolean,
    fallbackElement?: any,
    onPress?: () => {}
}

export const DirectusImage: FunctionComponent<AppState> = (props) => {

    let url = ServerAPI.getAssetImageURL(props.assetId);

    const uri = url; // TODO: Maybe check if we might use Base64 for caching or if expo-image does that already

    let source={
        uri: uri,
    }

    const blurhash =
        '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

    type CachePolicy = "none" | "disk" | "memory" | "memory-disk"
    let cachePolicy: CachePolicy = "none"
    /** https://docs.expo.dev/versions/latest/sdk/image/#cachepolicy
     'none' - Image is not cached at all.
     'disk' - Image is queried from the disk cache if exists, otherwise it's downloaded and then stored on the disk.
     'memory' - Image is cached in memory. Might be useful when you render a high-resolution picture many times. Memory cache may be purged very quickly to prevent high memory usage and the risk of out of memory exceptions.
     'memory-disk' - Image is cached in memory, but with a fallback to the disk cache.
     */

    let content = <Image
        source={source}
        alt={props?.alt || "Image"}
        style={props.style}
        placeholder={blurhash}
        cachePolicy={cachePolicy}
    />

    if(!!props.onPress){
        content = (
            <TouchableOpacity onPress={props.onPress} style={props.style} >
                {content}
            </TouchableOpacity>
        )
    }

    return(
        <View style={props.style}>
            {content}
        </View>
    )
}
