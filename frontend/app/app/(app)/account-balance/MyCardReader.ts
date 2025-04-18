import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';
// import { useIsDemo } from '@/states/SynchedDemo';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import MyNativeCardReader from './MyNativeCardReader';
import MyUnsupportedCardReader from './MyUnsupportedCardReader';

export interface MyCardReaderInterface {
  isNfcSupported: () => Promise<boolean>;
  isNfcEnabled: () => Promise<boolean>;
  readCard: (
    callBack: (answer: CardResponse | undefined) => Promise<void>,
    showInstruction: () => void,
    hideInstruction: () => void,
    nfcInstruction: string
  ) => Promise<void>;
}

export default function useMyCardReader(): MyCardReaderInterface {
  //   const demo = useIsDemo();
  const isExpoGo = isRunningInExpoGo();
  //   if (demo) {
  //     return new MyDemoCardReader();
  //   }

  if ((Platform.OS === 'android' || Platform.OS === 'ios') && !isExpoGo) {
    return new MyNativeCardReader();
  }

  return new MyUnsupportedCardReader();
}
