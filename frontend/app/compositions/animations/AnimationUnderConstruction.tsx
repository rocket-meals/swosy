import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import underConstruction from '@/assets/animations/underConstruction.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export const AnimationUnderConstruction = ({children,...props}: any) => {
	const animationSource = underConstruction;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.maintenance);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;


	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={30}>
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
