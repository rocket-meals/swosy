import {View} from '@/components/Themed';
import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import allergist from '@/assets/animations/support-woman.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import React from "react";

export const AnimationSupport = ({children,...props}: any) => {
	const animationSource = allergist;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.support);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;


	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<RectangleWithLayoutCharactersWide amountOfCharactersWide={15}>
				<MyProjectColoredLottieAnimation style={{
					width: '100%',
					height: '100%'
				}}
												 source={animationSource}
												 accessibilityLabel={accessibilityLabel}
				/>
			</RectangleWithLayoutCharactersWide>
		</View>
	)
}
