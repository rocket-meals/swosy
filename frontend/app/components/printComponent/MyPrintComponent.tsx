import React, { useEffect, useRef, useState } from "react";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, View } from "react-native";
import domToImage from "dom-to-image";
import { PlatformHelper } from "@/helper/PlatformHelper";

export class DownloadHelper {
    static async downloadImage(base64ForWebAndUriForMobile: string, filename: string) {
        if (PlatformHelper.isWeb()) {
            // For web, download directly
            const link = document.createElement("a");
            link.href = base64ForWebAndUriForMobile;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // For mobile, use sharing
            const fileUri = FileSystem.cacheDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, base64ForWebAndUriForMobile.split(",")[1], {
                encoding: FileSystem.EncodingType.Base64,
            });
            await Sharing.shareAsync(fileUri);
        }
    }
}

export type MyPrintComponentCallbackProps = {
    options?: { format?: string; quality?: number };
    simulatedViewDimension?: { width: number; height: number };
};

export type MyPrintComponentProps = {
    children: React.ReactNode;
    fileName: string;
    setPrintCallback: (callback: (options?: MyPrintComponentCallbackProps) => void) => void;
};

export default function MyPrintComponent(props: MyPrintComponentProps) {
    const ref = useRef<any>();
    const [simulatedDimension, setSimulatedDimension] = useState<{ width?: number; height?: number }>({});

    async function captureAndShare(myOptions?: MyPrintComponentCallbackProps) {
        let base64ForWebAndUriForMobile = "";

        try {
            if (ref.current) {
                // Set simulated dimensions if provided
                if (myOptions?.simulatedViewDimension) {
                    setSimulatedDimension(myOptions.simulatedViewDimension);
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for re-render
                }

                if (PlatformHelper.isWeb()) {
                    // Use dom-to-image for web
                    const element = ref.current as HTMLElement;
                    base64ForWebAndUriForMobile = await domToImage.toPng(element, {
                        quality: myOptions?.options?.quality || 1,
                    });
                } else {
                    // Use react-native-view-shot for mobile
                    const width = myOptions?.simulatedViewDimension?.width || ref.current.props.style.width;
                    const height = myOptions?.simulatedViewDimension?.height || ref.current.props.style.height;

                    base64ForWebAndUriForMobile = await captureRef(ref.current, {
                        format: "png",
                        quality: 1,
                        width,
                        height,
                    });
                }

                setSimulatedDimension({}); // Reset simulated dimensions
            }
        } catch (error) {
            console.error("Error capturing view", error);
        }

        if (base64ForWebAndUriForMobile) {
            const filename = (props.fileName || "print") + ".png";
            await DownloadHelper.downloadImage(base64ForWebAndUriForMobile, filename);
        }
    }

    useEffect(() => {
        if (props.setPrintCallback) {
            props.setPrintCallback(() => captureAndShare);
        }
    }, [props.setPrintCallback]);

    const commonStyle = {
        backgroundColor: "white",
        ...simulatedDimension, // Apply simulated dimensions dynamically
    };

    return PlatformHelper.isWeb() ? (
        <div
            ref={ref}
            style={commonStyle}
        >
            {props.children}
        </div>
    ) : (
        <View
            ref={ref}
            style={commonStyle}
        >
            {props.children}
        </View>
    );
}
