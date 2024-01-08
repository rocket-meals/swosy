// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {View} from "native-base";
import ServerAPI from "../ServerAPI";
import {LoadingView} from "./LoadingView";
import {Image, TouchableOpacity} from "react-native";
import {ConfigHolder} from "../ConfigHolder";
import {encode} from 'base-64'

interface AppState {
	assetId: string;
	alt?: string;
  url?: string;
	style?: any;
	showLoading?: boolean
	useUnsafeAccessTokenInURL?: boolean,
  fallbackElement?: any,
//  useBase64Cache?: boolean
	onPress?: () => {}
}

export const getDirectusImageUrl = (props: AppState) => {
  if(!!props.assetId || !!props.url) {
    let url = props.url;

    if (!!props.assetId) {
      let imageURL = ServerAPI.getAssetImageURL(props.assetId);
      url = imageURL;
      if (!props?.isPublic && props?.useUnsafeAccessTokenInURL) {
        let token = ConfigHolder.instance.storage.get_auth_access_token();
        if (!!url && !!token) {
          if (!url.includes("?")) {
            url += "?";
          }
          url += "&access_token=" + token;
        }
      }
    }
    return url;
  }
  return null;
}

export const DirectusImage: FunctionComponent<AppState> = (props) => {

  const assetId = props?.assetId;
  const useCache = props?.useBase64Cache;
  const useUnsafeAccessTokenInURL = props?.useUnsafeAccessTokenInURL;
  const isPublic = props?.isPublic;

  let url = getDirectusImageUrl(props);

	const [notCachedBase64, setNotCachedBase64] = useState(null);
//	const [cachedBase64Image, setCachedBase64Image] = SynchedState.useCachedBase64Image(assetId, useCache, useUnsafeAccessTokenInURL);
//	const usedBase64Image = useCache ? cachedBase64Image : notCachedBase64;
	const usedBase64Image = notCachedBase64;

  const uri = useUnsafeAccessTokenInURL ? url : usedBase64Image;
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true)

	const axios = ServerAPI.getAxiosInstance();

	// TODO: https://docs.directus.io/configuration/project-settings/#files-thumbnails
	// add key, fit, width, etc. as parameters here also

	let content = null;

  async function loadBase64ImageWithAxios(url){
    let token = ConfigHolder.instance.storage.get_auth_access_token();
    const headers = {

    }
    if(!isPublic && !!token){
      headers["Authorization"] = "Bearer " + token;
    }

    return axios.get(url, {
      responseType: 'arraybuffer',
      headers: headers
    })
      .then((response) => {
        let image = encode(
          new Uint8Array(response.data)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return `data:${response.headers['content-type'].toLowerCase()};base64,${image}`;
      });
  }

	async function loadBase64WithAuthorization(url) {
    let token = ConfigHolder.instance.storage.get_auth_access_token();
    const tokenOrPublic = isPublic ? true : !!token;

    try{
      if (!!url && tokenOrPublic) {
        return await loadBase64ImageWithAxios(url);
      }
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async function loadImage() {
    if (!!url) {
      let data = await loadBase64WithAuthorization(url);
      if (!mountedRef.current) return null
      if (!!data) {
        if(useCache) {
          setCachedBase64Image(data);
        } else {
          setNotCachedBase64(data);
        }
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }

	useEffect(() => {
	  if(!props?.useUnsafeAccessTokenInURL){
      loadImage();
    }
    return () => {
      mountedRef.current = false
    }
  } , [props?.assetId, props?.url, uri]);

	if(!!uri) {
		let source={
			uri: uri,
		}

		content = <>
      <Image source={source} alt={props?.alt || "Image"} style={props.style}/>
      </>
	} else {
	  if(loading){
      content = <LoadingView />
    } else {
	    content = props?.fallbackElement;
    }
  }

	let pressWrapper = content;

	if(!!props.onPress){
		pressWrapper = (
			<TouchableOpacity onPress={props.onPress} style={props.style} >
				{content}
			</TouchableOpacity>
		)
	}

	return(
		<View style={props.style}>
			{pressWrapper}
		</View>
	)
}
