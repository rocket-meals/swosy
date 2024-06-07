import React, {useEffect, useRef} from "react";
import ViewShot, {captureRef} from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {Platform} from 'react-native';

export class DownloadHelper {
    static async downloadBase64(base64: string, filename: string) {
        const fileUri = FileSystem.cacheDirectory + filename;

        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = base64;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Strip the data URL prefix before writing to file
            const base64Data = base64.split(",")[1];
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64
            });

            if (!(await Sharing.isAvailableAsync())) {
                alert(`Uh oh, sharing isn't available on your platform`);
                return;
            }

            await Sharing.shareAsync(fileUri);
        }
    }
}

export type MyPrintComponentProps = {
    children: React.ReactNode,
    setPrintCallback: (callback: () => void) => void
}

export default function MyPrintComponent(props: MyPrintComponentProps) {
    const ref = useRef();

    async function captureAndShare() {
        let base64 = "";
        try {
            if (ref.current) {
                base64 = await captureRef(ref.current, {
                    format: "jpg",
                    quality: 0.9
                });
            }
        } catch (e) {
            console.log("Error capturing view");
            console.error(e);
        }

        console.log("Base64 is still");
        console.log(base64);
        if (base64) {
            await DownloadHelper.downloadBase64(base64, "test.jpg");
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
