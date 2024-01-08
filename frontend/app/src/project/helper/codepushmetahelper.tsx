import { useEffect, useState } from 'react'
import {Platform} from "react-native";

async function getOTAMetaData() {
    if(Platform.OS==="web"){
        return null;
    } else {
        /**
        const codePush = require("react-native-code-push");
        try {
            const metaData = await codePush.getUpdateMetadata()

            return metaData
        } catch (error) {
            return null
        }
         */
        return null;
    }
}

export function useOTAMetaData() {
    const [appMetaData, setAppetaData] = useState(null)

    useEffect(() => {
        getOTAMetaData().then((OTAVersion) => {
            if (OTAVersion) {
                setAppetaData(OTAVersion)
            }
        })
    }, [])

    return { appMetaData }
}
