import React, {useEffect, useState} from 'react';
import {Heading, Text, View} from "@/components/Themed";
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
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
import {CardReader} from "react-native-nfc-manager-sw-os";
import {Platform} from "react-native";
import {NfcInstruction} from "@/compositions/animations/accountBalance/NfcInstruction";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {MoneyConfused} from "@/compositions/animations/accountBalance/MoneyConfused";
import {MoneyConfident} from "@/compositions/animations/accountBalance/MoneyConfident";
import {MoneyFitness} from "@/compositions/animations/accountBalance/MoneyFitness";
import {MoneySad} from "@/compositions/animations/accountBalance/MoneySad";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";


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


export enum BalanceStateLowerBound{
	CONFIDENT = 10,
	FITNESS = 3,
	SAD = 0,
	CONFUSED = -0.01
}

export default function AccountbalanceScreen() {

	const debug = useIsDebug()
	const demo = useIsDemo()

	const projectColor = useProjectColor()
	const readCardBackgroundColor = projectColor;
	const textColorButton = useMyContrastColor(readCardBackgroundColor);

	const translationReadNfc = useTranslation(TranslationKeys.nfcReadCard)
	const translation_nfcNotSupported = useTranslation(TranslationKeys.nfcNotSupported)
	const translation_nfcNotEnabled = useTranslation(TranslationKeys.nfcNotEnabled)
	const translation_accountBalance = useTranslation(TranslationKeys.accountbalance)

	let callBack = async (nextBalance: number | null | undefined) => {
		setAccountBalance(nextBalance);
		setDisplayBalance(nextBalance);
	}

	const onReadNfcPress = useNfcCardReadPress(callBack);

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
	}, [])

	function renderNfcStatus(){
		if(usedNfcSupported === undefined){
			return null;
		}
		if(usedNfcSupported === false){
			return <Text>{translation_nfcNotSupported}</Text>
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
				<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.account_balance_icon} text={text} onPress={async () => {
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
		<View style={{width: "100%"}} key={""+focusCounter}>
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
				} labelLeft={translation_accountBalance} labelRight={formatPrice(displayBalance)} value={displayBalance} onSave={(newBalance: number |undefined |null) => {
					callBack(newBalance);
				}} />
			</View>
		</View>
	)
}


type AccountBalanceAnimationProps = {
	balance: number | undefined | null
}
export const AccountBalanceAnimation = (props: AccountBalanceAnimationProps) => {
	const balance = props?.balance;

	let animation = <MoneyConfused />

	if(balance===undefined || balance===null || balance < 0){
		animation = <MoneyConfused />
	} else if(balance >= BalanceStateLowerBound.CONFIDENT){
		animation = <MoneyConfident />
	} else if(balance >= BalanceStateLowerBound.FITNESS){
		animation = <MoneyFitness />
	} else if(balance >= BalanceStateLowerBound.SAD){
		animation = <MoneySad />
	}

	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={20}>
			{animation}
		</RectangleWithLayoutCharactersWide>
	)
}



export const useNfcCardReadPress = (callBack: (balance: number |undefined |null) => Promise<void>) => {

	const nfcInstruction = useTranslation(TranslationKeys.nfcInstructionRead);
	const translationSuccess = useTranslation(TranslationKeys.success);
	const translationError = useTranslation(TranslationKeys.error);

	let handleCloseModal = () => {
		setModalConfig(null);
	}

	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const [accountBalance, setAccountBalance] = useAccountBalance();
	const [cardContent, setCardContent] = useState("-");
	const debug = useIsDebug()
	const isDemo = useIsDemo();

	function getNextDemoBalance(displayBalance: number | null | undefined){
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
		return parseFloat(numbers[nextIndex])
	}

	function showCardReadInstruction(){
		handleCloseModal = () => {}; // reset
		if(PlatformHelper.isAndroid()) {
			setModalConfig({
				title: nfcInstruction,
				accessibilityLabel: nfcInstruction,
				key: "nfcInstruction",
				label: nfcInstruction,
				renderAsContentInsteadItems: (key: string, hide: () => void) => {
					return (
						<View style={{width: "100%", justifyContent: "center"}}>
							<Text>{
								nfcInstruction
							}</Text>
							<NfcInstruction/>
						</View>
					)
				}
			})
		}
		if(PlatformHelper.isIOS()) {
			// iOS does not need an instruction, since it has a native popup
		}
	}

	async function startCardReading(){
		if(isDemo){
			let nextBalance = getNextDemoBalance(accountBalance);
			await callBack(nextBalance);
			return;
		}


		showCardReadInstruction();
		let reader = new CardReader(NfcManager, NfcTech, Platform);
		try{
			console.log("DEBUG: start reading card");
			let newAnswer = await reader.readCard(nfcInstruction);
			console.log("Answer");
			console.log(newAnswer);
			setCardContent(JSON.stringify(newAnswer, null, 2));

			let newBalance = newAnswer?.currentBalance;
			if(newBalance !== undefined && newBalance !== null){
				setAccountBalance(parseFloat(newBalance));
				handleCloseModal();
			} else {
				setModalConfig({
					title: translationError,
					accessibilityLabel: translationError,
					key: "nfcError",
					label: translationError,
					renderAsContentInsteadItems: (key: string, hide: () => void) => {
						return (
							<View>
								<Text>{translationError}</Text>
							</View>
						)
					}

				})
			}
		} catch (e: any) {
			console.log(e);
			setCardContent(e.toString());
			setModalConfig({
				title: translationError,
				accessibilityLabel: translationError,
				key: "nfcError",
				label: translationError,
				renderAsContentInsteadItems: (key: string, hide: () => void) => {
					return (
						<View>
							<Text>{translationError}</Text>
						</View>
					)
				}

			})
		}
	}

	const onPress = async () => {
		await startCardReading();
	}

	return onPress;
}