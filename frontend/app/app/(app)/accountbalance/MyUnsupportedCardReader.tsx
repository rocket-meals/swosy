import {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";

export default class MyUnsupportedCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<boolean> {
		return false;
	}

	async isNfcSuppported(): Promise<boolean> {
		return false
	}

	async readCard(callBack: (balance: (number | undefined | null)) => Promise<void>, accountBalance: (number | undefined | null), showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		throw new Error("NFC is not supported on this device");
	}

}