import {Text, View} from "native-base";
import React, {useEffect} from "react";
import {Icon, ServerAPI} from "../../../kitcheningredients";
import {useSynchedDirectusSettings} from "../../helper/synchedJSONState";
import {SettingsRow} from "../../components/settings/SettingsRow";

export const DirectusSettings = (props: any) => {

    const [directusSettings, setDirectusSettings] = useSynchedDirectusSettings();

    function renderSettings(){
        let keys = Object.keys(directusSettings);
        let renderedSettings = [];
        for(let key of keys){
            let value = directusSettings[key];
            renderedSettings.push(renderSetting(key, value));
        }
        return renderedSettings;
    }

    function renderSetting(key: any, value: any){
        return <SettingsRow leftContent={<Text>{key+": "+value}</Text>} leftIcon={<Icon name={"tag"}/>} />
    }

    return (
        <View style={{width: "100%"}}>
            {renderSettings()}
        </View>
    );
}
