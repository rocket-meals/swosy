
import {BreakPoint, BreakPointsDictionary, useBreakPointValue} from '@/helper/device/DeviceHelper';
import {View} from '@/components/Themed';
import {Rectangle} from '@/components/shapes/Rectangle';
import astronautComputer from '@/assets/animations/astronaut-computer.json';
import {DimensionValue} from 'react-native';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export const AnimationAstronautComputer = ({children,...props}: any) => {
	const animationSource = astronautComputer;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.attention);
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation;

	const noFoundWidths: BreakPointsDictionary<DimensionValue> = {
		[BreakPoint.sm]: '50%',
		[BreakPoint.md]: '20%',
		[BreakPoint.lg]: '10%',
	}
	const noFoundWidth = useBreakPointValue<DimensionValue>(noFoundWidths);

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle>
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
