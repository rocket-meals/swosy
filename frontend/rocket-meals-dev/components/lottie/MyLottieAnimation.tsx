import LottieView from 'lottie-react-native';
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {Text, View} from "@/components/Themed";
import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useIsPerformanceMode} from "@/states/SynchedPerformanceMode";


export type MyExternalLinkProps = {
    accessibilityLabel: string,
    style: StyleProp<ViewStyle>,
    url?: string,
    source?: any,
    // string to string map
    colorReplaceMap?: {[key: string]: string},
    loop?: boolean,
    autoPlay?: boolean,
    animationRef?: any,
}

// define the button component
export const MyLottieAnimation = ({style, url, source, animationRef, colorReplaceMap, loop, ...props}: MyExternalLinkProps) => {

    const isPerformanceMode = useIsPerformanceMode();

    // create a new ref or use the one passed in
    const animation = useRef(null);

    let usedColorReplaceMap = colorReplaceMap;

    const usedLoop = loop===undefined ? true : loop;
    const usedAutoPlay = props.autoPlay===undefined ? true : props.autoPlay;

    const [usedSource, setUsedSource] = useState(source);
    const [reloadnumber, setReloadnumber] = useState(0);

    const styleAnimationContainer: StyleProp<ViewStyle> = {
        overflow: "hidden",
    }
    let mergedStyle: StyleProp<ViewStyle> = [style, styleAnimationContainer]

    let mergedPerformanceStyle: StyleProp<ViewStyle> = [style, {
        borderColor: "black",
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    }]

    if(isPerformanceMode){
        return <View style={mergedPerformanceStyle}>
                <Text>
                    {"Animation disabled"}
                </Text>
                <Text>
                    {"Deactivate performance mode to see animations"}
                </Text>
        </View>
    }

    function hexToLottieColor(hex: string): number[]
    {
        let r = (parseInt(hex.slice(1, 3), 16) / 255).toFixed(4);
        let g = (parseInt(hex.slice(3, 5), 16) / 255).toFixed(4);
        let b = (parseInt(hex.slice(5, 7), 16) / 255).toFixed(4);
        return [parseFloat(r), parseFloat(g), parseFloat(b)];
    }

    const defaultPlaceHolderColor = "#FF00FF";
    const defaultProjectColor = "#EE581F";

    if(!usedColorReplaceMap){
        usedColorReplaceMap = {};
    }

    let usedColorReplaceMapAfter: {[key: string]: number[]} = {};

    function colorNumberArrayToString(color: number[]): string {
        let result = "";
        for(let i = 0; i < color.length; i++){
            result += color[i].toString();
            if(i < color.length-1){
                result += ",";
            }
        }
        return result;
    }

// Convert colorReplaceMap to Lottie color format
    for(let color in colorReplaceMap){
        usedColorReplaceMapAfter[hexToLottieColor(color).toString()] = hexToLottieColor(colorReplaceMap[color]);
    }

    function replaceColorsInLottie(lottieJSON: any, colorReplaceMap: {[key: string]: number[]}) {

        if (Array.isArray(lottieJSON)) {
            for (let i = 0; i < lottieJSON.length; i++) {
                lottieJSON[i] = replaceColorsInLottie(lottieJSON[i], colorReplaceMap);
            }
        } else if (typeof lottieJSON === 'object' && lottieJSON !== null) {
            for (let key in lottieJSON) {
                if (key === 'c') {
                    if (lottieJSON[key].a === 0 && colorReplaceMap[lottieJSON[key].k.toString()]) {
                        lottieJSON[key].k = colorReplaceMap[lottieJSON[key].k.toString()];
                    }
                } else {
                    lottieJSON[key] = replaceColorsInLottie(lottieJSON[key], colorReplaceMap);
                }
            }
        }
        return lottieJSON;
    }

    useEffect(() => {
        // You can control the ref programmatically, rather than using autoPlay
        animation.current?.play();
    }, []);



    // corresponding componentDidMount
    useEffect(() => {
        if(!isPerformanceMode){
            downloadInformations();
        }
    }, [url, isPerformanceMode])

    // unmount on unfocus
    useEffect(() => {
        return () => {
            setUsedSource(undefined);
        }
    }, [])

    async function downloadInformations(){
        if(!source && !!url){
            try{
                let answer = await axios.get(url);
                let data = answer.data;
                setUsedSource(data);
                setReloadnumber(1);
            } catch (err){

            }
        }
    }

    let lottieJSONCopy = {}
    if(usedSource){
        lottieJSONCopy = JSON.parse(JSON.stringify(usedSource));
    }
    let coloredSource = replaceColorsInLottie(lottieJSONCopy, usedColorReplaceMapAfter);



    return(
        <View style={mergedStyle}>
            <LottieView
                key={Math.random()+""}
                autoPlay={usedAutoPlay}
                loop={usedLoop}
                ref={animation}
                style={style}
                // Find more Lottie files at https://lottiefiles.com/featured
                source={coloredSource}
            />
        </View>
    )
}