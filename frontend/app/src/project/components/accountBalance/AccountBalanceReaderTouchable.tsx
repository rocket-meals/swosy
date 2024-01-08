// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {AppTranslation, useAppTranslation} from "../translations/AppTranslation";
import {useAccountBalance} from "./AccountBalanceHelper";
import {MyActionsheet} from "../../../kitcheningredients";
import {ScrollView, useToast, View, Text} from "native-base";
import {PlatformHelper} from "../../helper/PlatformHelper";
import NfcManager, {NfcTech} from "react-native-nfc-manager";
import {Platform, TouchableOpacity} from "react-native";
import {NfcInstruction} from "../animations/accountBalance/NfcInstruction";
import {CardReader} from "react-native-nfc-manager-sw-os";
import {useDebugMode} from "../../helper/synchedJSONState";

export interface AppState{
    afterPress: () => any
}
export const AccountBalanceReaderTouchable: FunctionComponent<AppState> = (props) => {

    const nfcInstruction = useAppTranslation("nfcInstructionRead");
    const translationSuccess = useAppTranslation("success");
    const translationError = useAppTranslation("error");

    let handleCloseModal = () => {}

    const actionsheet = MyActionsheet.useActionsheet();
    const toast = useToast();

    const [accountBalance, setAccountBalance] = useAccountBalance();
    const [cardContent, setCardContent] = useState("-");
    const [debug, setDebug] = useDebugMode()

    function showCardReadInstruction(){
        handleCloseModal = () => {}; // reset
        if(PlatformHelper.isAndroid()) {
            actionsheet.show({
                renderCustomContent: (onCloseModal) => {
                    handleCloseModal = onCloseModal;
                    return (
                            <View style={{width: "100%", justifyContent: "center"}}>
                                <AppTranslation id={"nfcInstructionRead"}/>
                                <NfcInstruction/>
                            </View>
                    )
                }
            });
        }
        if(PlatformHelper.isIOS()) {
            // iOS does not need an instruction, since it has a native popup
        }
    }

    async function startCardReading(){
        showCardReadInstruction();
        let reader = new CardReader(NfcManager, NfcTech, Platform);
        try{
            console.log("DEBUG: start reading card");
            let newAnswer = await reader.readCard(nfcInstruction);
            console.log("Answer");
            console.log(newAnswer);
            setCardContent(JSON.stringify(newAnswer, null, 2));

            let newBalance = newAnswer.currentBalance;
            if(newBalance !== undefined){
                setAccountBalance(newBalance);
                toast.show({
                    description: translationSuccess
                });
            } else {
                toast.show({
                    description: translationError
                });
            }
        } catch (e) {
            console.log(e);
            setCardContent(e.toString());
            toast.show({
                description: translationError
            });
        }
        try{
            //console.log("Try to close reader overlay");
            if(!!handleCloseModal){
                handleCloseModal();
            }
        } catch (e) {
            //console.log(e);
        }
    }

    function renderDebugContent(){
        if(debug){
            return (
                <View>
                    <Text>{"DEBUG CARD CONTENT:"}</Text>
                    <Text>{cardContent}</Text>
                </View>
            )
        }
    }

    return(
        <TouchableOpacity style={{flex: 1}} onPress={async () => {
            try{
                await startCardReading();
            } catch (e) {
                //console.log(e);
            }
            if(props?.afterPress){
                await props.afterPress();
            }
        }}>
            {props?.children}
            {renderDebugContent()}
        </TouchableOpacity>
    )

}
