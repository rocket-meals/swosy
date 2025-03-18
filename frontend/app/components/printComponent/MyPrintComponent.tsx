import React, {useCallback, useEffect, useState} from "react";
import {CaptureOptions} from 'react-native-view-shot';
import {PlatformHelper} from "@/helper/PlatformHelper";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";
import {useViewBackgroundColor, View} from "@/components/Themed";

export type MyPrintComponentProps = {
    children?: React.ReactNode,
    fileName: string,
    printId: string,
    setPrintCallback: (callback: (options?: CaptureOptions) => void) => void
}

export function useStablePrintCallback() {
    const [printCallback, setPrintCallback] = useState<(options?: CaptureOptions) => void>();

    const stableSetPrintCallback = useCallback(
        (callback: (options?: CaptureOptions) => void) => {
            setPrintCallback(callback);
        },
        [setPrintCallback] // Nur neu setzen, wenn `setPrintCallback` sich ändert
    );

    return [printCallback, stableSetPrintCallback] as const;
}

export const MyPrintButton = (props: {printCallback: ((options?: CaptureOptions) => void) | undefined}) => {
    let isWeb = PlatformHelper.isWeb();
    const disabled = !isWeb || !props.printCallback;

    const translation_print = "Drucken"

    let tooltip = translation_print;
    if(!isWeb){
        tooltip = "Nur auf Web verfügbar";
    } else if(!props.printCallback){
        tooltip = "Drucken nicht verfügbar";
    }

    return <MyButton disabled={disabled} useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={tooltip} useTransparentBorderColor={true} leftIcon={IconNames.print_icon} onPress={() => {
        if(!!props.printCallback) {
            props.printCallback();
        }
    }} />
}

export default function MyPrintComponent(props: MyPrintComponentProps) {

    const backgroundColor = useViewBackgroundColor();

    function printDiv(divName: string, title: string) {
        var printContents = document.getElementById(divName)?.innerHTML;
        if (!printContents) {
            console.error("Element not found:", divName);
            return;
        }

        // Neues Druckfenster öffnen
        let printWindow = window.open("", "_blank");
        if(!!printWindow){
            printWindow.document.open();

            // Alle Stylesheets und Inline-Styles aus dem aktuellen Dokument holen
            var styles = "";
            Array.from(document.styleSheets).forEach((styleSheet) => {
                try {
                    if (styleSheet.cssRules) {
                        Array.from(styleSheet.cssRules).forEach((rule) => {
                            styles += rule.cssText + "\n";
                        });
                    }
                } catch (e) {
                    console.warn("Could not access stylesheet:", styleSheet.href);
                }
            });


            console.log("Title:", title);

            printWindow.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                ${styles} /* Kopierte Styles */
                
                @media print {
                    @page { 
                        size: auto; /* Automatische Größe für optimale Darstellung */
                        margin: 0mm; /* Optional: Ändere die Ränder nach Bedarf */
                    }
                
                    /* Standard Browser-Header & Footer ausblenden (funktioniert in vielen, aber nicht allen Browsern) */
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            ${printContents}
        </body>
        </html>
    `);

            printWindow.document.title = title;

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }

    async function captureAndShare() {
        if(PlatformHelper.isWeb()){
            printDiv(props.printId, props.fileName);
        } else {
            console.error("Capture and share not implemented for native mobile");
        }
    }

    useEffect(() => {
        if (props.setPrintCallback) {
            props.setPrintCallback(() => captureAndShare);
        }
    }, [props.setPrintCallback]);

    return (
        <>
            <View id={props.printId}>
                <View style={{backgroundColor: backgroundColor, height: "100%", width: "100%"}}>
                    {props.children}
                </View>
            </View>
        </>
    )
}
