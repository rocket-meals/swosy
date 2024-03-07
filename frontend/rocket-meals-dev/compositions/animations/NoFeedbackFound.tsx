import {Text, View} from "@/components/Themed";
import {AnimationEmptyNotingFound} from "@/compositions/animations/AnimationEmptyNotingFound";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const NoFeedbackFound = ({children,...props}: any) => {

	const translation_noFeedbacksFound = useTranslation(TranslationKeys.noFeedbacksFound);

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{height: 30}}></View>
			<Text>{translation_noFeedbacksFound}</Text>
			<AnimationEmptyNotingFound />
		</View>
	)
}
