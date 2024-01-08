// @ts-nocheck
import React, {PureComponent, useEffect, useState} from "react";
import { Platform, View, Animated } from "react-native";
import LottieView from "lottie-react-native";
import ServerAPI from "../ServerAPI";
import {KitchenSkeleton} from "./../project/KitchenSkeleton";

export const LottieNative = (props) => {

    let initialSource = props.source;

    const [width, setWidth] = useState(props.width || props?.style?.width)
    const [height, setHeight] = useState(props.height || props?.style?.height)
    const [source, setSource] = useState(initialSource);
    const [reloadnumber, setReloadnumber] = useState(0);

    let url = props.url

    let autoPlay = true;
    if(props.autoPlay!==undefined){
        autoPlay = props.autoPlay
    }

    async function downloadInformations(){
      if(!source && !!url){
        try{
          let api = ServerAPI.getAxiosInstance();
          let answer = await api.get(url);
          let data = answer.data;
          setSource(data);
          setReloadnumber(1);
        } catch (err){

        }
      }
    }

    // corresponding componentDidMount
    useEffect(() => {
        downloadInformations();
    }, [props])

    let content = null;

    if(!!source){
      content = <LottieView
        style={props.style}
        autoPlay={autoPlay}
        source={source}
      />;
    } else {
      if(!!props.customLoading){
        content = props.customLoading;
      } else {
        content = <KitchenSkeleton style={{height: "100%", width: "100%"}} />
      }
    }

    let flex = props.flex;
    let outerStyle: any;
    outerStyle = {
      height: height, width: width
    }

    if(!!flex){
      outerStyle = {"flex": 1};
    }

      return(
        <View style={outerStyle} onLayout={(event) => {
          if(!!flex){
            const {x, y, width, height} = event.nativeEvent.layout;
            setHeight(height);
            setWidth(width)
          }
        }}>
          <View style={{height: height, width: width}}>
            <View style={{position: "absolute", height: "100%", width: "100%"}}>
              {content}
            </View>
          </View>
        </View>
      )
}
