import React, {useEffect, useRef} from "react";
import ViewShot, {CaptureOptions, captureRef} from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {Platform} from 'react-native';
import {PlatformHelper} from "@/helper/PlatformHelper";

export class DownloadHelper {
    static async downloadImage(base64ForWebAndUriForMobile: string, filename: string) {
        const fileUri = FileSystem.cacheDirectory + filename;

        if (PlatformHelper.isWeb()) {
            let base64Href = base64ForWebAndUriForMobile;
            const link = document.createElement('a');
            link.href = base64ForWebAndUriForMobile;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        if(PlatformHelper.isSmartPhone()){
            // Strip the data URL prefix before writing to file
            let uri = base64ForWebAndUriForMobile;
            await Sharing.shareAsync(uri);
        }
    }
}

export type MyPrintComponentProps = {
    children: React.ReactNode,
    fileName: string,
    setPrintCallback: (callback: (options?: CaptureOptions) => void) => void
}

export default function MyPrintComponent(props: MyPrintComponentProps) {
    const ref = useRef();

    async function captureAndShare() {
        let base64ForWebAndUriForMobile = "";
        try {
            if (ref.current) {
                base64ForWebAndUriForMobile = await captureRef(ref.current, {
                    format: "jpg",
                    quality: 0.9
                });
            }
        } catch (e) {
            console.log("Error capturing view");
            console.error(e);
        }

        console.log("Base64 is still");
        console.log(base64ForWebAndUriForMobile);
        if (base64ForWebAndUriForMobile) {
            let filename = (props.fileName || "print") + ".jpg";
            await DownloadHelper.downloadImage(base64ForWebAndUriForMobile,  filename);
        }
    }

    useEffect(() => {
        if (props.setPrintCallback) {
            props.setPrintCallback(() => captureAndShare);
        }
    }, [props.setPrintCallback]);

    return (
        <>
            <ViewShot ref={ref} options={{ fileName: "Your-File-Name", format: "jpg", quality: 0.9 }}>
                {props.children}
            </ViewShot>
        </>
    )
}
