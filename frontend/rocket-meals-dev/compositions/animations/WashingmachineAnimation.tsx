import {BreakPoint, BreakPointsDictionary, useBreakPointValue} from "@/helper/device/DeviceHelper";
import {View} from "@/components/Themed";
import {Rectangle} from "@/components/shapes/Rectangle";
import {DimensionValue} from "react-native";
import washingmachine from "@/assets/animations/washingmachine/washingmachine.json";
import washingmachineEmpty from "@/assets/animations/washingmachine/washingmachineEmpty.json";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyProjectColoredLottieAnimation} from "@/components/lottie/MyProjectColoredLottieAnimation";


export const WashingmachineAnimation = ({children, active,...props}: any) => {

	const animationSource = active ? washingmachine : washingmachineEmpty;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.washing_machine);
	const translation_active = useTranslation(TranslationKeys.active);
	const translation_inactive = useTranslation(TranslationKeys.inactive);
	const usedTranslationState = active ? translation_active : translation_inactive;
	const accessibilityLabel = translation_animation + ": " + translation_nameOfTheAnimation + " " + usedTranslationState;

	const noFoundWidths: BreakPointsDictionary<DimensionValue> = {
		[BreakPoint.sm]: "70%",
		[BreakPoint.md]: "30%",
	}
	const noFoundWidth = useBreakPointValue<DimensionValue>(noFoundWidths);

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle aspectRatio={1343/964}>
					<MyProjectColoredLottieAnimation style={{
						width: "100%",
						height: "100%"
					}} source={animationSource} accessibilityLabel={accessibilityLabel}/>
				</Rectangle>
			</View>
		</View>
	)
}
