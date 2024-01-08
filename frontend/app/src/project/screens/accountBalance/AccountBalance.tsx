// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, useToast, View} from "native-base";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {useMyContrastColor, useProjectColor, useThemedShade} from "../../../kitcheningredients";
import {FormatedPriceText} from "../../components/food/FormatedPriceText";
import NfcManager from 'react-native-nfc-manager';
import {TouchableOpacity} from "react-native";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";
import {AccountBalanceIcon} from "../../components/accountBalance/AccountBalanceIcon";
import {useAccountBalance} from "../../components/accountBalance/AccountBalanceHelper";
import {SystemActionHelper} from "../../helper/SystemActionHelper";
import {useMyFocusHandler} from "../../helper/useMyFocusHandler";
import {PlatformHelper} from "../../helper/PlatformHelper";
import {useDebugMode, useDemoMode} from "../../helper/synchedJSONState";
import {AccountBalanceReaderTouchable} from "../../components/accountBalance/AccountBalanceReaderTouchable";
import {AccountBalanceAnimation, BalanceStateLowerBound} from "../../components/accountBalance/AccountBalanceAnimation";
import {SettingsIcon} from "../../components/icons/SettingsIcon";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {MyButton} from "../../components/buttons/MyButton";
import {SettingsRowInner} from "../../components/settings/SettingsRowInner";

interface AppState {

}
export const AccountBalance: FunctionComponent<AppState> = (props) => {

    const [debug, setDebug] = useDebugMode()
    const [demo, setDemo] = useDemoMode();

    const projectColor = useProjectColor()
    const readCardBackgroundColor = projectColor;
    const textColorButton = useMyContrastColor(readCardBackgroundColor);

    const translationReadNfc = useAppTranslation("nfcReadCard");

    const toast = useToast();

    const [nfcSupported, setNfcSupported] = useState(undefined);
    const [nfcEnabled, setNfcEnabled] = useState(undefined);
    let canReadNfc = nfcSupported && nfcEnabled;

    const [cardContent, setCardContent] = useState(undefined)

    const [accountBalance, setAccountBalance] = useAccountBalance();
    const [displayBalance, setDisplayBalance] = React.useState(accountBalance || 0);

    const [focusCounter, setFocusCounter] = useState(0);

    useEffect(() => {
        setDisplayBalance(accountBalance)
    }, [accountBalance])

    const isAndroid = PlatformHelper.isAndroid();

    async function checkNfcSupportAndEnableStatus(){
        try{
            if(PlatformHelper.isSmartPhone()){
                let isSupported = await NfcManager.isSupported();
                setNfcSupported(isSupported);
                let isEnabled = await NfcManager.isEnabled();
                setNfcEnabled(isEnabled);
            } else {
                setNfcSupported(false);
                setNfcEnabled(false);
            }
        } catch (e) {
            //console.log(e);
        }
    }

    useMyFocusHandler(() => { // This is called when the tab/app is focused
        setFocusCounter(focusCounter + 1); // we want to reload the lottie animation
        checkNfcSupportAndEnableStatus(); // we want to check if the nfc is enabled
    }, [])

    // corresponding componentDidMount
    useEffect(() => {
        checkNfcSupportAndEnableStatus();
    }, [props?.route?.params])

    function renderNfcStatus(){
        if(nfcSupported === undefined){
            return null;
        }
        if(nfcSupported === false){
            return <AppTranslation id={"nfcNotSupported"} />
        }
        if(nfcEnabled === undefined){
            return null;
        }
        if(nfcEnabled === false){
            if(isAndroid){
                return(
                    <TouchableOpacity style={{flex: 1, width: "70%"}} onPress={async () => {
                        try{
                            let result = await SystemActionHelper.androidSystemActionHelper.openNFCSettings()
                            toast.show({
                                description: JSON.stringify(result)
                            });
                            checkNfcSupportAndEnableStatus(); // update status
                        } catch (e) {
                            toast.show({
                                description: JSON.stringify(e)
                            });
                        }
                    }}>
                        <ViewPercentageBorderradius bg={readCardBackgroundColor} style={{padding: 20 ,flex: 1, width: "100%", alignItems: "center", justifyContent: "center", borderRadius: "5%", flexDirection: "row"}}>
                            <SettingsIcon color={textColorButton} /><View style={{margin: 8}} /><AppTranslation color={textColorButton} id={"nfcNotEnabled"} />
                        </ViewPercentageBorderradius>
                    </TouchableOpacity>
                )
            } else {
                return <AppTranslation id={"nfcNotEnabled"} />
            }
        }
        return null;
    }

    function getNextDemoBalance(displayBalance){
        //console.log("demo mode");
        //console.log(BalanceStateLowerBound);
        // get number keys of BalanceStateLowerBound
        let keys = Object.keys(BalanceStateLowerBound);
        // filter keys to only get the numbers
        let numbers = keys.filter((key) => {
                return !isNaN(parseFloat(key));
            }
        );
        //console.log(numbers);
        // get the current index by displayBalance
        let currentDisplayBalance = displayBalance || 0;
        let currentIndex = numbers.indexOf(currentDisplayBalance.toString());
        //console.log("currentIndex: " + currentIndex);
        if(currentIndex === -1){
            currentIndex = 0;
        }
        // get the next index
        let nextIndex = currentIndex + 1;
        if(nextIndex >= numbers.length){
            nextIndex = 0;
        }
        //console.log("nextIndex: " + nextIndex);
        // get the next balance
        return numbers[nextIndex];
    }

    function renderReadCardButton(){
        let demoText = demo ? <Text color={textColorButton} bold={true}>{"Demo "}</Text> : null;
        let content = (
            <ViewPercentageBorderradius bg={readCardBackgroundColor} style={{padding: 20, alignItems: "center", justifyContent: "center", borderRadius: "5%", flexDirection: "row"}}>
                <View style={{flexDirection: "row"}}>
                    <View>
                        <AccountBalanceIcon color={textColorButton} />
                    </View>
                    <View style={{margin: 8}} />
                    <Text><AppTranslation color={textColorButton} id={"nfcReadCard"} /></Text>
                    <Text>{demoText}</Text>
                </View>
            </ViewPercentageBorderradius>
        );


        if(demo){
            return(
                <TouchableOpacity style={{flex: 1, width: "70%"}} onPress={() => {
                    let nextDemoBalance = getNextDemoBalance(displayBalance);
                    setDisplayBalance(nextDemoBalance);
                }}>
                    {content}
                </TouchableOpacity>
            )
        }

        if(canReadNfc){
            return (
                <View style={{flex: 1, width: "100%", alignItems: "center", justifyContent: "center"}}>
                    <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                        <AccountBalanceReaderTouchable>
                            {content}
                        </AccountBalanceReaderTouchable>
                    </View>
                </View>
            );

        }
    }

  return (
      <View style={{width: "100%"}} key={""+focusCounter}>
          <View style={{width: "100%", justifyContent: "center", alignItems: "center"}}>
              <AccountBalanceAnimation balance={displayBalance} />
              <AppTranslation id={"accountBalance"} />
              <Text fontSize={"4xl"} ><FormatedPriceText price={displayBalance} /></Text>
              <SettingsSpacer />
              {renderNfcStatus()}
              {renderReadCardButton()}
          </View>
      </View>
  )
}
