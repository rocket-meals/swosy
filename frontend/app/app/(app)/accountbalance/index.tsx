import React, {useEffect, useState} from 'react';
import {Heading, Text, View} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {useIsDemo} from "@/states/SynchedDemo";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useAccountBalance, useAccountBalanceInformation, useProfileLanguageCode} from "@/states/SynchedProfile";
import {useFocusEffect} from "expo-router";
import {SystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {IconNames} from "@/constants/IconNames";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import useMyCardReader, {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import useCardReadInstruction from "@/app/(app)/accountbalance/useCardReadInstruction";
import {AccountBalanceAnimation} from "@/app/(app)/accountbalance/BalanceStateBounds";
import {useIsDebug} from "@/states/Debug";
import {SETTINGS_ROW_DEFAULT_PADDING, SettingsRow} from "@/components/settings/SettingsRow";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {getDirectusTranslationUnsafe, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {ThemedMarkdownWithCards} from "@/components/markdown/ThemedMarkdownWithCards";
import CardResponse from "@/helper/nfcCardReaderHelper/CardResponse";
import {DateHelper} from "@/helper/date/DateHelper";

export function useMyFocusHandler(onFocus: any, deps: any) {

	if(PlatformHelper.isWeb()){
		return useEffect(() => {
			window.addEventListener("focus", onFocus);
			// Calls onFocus when the window first loads
			onFocus();

			return () => {
				window.removeEventListener("focus", onFocus);
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

function useBalanceAdditionalInformationMarkdown(): string |null {
	const [appSettings] = useSynchedAppSettings();
	let [languageCode, setLanguage] = useProfileLanguageCode();
	let translations = appSettings?.balance_translations
	let usedTranslations = translations || [] as TranslationEntry[]
	let translation = getDirectusTranslationUnsafe(languageCode, usedTranslations, "content")
	return translation
}

export default function AccountbalanceScreen() {
	const demo = useIsDemo()
	const isExpoGo = isInExpoGo()
	const isDebug = useIsDebug()

	const translationReadNfc = useTranslation(TranslationKeys.nfcReadCard)
	const translation_nfcNotSupported = useTranslation(TranslationKeys.nfcNotSupported)
	const translation_nfcNotEnabled = useTranslation(TranslationKeys.nfcNotEnabled)
	const translation_nfcInstructionRead = useTranslation(TranslationKeys.nfcInstructionRead)

	const translation_accountBalance = useTranslation(TranslationKeys.accountbalance)
	const translation_accountBalanceLastTransaction = useTranslation(TranslationKeys.accountbalanceLastTransaction)
	const translation_accountBalanceLastTransactionDate = useTranslation(TranslationKeys.accountbalanceLastTransactionDate)

	const additionalInformationMarkdown = useBalanceAdditionalInformationMarkdown()

	function renderAdditionalInformation() {
		if(!!additionalInformationMarkdown){
			const borderRaidus = MyCardDefaultBorderRadius
			return (
				<View style={{padding: 10, width: '100%', borderBottomLeftRadius: borderRaidus, borderBottomRightRadius: borderRaidus}}>
					<ThemedMarkdownWithCards markdown={additionalInformationMarkdown} />
				</View>
			)
		}
	}


	let callBack = async (answer: CardResponse | undefined) => {
		if (!answer) {
			return
		}

		const nextBalanceAsString = answer.currentBalance;
		const nextBalanceDefined = nextBalanceAsString !== null && nextBalanceAsString !== undefined;

		const lastTransactionAsString = answer.lastTransaction;
		const lastTransactionDefined = lastTransactionAsString !== null && lastTransactionAsString !== undefined;

		if(!!nextBalanceAsString){
			const nextBalance = parseFloat(nextBalanceAsString);
			setDisplayBalance(nextBalance);
		}
		setAccountBalanceInformation({
			credit_balance: nextBalanceDefined ? parseFloat(nextBalanceAsString) : null,
			credit_balance_last_transaction: lastTransactionDefined ? parseFloat(lastTransactionAsString) : null,
			credit_balance_date_updated: answer.readTime.toISOString(),
		})
	}

	let myCardReader: MyCardReaderInterface = useMyCardReader();

	const [showInstruction, hideInstruction] = useCardReadInstruction()

	const onReadNfcPress = async () => {
		await myCardReader.readCard(callBack, showInstruction, hideInstruction, translation_nfcInstructionRead);
	}

	const [error, setError] = useState<string | undefined>(undefined);

	const [nfcSupported, setNfcSupported] = useState<boolean | undefined>(undefined);
	const [nfcEnabled, setNfcEnabled] = useState<boolean | undefined>(undefined);
	let usedNfcSupported = nfcSupported || demo
	let usedNfcEnabled = nfcEnabled || demo
	let canReadNfc = (usedNfcSupported && usedNfcEnabled)

	const [accountBalanceInformation, setAccountBalanceInformation] = useAccountBalanceInformation();
	const [displayBalance, setDisplayBalance] = useState<number | null | undefined>(accountBalanceInformation.credit_balance || 0);
	const lastTransaction = accountBalanceInformation.credit_balance_last_transaction
	const lastTransactionDate = accountBalanceInformation.credit_balance_date_updated ? DateHelper.formatOfferDateToReadable(new Date(accountBalanceInformation.credit_balance_date_updated), true, true, true) : null;

	const [focusCounter, setFocusCounter] = useState(0);

	useEffect(() => {
		setDisplayBalance(accountBalanceInformation.credit_balance)
	}, [accountBalanceInformation.credit_balance])

	const isAndroid = PlatformHelper.isAndroid();

	async function checkNfcSupportAndEnableStatus(){
		try{
			let isSupported = await myCardReader.isNfcSupported();
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

	//todo: remove this and include it directly in the render function
	function renderNfcStatus(){
		if(usedNfcSupported === undefined){
			return null;
		}
		if(!usedNfcSupported){
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
		if(!usedNfcEnabled){
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
						padding: SETTINGS_ROW_DEFAULT_PADDING,
						marginTop: 10
					}}>
						{canReadNfc && (
							<MyButton
								useOnlyNecessarySpace={true}
								leftIcon={IconNames.nfc_icon}
								text={(demo ? "Demo: " : "") + translationReadNfc}
								onPress={
									async () => {
										try {
											await onReadNfcPress();
										} catch (e: any) {
											/**
											 toast.show({
											 description: JSON.stringify(e)
											 });
											 */
											setError(e.toString())
										}
									}
								}
								accessibilityLabel={(demo ? "Demo: " : "") + translationReadNfc}
							/>
						)}
						{isDebug && (
							<View style={{
								width: "100%",
							}}>
								<Text>
									{"usedNfcSupported: "+usedNfcSupported}
								</Text>
								<Text>
									{"error: "+error}
								</Text>
							</View>
							)}
					</View>
					<SettingsRow key={"balance"+displayBalance} accessibilityLabel={translation_accountBalance} labelLeft={translation_accountBalance} leftIcon={IconNames.account_balance_icon} labelRight={formatPrice(displayBalance)} />
					<SettingsRow key={"lastTransaction"+accountBalanceInformation.credit_balance_last_transaction} accessibilityLabel={translation_accountBalanceLastTransaction} labelLeft={translation_accountBalanceLastTransaction} leftIcon={IconNames.account_balance_last_transaction_icon} labelRight={formatPrice(lastTransaction)} />
					<SettingsRow key={"lastTransactionDate"+accountBalanceInformation.credit_balance_date_updated} accessibilityLabel={translation_accountBalanceLastTransactionDate} labelLeft={translation_accountBalanceLastTransactionDate} leftIcon={IconNames.account_balance_last_transaction_date_update_icon} labelRight={lastTransactionDate} />
				</View>
				{renderAdditionalInformation()}
			</MyScrollView>
		</MySafeAreaView>
	)
}
