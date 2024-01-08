// @ts-nocheck
import React from "react";

export class MyClipboard {

    static async copyText(toast, clipboard, text: string){
        await clipboard.onCopy(text);
        toast.show({
            description: "Copied"
        });
    }
}
