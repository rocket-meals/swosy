import {View} from '@/components/Themed';
import locationAnimation from '@/assets/animations/animation_location.json';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import React from "react";


export const LocationAnimation = ({children, ...props}: any) => {
	const animationSource = locationAnimation
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.location);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;

	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={10}>
			<View style={{width: '100%', height: "100%"}}>
				<MyProjectColoredLottieAnimation
					speed={0.5}
												 source={animationSource}
												 accessibilityLabel={accessibilityLabel}
				/>
			</View>
		</RectangleWithLayoutCharactersWide>

	)
}
