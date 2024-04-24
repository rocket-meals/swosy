import {RectangleWithLayoutCharactersWide} from '@/components/shapes/Rectangle';
import notificationSource from '@/assets/animations/notificationBell.json';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {View} from "@/components/Themed";

export const AnimationNotificationBell = ({children,...props}: any) => {
	const animationSource = notificationSource;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.notification);
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
