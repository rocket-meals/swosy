import React, {useEffect, useState} from 'react';
import {Heading, Text, View} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {useIsDemo} from "@/states/SynchedDemo";
import {useIsDebug} from "@/states/Debug";
import {useProjectColor} from "@/states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useAccountBalance} from "@/states/SynchedProfile";
import {useFocusEffect} from "expo-router";
import {SystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {IconNames} from "@/constants/IconNames";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {MoneyConfused} from "@/compositions/animations/accountBalance/MoneyConfused";
import {MoneyConfident} from "@/compositions/animations/accountBalance/MoneyConfident";
import {MoneyFitness} from "@/compositions/animations/accountBalance/MoneyFitness";
import {MoneySad} from "@/compositions/animations/accountBalance/MoneySad";
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import useMyCardReader, {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import useCardReadInstruction from "@/app/(app)/accountbalance/useCardReadInstruction";
import {AccountBalanceAnimation} from "@/app/(app)/accountbalance/BalanceStateBounds";


const onBlur = () => {
	//console.log("Tab is blurred");
};

export function useMyFocusHandler(onFocus: any, deps: any) {

	if(PlatformHelper.isWeb()){
		return useEffect(() => {
			window.addEventListener("focus", onFocus);
			window.addEventListener("blur", onBlur);
			// Calls onFocus when the window first loads
			onFocus();
			// Specify how to clean up after this effect:
			return () => {
				window.removeEventListener("focus", onFocus);
				window.removeEventListener("blur", onBlur);
			};
		}, deps);
	} else {
		return useFocusEffect(
			React.useCallback(() => {
				return () => {
					onFocus()
				};
			}, deps)
		);
	}
}

export default function AccountbalanceScreen() {

	const debug = useIsDebug()
	const demo = useIsDemo()
	const isExpoGo = isInExpoGo()

	const projectColor = useProjectColor()
	const readCardBackgroundColor = projectColor;
	const textColorButton = useMyContrastColor(readCardBackgroundColor);

	const translationReadNfc = useTranslation(TranslationKeys.nfcReadCard)
	const translation_nfcNotSupported = useTranslation(TranslationKeys.nfcNotSupported)
	const translation_nfcNotEnabled = useTranslation(TranslationKeys.nfcNotEnabled)
	const translation_accountBalance = useTranslation(TranslationKeys.accountbalance)
	const translation_nfcInstructionRead = useTranslation(TranslationKeys.nfcInstructionRead)

	let callBack = async (nextBalance: number | null | undefined) => {
		setAccountBalance(nextBalance);
		setDisplayBalance(nextBalance);
	}

	let myCardReader: MyCardReaderInterface = useMyCardReader();

	const [showInstruction, hideInstruction] = useCardReadInstruction()

	const onReadNfcPress = async () => {
		await myCardReader.readCard(callBack, accountBalance, showInstruction, hideInstruction, translation_nfcInstructionRead);
	}


	const [nfcSupported, setNfcSupported] = useState<boolean | undefined>(undefined);
	const [nfcEnabled, setNfcEnabled] = useState<boolean | undefined>(undefined);
	let usedNfcSupported = nfcSupported || demo
	let usedNfcEnabled = nfcEnabled || demo
	let canReadNfc = (usedNfcSupported && usedNfcEnabled)

	const [accountBalance, setAccountBalance] = useAccountBalance();
	const [displayBalance, setDisplayBalance] = useState<number | null | undefined>(accountBalance || 0);

	const [focusCounter, setFocusCounter] = useState(0);

	useEffect(() => {
		setDisplayBalance(accountBalance)
	}, [accountBalance])

	const isAndroid = PlatformHelper.isAndroid();

	async function checkNfcSupportAndEnableStatus(){
		try{
			let isSupported = await myCardReader.isNfcSuppported();
			setNfcSupported(isSupported);
			let isEnabled = await myCardReader.isNfcEnabled();
			setNfcEnabled(isEnabled);
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
	}, [])

	function renderNfcStatus(){
		if(usedNfcSupported === undefined){
			return null;
		}
		if(usedNfcSupported === false){
			if(isExpoGo){
				return <Text>{
					"Expo Go does not support NFC. Please use the built app."
				}</Text>
			} else {
				return <Text>{translation_nfcNotSupported}</Text>
			}
		}
		if(usedNfcEnabled === undefined){
			return null;
		}
		if(usedNfcEnabled === false){
			if(isAndroid){
				return(
					<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.settings_icon} text={translation_nfcNotEnabled} onPress={async () => {
						try{
							let result = await SystemActionHelper.androidSystemActionHelper.openNFCSettings()
							/**
							toast.show({
								description: JSON.stringify(result)
							});
								*/
							checkNfcSupportAndEnableStatus(); // update status
						} catch (e) {
							/**
							toast.show({
								description: JSON.stringify(e)
							});
								*/
						}
					}}  accessibilityLabel={translation_nfcNotEnabled}/>
				)
			} else {
				return <Text>{translation_nfcNotEnabled}</Text>
			}
		}
		return null;
	}



	function renderReadCardButton(){
		let text = translationReadNfc

		if(demo){
			text = "Demo: "+text;
		}

		if(canReadNfc){
			return (
				<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.nfc_icon} text={text} onPress={async () => {
					try {
						await onReadNfcPress();
					} catch (e) {
						/**
						toast.show({
							description: JSON.stringify(e)
						});
							*/
					}
				}}  accessibilityLabel={text}/>
			);

		}
	}

	return (
		<MySafeAreaView style={{width: "100%"}} key={""+focusCounter}>
			<MyScrollView>
				<View style={{width: "100%", justifyContent: "center", alignItems: "center"}}>
					<AccountBalanceAnimation balance={displayBalance} />
					<Text>{translation_accountBalance}</Text>
					<Heading>{formatPrice(displayBalance)}</Heading>
					<View style={{height: 20, width: "100%"}} />
					{renderNfcStatus()}
					<View style={{
						flexDirection: "row",
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
						padding: 10,
						marginTop: 10
					}}>
						{renderReadCardButton()}
					</View>
					<SettingsRowNumberEdit key={displayBalance} accessibilityLabel={
						translation_accountBalance
					} labelLeft={translation_accountBalance} leftIcon={IconNames.account_balance_icon} labelRight={formatPrice(displayBalance)} value={displayBalance} onSave={(newBalance: number |undefined |null) => {
						callBack(newBalance);
					}} />
				</View>
			</MyScrollView>
		</MySafeAreaView>
	)
}
