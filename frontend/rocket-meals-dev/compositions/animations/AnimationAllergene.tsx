import {View} from '@/components/Themed';
import allergist from '@/assets/animations/allergist.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";

export const AnimationAllergene = ({children,...props}: any) => {
	const animationSource = allergist;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.allergene);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
				<RectangleWithLayoutCharactersWide amountOfCharactersWide={20}>
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
