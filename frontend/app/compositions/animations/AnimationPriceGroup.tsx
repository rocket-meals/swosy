import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import moneyConfident from '@/assets/animations/accountBalance/moneyConfident.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export const AnimationPriceGroup = ({children,...props}: any) => {
	const animationSource = moneyConfident;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.price_group);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;


	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={20}>
					<MyProjectColoredLottieAnimation style={{
						width: '100%',
						height: '100%'
					}}
					source={animationSource}
					accessibilityLabel={accessibilityLabel}
					/>
		</RectangleWithLayoutCharactersWide>
	)
}
