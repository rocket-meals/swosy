// @ts-nocheck
import React, {FunctionComponent} from "react";
import {View} from "react-native";
import {CodePushValues} from "./CodePushValues";
import {Progress, Text} from "native-base";
import {AnimatedLogo} from "../components/AnimatedLogo";
import {ColorHelper} from "../helper/ColorHelper";

interface AppState {
    downloadAnimation?: FunctionComponent;
  receivedBytes?: any;
  totalBytes?: any;
  ignoreBytes?: boolean
  status?: any;
  message?: string;
  initialColorMode?: any;
}
export const UpdateScreen: FunctionComponent<AppState> = (props) => {

    const bgColor = ColorHelper.useBackgroundColor()

    function hasDownloadInformations(){
        if(!!props?.ignoreBytes){
            return true;
        }

        return !!props.receivedBytes && !isNaN(props.receivedBytes) && !!props.totalBytes && !isNaN(props.totalBytes);
    }

    function formatBytes(bytes, decimals = 0) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    let message = CodePushValues.getStatusMessage(props.status);

    function renderProgressBar(percentage){
        return(
            <Progress width={"100%"} shadow={2} value={percentage} />
        )
    }

    function getDownloadPercentage(receivedBytes, totalBytes){
        let value = 0;
        if(!receivedBytes && !totalBytes){
            return 0;
        }

        value = Math.round(100 * receivedBytes / totalBytes);
        value = Math.max(value, 0)
        value = Math.min(value, 100)
        return value;
    }

    function renderByteProgress(receivedBytes, totalBytes){
        if(!!props?.ignoreBytes){
            return null;
        }

        let formatedReceived = formatBytes(receivedBytes)
        let formatedTotal = formatBytes(totalBytes)

        return(
            <Text>{formatedReceived+"/"+formatedTotal}</Text>
        )
    }


    function renderPercentage(percentage){
        return(
            <Text>{percentage+"%"}</Text>
        )
    }

    function renderDownloadAnimation(){
        return (
            <View style={{width: "40%"}}>
                <AnimatedLogo />
            </View>
        )
        //return props.downloadAnimation;
    }

    function renderDownloadProgress(){
        if(hasDownloadInformations()){
            let receivedBytes = props.receivedBytes;
            let totalBytes = props.totalBytes;
            let percentage = getDownloadPercentage(receivedBytes, totalBytes);

            return(
                <>
                    {renderDownloadAnimation()}
                    <View style={{flexDirection: "row", width: "100%"}}>
                        <View style={{flex: 1}}>
                            {renderByteProgress(receivedBytes, totalBytes)}
                        </View>
                        <View style={{flex: 1, alignItems: "flex-end"}}>
                            {renderPercentage(percentage)}
                        </View>
                    </View>
                    {renderProgressBar(percentage)}
                    <Text>{message}</Text>
                    <Text>{props?.message}</Text>
                    {props?.children}
                </>
            )
        }
        return null;
    }

  return (
      <View style={{backgroundColor: bgColor ,height: "100%", width: "100%", alignItems: "center", justifyContent: "center", padding: "10%"}}>
          {renderDownloadProgress()}
      </View>
  )
}
