import React from 'react';
import {MyProjectColoredLottieAnimation} from "@/components/lottie/MyProjectColoredLottieAnimation";
import animationSource from '@/assets/animations/accountBalance/moneyFitness.json';
import {View} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const MoneyFitness = ({children,...props}: any) => {
	const nfcInstruction = useTranslation(TranslationKeys.nfcInstructionRead);
	const translation_animation = useTranslation(TranslationKeys.animation);
	let accessibilityLabel = translation_animation + ': ' + nfcInstruction;

	return (
			<View style={{width: '100%', height: "100%"}}>
				<MyProjectColoredLottieAnimation
					source={animationSource}
					accessibilityLabel={accessibilityLabel}
				/>
			</View>
	)
}
