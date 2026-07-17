import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';

export type MyCardReaderResponseSupport = {
	result: boolean;
	message?: string;
	error?: any;
};

export interface MyCardReaderInterface {
	isNfcSupported: () => Promise<MyCardReaderResponseSupport>;
	isNfcEnabled: () => Promise<MyCardReaderResponseSupport>;
	readCard: (callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string) => Promise<void>;
	/**
	 * Interrupts an in-flight readCard() call (e.g. user pressed "cancel reading"
	 * on the instruction). Best-effort: the underlying NFC session is torn down,
	 * which causes readCard()'s pending native calls to reject/resolve early, so
	 * callBack() is never invoked with card data. Safe to call even when no read
	 * is in progress.
	 */
	cancelRead: () => Promise<void>;
}