import {useUpdates} from "expo-updates";
import React, {useEffect, useState} from "react";
import * as Updates from "expo-updates";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {View, Text} from "@/components/Themed";
import {AppState} from "react-native";
import {LoadingScreen, LoadingScreenTextInformationWrapper} from "@/compositions/loadingScreens/LoadingScreen";
import {RootTranslationKey, useRootTranslation} from "@/helper/translations/RootTranslation";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";


export interface ServerStatusFlowLoaderProps {
    children?: React.ReactNode;
    reloadNumber: string;
}

const useAppState = () => {
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', setAppState);

        // Return a cleanup function to remove the event listener
        return () => subscription.remove();
    }, []);

    return appState;
};

export const RootAppUpdateCheckerSmartPhone = (props: ServerStatusFlowLoaderProps) => {
    const currentAppState = useAppState();
    const expoGoApp = isInExpoGo();

    const TIMEOUT_IN_SECONDS = 3;

    const translation_check_for_app_updates = useRootTranslation(RootTranslationKey.CHECK_FOR_APP_UPDATES)
    const translation_download_new_app_update = useRootTranslation(RootTranslationKey.DOWNLOAD_NEW_APP_UPDATE)

    const [initialCheckFinished, setInitialCheckFinished] = React.useState<boolean>(false);
    console.log("initialCheckFinished: "+initialCheckFinished)
    const [updateIsAvailable, setUpdateIsAvailable] = React.useState<boolean>(false);
    const [downloadingNewUpdate, setDownloadingNewUpdate] = React.useState<boolean>(false);
    const [reloadInProgress, setReloadInProgress] = React.useState<boolean>(false);

    // A good rule of thumb to check for updates judiciously is to check when the user launches or foregrounds the app.
    // Avoid polling for updates in a frequent loop.
    async function checkForUpdates() {
        setUpdateIsAvailable(false)
        setDownloadingNewUpdate(false);
        setReloadInProgress(false)

        const simulateFetch = false

        try{
            console.log("await Updates.checkForUpdateAsync(); "+props.reloadNumber+" - initialCheckFinished: "+initialCheckFinished)

            let updateCheckResult: Updates.UpdateCheckResult= {
                isAvailable: true,
                manifest: {
                    version: "1.0.0"
                }
            }
            if(!simulateFetch){
                updateCheckResult = await Updates.checkForUpdateAsync();
            }

            setUpdateIsAvailable(updateCheckResult.isAvailable)
            if(updateCheckResult.isAvailable || true) {
                const manifest: Updates.Manifest = updateCheckResult.manifest;
                setDownloadingNewUpdate(true);
                const timeoutInMillis = 1000*TIMEOUT_IN_SECONDS
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("timedout"), timeoutInMillis))

                let updateFetchPromiseRaw = Updates.fetchUpdateAsync();

                // simulate that the fetch takes a long time
                let updateFetchPromise = updateFetchPromiseRaw

                    if(simulateFetch){
                        let simulatedFetchTime = 1000*(TIMEOUT_IN_SECONDS-1)
                        if(simulatedFetchTime < 0){
                            simulatedFetchTime = 0
                        }
                        updateFetchPromise = new Promise((resolve, reject) => {
                            setTimeout(() => {
                                console.log("resolve simulated fetch")
                                resolve(updateFetchPromiseRaw)
                            }, simulatedFetchTime) // 10 seconds)
                        })
                    }

                // This will return only one Promise
                console.log("Promise.race([updateFetchPromise, timeoutPromise])")
                console.log(new Date().getTime())
                Promise.race([updateFetchPromise, timeoutPromise])
                    .then(() => {
                        if(initialCheckFinished){
                            // TODO: show a prompt to the user that a new update is available and ask them to restart the app
                            setReloadInProgress(true)
                            Updates.reloadAsync();
                        } else { // if the user is not using the app, we can reload the app
                            setReloadInProgress(true);
                            Updates.reloadAsync();
                        }
                    })
                    .catch((error) => {
                        console.log("Error in Promise: ", error)
                        if (error === 'timedout') {
                            // Here you can show some toast as well
                            console.log("Updates were not cancelled but reload is stopped.")
                        } else if (error === 'someKnownError') {
                            // Handle error
                        } else {
                            // Log error and/or show a toast message
                        }
                        setDownloadingNewUpdate(false)
                        console.log("setInitialCheckFinished(true); - error")
                        setInitialCheckFinished(true);
                    })

            } else { // no update available so we can proceed with the app
                console.log("setInitialCheckFinished(true); - no update available")
                setInitialCheckFinished(true);
            }
        } catch (error) {
            console.log("Error in checkForUpdates: ", error)
            setInitialCheckFinished(true);
            setUpdateIsAvailable(false)
            setDownloadingNewUpdate(false);
        }
    }

    // check for updates on startup
    React.useEffect(() => {
        checkForUpdates();
    }, [props.reloadNumber]);


    // useEffect everytime the app is resumed into the foreground

    // when the user launches or foregrounds the app
    useEffect(() => {
        if (currentAppState === 'active' && initialCheckFinished) {
            checkForUpdates();
        }
    }, [currentAppState]);

    if(!initialCheckFinished) {
        let text = translation_check_for_app_updates
        if(updateIsAvailable) {
            text = translation_download_new_app_update
        }
        if(reloadInProgress) {
            text = "Reloading app..."
        }

        if(expoGoApp){
            text = "Simulated: "+text
        }


        return <LoadingScreen>
            <LoadingScreenTextInformationWrapper>
                <Text>{text}</Text>
            </LoadingScreenTextInformationWrapper>
        </LoadingScreen>
    } else {
        return (
            props.children
        )
    }
}

export const RootAppUpdateChecker = (props: ServerStatusFlowLoaderProps) => {

    const isSmartPhone = PlatformHelper.isSmartPhone();

    if(isSmartPhone) { // Expo Updates are not supported on web only on mobile
        return (
            <RootAppUpdateCheckerSmartPhone reloadNumber={props.reloadNumber}>
                {props.children}
            </RootAppUpdateCheckerSmartPhone>
        )
    } else {
        return (
            props.children
        )
    }
}
