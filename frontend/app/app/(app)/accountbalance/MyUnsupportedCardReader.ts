import {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import CardResponse from "@/helper/nfcCardReaderHelper/CardResponse";

export default class MyUnsupportedCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<boolean> {
		return false;
	}

	async isNfcSupported(): Promise<boolean> {
		return false
	}

	async readCard(callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		throw new Error("NFC is not supported on this device");
	}
}