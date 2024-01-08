// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {UpdateScreen} from "../../codepush/UpdateScreen";
import {CodePushValues} from "../../codepush/CodePushValues";
import {RandomHelper} from "../../helper/RandomHelper";

interface AppState {

}
export const UpdateScreenTest: FunctionComponent<AppState> = (props) => {

    const testForNormalUpdate = CodePushValues.SyncStatus.UPDATE_INSTALLED;
    const testForNormalUpToDate = CodePushValues.SyncStatus.UP_TO_DATE;

    const testFor = testForNormalUpdate;

    const initialStatus = CodePushValues.SyncStatus.CHECKING_FOR_UPDATE;

    const [values, setValues] = useState({
        receivedBytes: null,
        totalBytes: null,
        status: null
    });

    async function handleFakeUpdate(){
        let status = values.status;

        if(status===null){
            handleReset();
        }

        switch (status) {
            case CodePushValues.SyncStatus.CHECKING_FOR_UPDATE:
                return await handleCheckForUpdate()
            case CodePushValues.SyncStatus.DOWNLOADING_PACKAGE:
                return await handleDownloadPackage()
            case CodePushValues.SyncStatus.INSTALLING_UPDATE:
                return await handleInstallingUpdate();
            case CodePushValues.SyncStatus.UP_TO_DATE:
                return await handleReset();
            case CodePushValues.SyncStatus.UPDATE_INSTALLED:
                return await handleReset();
            default:
//                return `Unkown Status: ${status}`
        }
    }

    async function handleReset(){
        await delay(Math.round(2*1000));

        //@ts-ignore
        setValues({
            receivedBytes: null,
            totalBytes: null,
            status: initialStatus
        })
    }

    async function handleInstallingUpdate(){
        await delay(Math.round(2*1000));

        //@ts-ignore
        setValues({
            receivedBytes: values.receivedBytes,
            totalBytes: values.totalBytes,
            status: CodePushValues.SyncStatus.UPDATE_INSTALLED
        })
    }

    async function handleDownloadPackage(){
        let totalBytes = values.totalBytes;
        let receivedBytes = values.receivedBytes;

        if(!!totalBytes){
            let totalBytesAsNumber = parseInt(totalBytes+"")
            let currentReceivedBytes = parseInt(receivedBytes+"")

            if(currentReceivedBytes>=totalBytesAsNumber){
                await delay(Math.round(2*1000));
                //@ts-ignore
                setValues({
                    receivedBytes: values.receivedBytes,
                    totalBytes: values.totalBytes,
                    status: CodePushValues.SyncStatus.INSTALLING_UPDATE
                })
            } else {
                let increasePercentEachStep = 1;
                let durationInSec = 10;
                let percentageFraction = Math.round(totalBytesAsNumber / (100/increasePercentEachStep));
                let nexReceivedBytes = receivedBytes+percentageFraction;
                nexReceivedBytes = Math.min(nexReceivedBytes, totalBytesAsNumber); // limit downloaded Bytes to max

                let delayMs = Math.round(durationInSec*1000/(100/increasePercentEachStep))
                await delay(delayMs);
                setValues({
                    receivedBytes: nexReceivedBytes,
                    totalBytes: values.totalBytes,
                    status: values.status
                })
            }
        }
    }

    async function handleCheckForUpdate(){
        await delay(2000);

        if(testFor===testForNormalUpdate){
            let mbInBytes = 1000000;
            let nextTotalBytes = RandomHelper.randomIntFromInterval(20*mbInBytes, 40*mbInBytes);

            // @ts-ignore
            setValues({
                receivedBytes: 0,
                totalBytes: nextTotalBytes,
                status: CodePushValues.SyncStatus.DOWNLOADING_PACKAGE
            });

        } else if(testFor===testForNormalUpToDate) {
            //@ts-ignore
            setValues({
                receivedBytes: values.receivedBytes,
                totalBytes: values.totalBytes,
                status: CodePushValues.SyncStatus.UP_TO_DATE
            });
        }
    }

    async function delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    // corresponding componentDidMount
    useEffect(() => {
        handleFakeUpdate()
    }, [props?.route?.params, values])

  return (
      <View style={{width: "100%", height: "100%"}}>
          <UpdateScreen
              receivedBytes={values.receivedBytes}
              totalBytes={values.totalBytes}
              status={values.status}
              initialColorMode={"dark"} />
      </View>
  )
}
