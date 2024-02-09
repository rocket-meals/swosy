import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {Image} from "expo-image";
import {TouchableOpacity} from "react-native";
import {ServerAPI} from "@/helper/database/server/ServerAPI";
import {View, Text} from "@/components/Themed";
import {useAccessToken} from "@/states/User";
import {thumbHashStringToDataURL} from "@/helper/image/ThumbHashHelper";
import {useIsDemo} from "@/states/SynchedDemo";
import {DirectusImageDemoSources} from "@/components/project/DirectusImageDemoSources";
import {useIsDebug} from "@/states/Debug";

interface AppState {
    assetId: string | undefined | null | DirectusFiles;
    style?: any;
    alt?: string;
    placeholder?: string;
    thumbHash?: string;
    showLoading?: boolean
    fallbackElement?: any,
    onPress?: () => {}
}

export const DirectusImage: FunctionComponent<AppState> = (props) => {

    const accessToken = useAccessToken()
    const isDemoMode = useIsDemo()
    const isDebug = useIsDebug()

    let url = ServerAPI.getAssetImageURL(props.assetId);
    const [imageLoadedFailed, setImageLoadedFailed] = useState(!url);

    const uri = url; // TODO: Maybe check if we might use Base64 for caching or if expo-image does that already

    let headers = undefined;
    if(accessToken){
        headers = {
            Authorization: `Bearer ${accessToken}`,
        }
    }

    let source={
        uri: uri,
        headers: headers
    }
    if(isDemoMode){
        let demoSource = DirectusImageDemoSources.getSource(props.assetId);
        if(!!demoSource){
            source = demoSource;
        }
    }

    let thumbHash = "93 18 0A 35 86 37 89 87 80 77 88 8C 79 28 87 78 08 84 85 40 48";
    if(!!props.thumbHash){
        //thumbHash = props.thumbHash
    }
    const thumbHashBase64 = thumbHashStringToDataURL(thumbHash)
    let placeholder = thumbHashBase64;
    if(!!props.placeholder){
        placeholder = props.placeholder
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
        placeholder={thumbHashBase64}
        onError={(e) => {
            console.log("DirectusImage onError", e)
            setImageLoadedFailed(true)
        }}
        cachePolicy={cachePolicy}
    />

    if(imageLoadedFailed){
        content = props?.fallbackElement
        if(!content && thumbHashBase64){
            content = <Image
                source={thumbHashBase64}
                alt={props?.alt || "Image"}
                style={props.style}
            />
        }
    }

    if(!!props.onPress){
        content = (
            <TouchableOpacity onPress={props.onPress} style={props.style} >
                {content}
            </TouchableOpacity>
        )
    }

    let debugContent = null;
    if(isDebug){
        debugContent = (
            <View style={{position: "absolute", top: 0, left: 0}}>
                <Text>{props.assetId}</Text>
            </View>
        )
    }

    return(
        <View style={props.style}>
            {content}
            {debugContent}
        </View>
    )
}
