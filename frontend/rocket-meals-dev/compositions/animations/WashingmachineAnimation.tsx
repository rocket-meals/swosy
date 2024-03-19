import {View} from '@/components/Themed';
import washingmachine from '@/assets/animations/washingmachine/washingmachine.json';
import washingmachineEmpty from '@/assets/animations/washingmachine/washingmachineEmpty.json';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';


export const WashingmachineAnimation = ({children, active,...props}: any) => {
	const animationSource = active ? washingmachine : washingmachineEmpty;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.washing_machine);
	const translation_active = useTranslation(TranslationKeys.active);
	const translation_inactive = useTranslation(TranslationKeys.inactive);
	const usedTranslationState = active ? translation_active : translation_inactive;
	const accessibilityLabel = translation_animation + ': ' + translation_nameOfTheAnimation + ' ' + usedTranslationState;

	/**

	 */

	return (
		<View style={{width: '100%', height: "100%"}}>
			<MyProjectColoredLottieAnimation zoom={1.5} loop={active} autoPlay={active}
											 source={animationSource}
											 accessibilityLabel={accessibilityLabel}
			/>
		</View>
	)
}
