import {useIsDemo} from "@/states/SynchedDemo";
import {useIsDebug} from "@/states/Debug";
import {isInExpoGo} from "@/helper/device/DeviceRuntimeHelper";
import MyDemoCardReader from "@/app/(app)/accountbalance/MyDemoCardReader";
import {PlatformHelper} from "@/helper/PlatformHelper";
import MyNativeCardReader from "@/app/(app)/accountbalance/MyNativeCardReader";
import MyUnsupportedCardReader from "@/app/(app)/accountbalance/MyUnsupportedCardReader";

export interface MyCardReaderInterface {
	isNfcSuppported: () => Promise<boolean>;
	isNfcEnabled: () => Promise<boolean>;
	readCard: (callBack: (balance: number |undefined |null) => Promise<void>, accountBalance: number |undefined |null, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string) => Promise<void>;
}

export default function useMyCardReader() : MyCardReaderInterface {

	const debug = useIsDebug()
	const demo = useIsDemo()
	const isExpoGo = isInExpoGo()

	if(demo){
		return new MyDemoCardReader();
	}
	if(PlatformHelper.isSmartPhone() && !isExpoGo){
		return new MyNativeCardReader();
	}

	return new MyUnsupportedCardReader();
}