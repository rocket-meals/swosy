import {View} from '@/components/Themed';
import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import noFoodOffersFound from '@/assets/animations/noFoodOffersFound.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export const AnimationNoFoodOffersFound = ({children,...props}: any) => {
	const animationSource = noFoodOffersFound;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.price_group);
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
