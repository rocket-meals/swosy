import React from 'react';
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import {MyProjectColoredLottieAnimation} from "@/components/lottie/MyProjectColoredLottieAnimation";
import animationSource from '@/assets/animations/accountBalance/nfcInstruction.json';
import {View} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const NfcInstruction = ({children,...props}: any) => {
	const nfcInstruction = useTranslation(TranslationKeys.nfcInstructionRead);
	const translation_animation = useTranslation(TranslationKeys.animation);
	let accessibilityLabel = translation_animation + ': ' + nfcInstruction;

	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={10}>
			<View style={{width: '100%', height: "100%"}}>
				<MyProjectColoredLottieAnimation
												 source={animationSource}
												 accessibilityLabel={accessibilityLabel}
				/>
			</View>
		</RectangleWithLayoutCharactersWide>
	)
}
