import React from 'react';
import {Text, View} from "@/components/Themed";
import {useIsDemo} from "@/states/SynchedDemo";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {NfcInstruction} from "@/compositions/animations/accountBalance/NfcInstruction";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";


export default function useCardReadInstruction(): [() => void, () => void] {

	const isDemo = useIsDemo();
	let title = "NFC";
	if(isDemo){
		title = "Demo: "+title;
	}
	const nfcInstruction = useTranslation(TranslationKeys.nfcInstructionRead);
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const show = () => {
		setModalConfig({
			title: title,
			accessibilityLabel: title,
			key: "nfcInstruction",
			label: title,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return (
					<View style={{width: "100%", justifyContent: "center", alignItems: "center"}}>
						<Text style={{
							textAlign: "center"
						}}>{
							nfcInstruction
						}</Text>
						<NfcInstruction/>
					</View>
				)
			}
		})
	}

	const hide = () => {
		setModalConfig(null);
	}

	return [show, hide];
}
