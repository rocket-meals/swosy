import {BreakPoint, BreakPointsDictionary, useBreakPointValue} from '@/helper/device/DeviceHelper';
import {View} from '@/components/Themed';
import {Rectangle} from '@/components/shapes/Rectangle';
import notificationSource from '@/assets/animations/notificationBell.json';
import {DimensionValue} from 'react-native';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';

export const AnimationNotificationBell = ({children,...props}: any) => {
	const animationSource = notificationSource;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.notification);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;

	const noFoundWidths: BreakPointsDictionary<DimensionValue> = {
		[BreakPoint.sm]: '70%',
		[BreakPoint.md]: '30%',
	}
	const noFoundWidth = useBreakPointValue<DimensionValue>(noFoundWidths);

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle aspectRatio={1343/964}>
					<MyProjectColoredLottieAnimation style={{
						width: '100%',
						height: '100%'
					}}
					source={animationSource}
					accessibilityLabel={accessibilityLabel}
					/>
				</Rectangle>
			</View>
		</View>
	)
}
