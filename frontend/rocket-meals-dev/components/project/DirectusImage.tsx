import React, {FunctionComponent, useEffect, useState} from 'react';
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
    assetId: string | undefined | null,
    image_url?: string | undefined | null;
    style?: any;
    alt?: string;
    placeholder?: string;
    thumbHash?: string | undefined | null;
    showLoading?: boolean
    fallbackElement?: any,
    onPress?: () => {}
}

export const DirectusImage: FunctionComponent<AppState> = (props) => {
    const accessToken = useAccessToken();
    const isDemoMode = useIsDemo();
    const isDebug = useIsDebug();

    let url = getInitialImageUrl();

    // State for managing the image URL
    const [imageUrl, setImageUrl] = useState<string | undefined | null>(url);

    function getInitialImageUrl(){
        let url = ServerAPI.getAssetImageURL(props.assetId);
        if(!url && props.image_url){
            url = props.image_url;
        }
        return url;
    }



    const [imageLoadedFailed, setImageLoadedFailed] = useState(!url);

    useEffect(() => {
        let url = getInitialImageUrl();

        setImageUrl(url); // Update the imageUrl state with the new URL
        setImageLoadedFailed(!url); // Update the imageLoadedFailed state based on the presence of the URL
    }, [props.assetId, props.image_url]); // This effect depends on assetId and image_url

    let headers = undefined;
    if (accessToken) {
        headers = {
            Authorization: `Bearer ${accessToken}`,
        };
    }

    let source = {
        uri: imageUrl,
        headers: headers,
    };

    if (isDemoMode) {
        let demoSource = DirectusImageDemoSources.getSource(props.assetId);
        if (demoSource) {
            source = demoSource;
        }
    }

    const thumbHashBase64 = props.thumbHash ? thumbHashStringToDataURL(props.thumbHash) : thumbHashStringToDataURL("93 18 0A 35 86 37 89 87 80 77 88 8C 79 28 87 78 08 84 85 40 48");
    const placeholder = props.placeholder || thumbHashBase64;

    let content = <Image
        source={source}
        alt={props?.alt || "Image"}
        style={props.style}
        placeholder={placeholder}
        onError={(e) => {
            console.log("DirectusImage onError", e);
            setImageLoadedFailed(true);
        }}
        // Assuming cachePolicy is determined elsewhere or is static
        cachePolicy="none"
    />;

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

    if (props.onPress) {
        content = (
            <TouchableOpacity onPress={props.onPress} style={props.style}>
                {content}
            </TouchableOpacity>
        );
    }

    let debugContent = null;
    if (isDebug) {
        const image_asset_id_or_url = props.image_url || (props.assetId ? props.assetId.toString() : "");

        debugContent = (
            <View style={{position: "absolute", top: 0, left: 0}}>
                <Text>{image_asset_id_or_url}</Text>
            </View>
        );
    }

    return (
        <View style={props.style}>
            {content}
            {debugContent}
        </View>
    );
};
