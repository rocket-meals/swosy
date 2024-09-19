import {useIsDemo} from "@/states/SynchedDemo";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";
import MyDemoCardReader from "@/app/(app)/accountbalance/MyDemoCardReader";
import {PlatformHelper} from "@/helper/PlatformHelper";
import MyNativeCardReader from "@/app/(app)/accountbalance/MyNativeCardReader";
import MyUnsupportedCardReader from "@/app/(app)/accountbalance/MyUnsupportedCardReader";
import CardResponse from "@/helper/nfcCardReaderHelper/CardResponse";

export interface MyCardReaderInterface {
	isNfcSupported: () => Promise<boolean>;
	isNfcEnabled: () => Promise<boolean>;
	readCard: (callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string) => Promise<void>;
}

export default function useMyCardReader() : MyCardReaderInterface {
	const demo = useIsDemo()
	const isExpoGo = isInExpoGo()

	if (demo){
		return new MyDemoCardReader();
	}

	if (PlatformHelper.isSmartPhone() && !isExpoGo){
		return new MyNativeCardReader();
	}

	return new MyUnsupportedCardReader();
}