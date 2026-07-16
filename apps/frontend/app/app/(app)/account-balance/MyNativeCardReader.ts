import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';
import CardReader from '@/helper/nfcCardReaderHelper/CardReader';
import {MyCardReaderInterface, MyCardReaderResponseSupport} from "@/app/(app)/account-balance/MyCardReaderInterface";

const isExpoGo = isRunningInExpoGo();

class NfcManagerClass {
	public static NfcManager: any;
	public static NfcTech: any;
}

// Loader-Funktion (wird nur einmal wirklich importieren)
async function loadNfc() {
	if (isExpoGo) return null;
	if (!NfcManagerClass.NfcManager || !NfcManagerClass.NfcTech) {
		const nfcManager = await import('react-native-nfc-manager');
		NfcManagerClass.NfcManager = nfcManager.default;
		NfcManagerClass.NfcTech = nfcManager.NfcTech;
	}
	return {
		NfcManager: NfcManagerClass.NfcManager,
		NfcTech: NfcManagerClass.NfcTech,
	};
}

export default class MyNativeCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<MyCardReaderResponseSupport> {
		try {
			if (isExpoGo) {
				return { result: false, message: 'NFC is not supported in Expo Go' };
			}

			const nfc = await loadNfc();
			if (!nfc?.NfcManager) {
				return { result: false, message: 'NFC Manager is not available' };
			}
			let isEnabled = await nfc.NfcManager.isEnabled();
			return { result: isEnabled };
		} catch (e: any) {
			return { result: false, message: 'Error checking NFC status', error: e };
		}
	}

	async isNfcSupported(): Promise<MyCardReaderResponseSupport> {
		try {
			if (isExpoGo) {
				return { result: false, message: 'NFC is not supported in Expo Go' };
			}
			const nfc = await loadNfc();
			if (!nfc?.NfcManager) {
				return { result: false, message: 'NFC Manager is not available' };
			}
			let isSupported = await nfc.NfcManager.isSupported();
			return { result: isSupported };
		} catch (e: any) {
			return { result: false, message: 'Error checking NFC support', error: e };
		}
	}

	async readCard(callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		if (isExpoGo) {
			console.error('NFC operations are not supported in this environment.');
			return;
		}
		const nfc = await loadNfc();
		if (!nfc?.NfcManager || !nfc?.NfcTech) {
			console.error('NFC Manager or Tech is not available.');
			return;
		}

		if (Platform.OS === 'android') {
			// only show instruction on android since ios has a built in instruction
			showInstruction();
		}

		let reader = new CardReader(nfc.NfcManager, nfc.NfcTech, Platform);
		try {
			console.log('DEBUG: start reading card');
			let newAnswer = await reader.readCard(nfcInstruction);
			console.log('Answer');
			console.log(newAnswer);
			await callBack(newAnswer);
		} finally {
			// also hide on error/cancel so the instruction popup never gets stuck
			hideInstruction();
		}
	}

	async cancelRead(): Promise<void> {
		if (isExpoGo) return;
		const nfc = await loadNfc();
		if (!nfc?.NfcManager) return;
		try {
			// Tearing down the NFC session interrupts whatever native call
			// readCard() is currently awaiting (requestTechnology/transceive),
			// so its try/finally unwinds early instead of waiting for a card.
			await nfc.NfcManager.cancelTechnologyRequest();
		} catch (e) {
			// Best-effort, same as MensaCardReaderHelper._cleanUp - nothing to
			// recover from if there was no active request.
		}
	}
}
