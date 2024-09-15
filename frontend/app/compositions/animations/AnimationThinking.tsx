import {View} from '@/components/Themed';
import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import animation_thinking from '@/assets/animations/animation_thinking.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';


export type AnimationThinkingProps = {
	color?: string,
	children?: React.ReactNode | React.ReactNode[]
}
export const AnimationThinking = ({children,...props}: AnimationThinkingProps) => {
	const animationSource = animation_thinking;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_image = useTranslation(TranslationKeys.no_data_currently_calculating);
	const accessibilityLabel = translation_animation + ': ' + translation_image;

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<RectangleWithLayoutCharactersWide amountOfCharactersWide={30}>
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
