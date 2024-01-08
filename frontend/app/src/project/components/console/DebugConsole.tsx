// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon, KitchenSafeAreaView, useSynchedState} from "../../../kitcheningredients";
import {SynchedStateKeys} from "../../helper/synchedVariables/SynchedStateKeys";
import {ScrollView, Text, useClipboard, useToast, View} from "native-base";
import {TouchableOpacity} from "react-native";
import {ColorHelper} from "../../helper/ColorHelper";
import {StorageKeys} from "../../helper/synchedVariables/StorageKeys";
import {AppTranslation} from "../translations/AppTranslation";
import {useDebugMode} from "../../helper/synchedJSONState";
import {CopyIcon} from "../icons/CopyIcon";

export interface AppState{

}
export const DebugConsole: FunctionComponent<AppState> = (props) => {

    const bgColor = ColorHelper.useBackgroundColor()

    const [debugInformations, setDebugInformations] = useSynchedState(StorageKeys.CACHED_DEBUG_INFORMATIONS);
    const [debugVisible, setDebugVisible] = useSynchedState(SynchedStateKeys.synchedDebugVisible);
    const [debugMode, setDebugMode] = useDebugMode()

    const clipboard = useClipboard();
    const toast = useToast();

    if(!debugMode){
        return null;
    }

    function renderVisibilityButton(){
        return(
            <TouchableOpacity onPress={() => {setDebugVisible(!debugVisible)}}>
                <View style={{padding: 10, borderColor: "black", backgroundColor: "orange", borderWidth: 1}}>
                    <Icon name={debugVisible ? "chevron-down" : "chevron-up"}  />
                </View>
            </TouchableOpacity>
        )
    }

    function renderOutput(){
        if(!debugVisible){
            return null;
        }
        return(
            <ScrollView>
                <TouchableOpacity style={{flex: 1}} onPress={async () => {
                    try{
                        await clipboard.onCopy(JSON.stringify(debugInformations, null, 2));
                        toast.show({
                            description: "Copied"
                        });
                    } catch (e){
                        setDebugInformations(e.toString());
                    }
                }} >
                    <View style={{padding: 10, backgroundColor: "orange", flexDirection: "row"}}>
                        <CopyIcon />
                        <View style={{width: 18}}></View>
                        <View><AppTranslation id={"copy"} /></View>
                    </View>
                </TouchableOpacity>
                <Text selectable={true}>{JSON.stringify(debugInformations, null, 2)}</Text>
            </ScrollView>
        )
    }

    if(!debugVisible){
        return (
            <View style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "orange"
            }}>
                <KitchenSafeAreaView>
                    {renderVisibilityButton()}
                </KitchenSafeAreaView>
            </View>
        )
    } else {
        return (
            <View style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: bgColor
            }}>
                <KitchenSafeAreaView>
                    <View style={{
                        justifyContent: "flex-end",
                        flexDirection: "row"
                    }}>
                        {renderVisibilityButton()}
                    </View>
                    <View style={{flex: 1}}>
                        {renderOutput()}
                    </View>
                </KitchenSafeAreaView>
            </View>
        )
    }
}
