import {BreakPoint, BreakPointsDictionary, useBreakPointValue} from "@/helper/device/DeviceHelper";
import {View} from "@/components/Themed";
import {Rectangle} from "@/components/shapes/Rectangle";
import {DimensionValue} from "react-native";
import moneyConfident from "@/assets/animations/accountBalance/moneyConfident.json";
import {MyProjectColoredLottieAnimation} from "@/components/lottie/MyProjectColoredLottieAnimation";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const AnimationPriceGroup = ({children,...props}: any) => {

	const animationSource = moneyConfident;
	const translation_animation = useTranslation(TranslationKeys.animation);
	const translation_nameOfTheAnimation = useTranslation(TranslationKeys.price_group);
	const accessibilityLabel = translation_animation + ": " + translation_nameOfTheAnimation;

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
