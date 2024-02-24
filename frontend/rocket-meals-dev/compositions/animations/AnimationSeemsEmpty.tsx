import {Text, View} from "@/components/Themed";
import {AnimationEmptyNotingFound} from "@/compositions/animations/AnimationEmptyNotingFound";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const AnimationSeemsEmpty = ({children,...props}: any) => {

	const translation_seemsEmpty = useTranslation(TranslationKeys.seemsEmpty);

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{height: 30}}></View>
			<Text>{
				translation_seemsEmpty
			}</Text>
			<AnimationEmptyNotingFound />
		</View>
	)
}
