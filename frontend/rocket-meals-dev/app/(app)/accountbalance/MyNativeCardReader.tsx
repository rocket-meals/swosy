import {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {Platform} from "react-native";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";

const isExpoGo = isInExpoGo();

let NfcManager: any
let NfcTech: any
let CardReader: any

if (!isExpoGo) {
	// Expo Go does not have this module boundled by default, therefore we need to lazy load it to prevent errors
	// @ts-ignore
	import("react-native-nfc-manager").then(nfcManager => {
		NfcManager = nfcManager.default;
		NfcTech = nfcManager.NfcTech;
	});

	// Expo Go does not have this module boundled by default, therefore we need to lazy load it to prevent errors
	// @ts-ignore
	import("react-native-nfc-manager-sw-os").then(nfcManagerSwOs => {
		CardReader = nfcManagerSwOs.CardReader;
	});
}

export default class MyNativeCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<boolean> {
		if (isExpoGo || !NfcManager) return false;
		let isEnabled = await NfcManager.isEnabled();
		return isEnabled;
	}

	async isNfcSuppported(): Promise<boolean> {
		if (isExpoGo || !NfcManager) return false;
		let isSupported = await NfcManager.isSupported();
		return isSupported;
	}

	async readCard(callBack: (balance: number | undefined | null) => Promise<void>, accountBalance: number | undefined | null, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		if (isExpoGo || !NfcManager || !CardReader) {
			console.error("NFC operations are not supported in this environment.");
			return;
		}
		if(PlatformHelper.isAndroid()){ // only show instruction on android since ios has a built in instruction
			showInstruction();
		}
		let reader = new CardReader(NfcManager, NfcTech, Platform);
		try{
			console.log("DEBUG: start reading card");
			let newAnswer = await reader.readCard(nfcInstruction);
			console.log("Answer");
			console.log(newAnswer);
			let newBalance = newAnswer?.currentBalance;
			if(newBalance !== undefined && newBalance !== null){
				await callBack(parseFloat(newBalance));
				hideInstruction()
			}
		} catch (e: any) {
			throw e;
		}
	}

}