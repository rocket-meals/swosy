import {useProjectColor} from '@/states/ProjectInfo';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {View, Text} from "@/components/Themed";
import SimpleBadge from "@/components/badge/SimpleBadge";
import {IconNames} from "@/constants/IconNames";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {LocationAnimation} from "@/compositions/animations/LocationAnimation";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";

export type DistanceBadgeProps = {
  distanceInMeter: number
}


export default function DistanceBadge(props: DistanceBadgeProps) {
	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
	const translation_title = useTranslation(TranslationKeys.sort_option_distance)

	const translation_distance_based_canteen_selection_or_if_asked_on_real_location = useTranslation(TranslationKeys.distance_based_canteen_selection_or_if_asked_on_real_location)



	let distanceInMeter = props.distanceInMeter
	let distanceText = distanceInMeter+"";
	if(distanceInMeter<1000){
		distanceText = distanceInMeter+" m";
	} else {
		// to fixed 1
		let distanceInKm = (distanceInMeter/1000).toFixed(1);
		distanceText = distanceInKm+" km";
	}

	const buttonAccessibilityLabel = translation_title + ' ' + distanceText;


	const config: MyGlobalActionSheetConfig = {
		onCancel: async () => {
			return true;
		},
		visible: true,
		title: translation_title,
		renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
			return (
				<MySafeAreaView>
					<MyScrollView>
						<View style={{
							padding: 20,
							backgroundColor: backgroundColor,
						}}>
							<View style={{
								width: '100%',
								alignItems: 'center',
							}}>
								<LocationAnimation />
							</View>
							<Text>{translation_distance_based_canteen_selection_or_if_asked_on_real_location}</Text>
						</View>
					</MyScrollView>
				</MySafeAreaView>
			)

		}
	}


	return (
		<MyTouchableOpacity accessibilityLabel={buttonAccessibilityLabel} onPress={() => {
			show(config)
		}}>
			<SimpleBadge icon={IconNames.sort_distance_icon} borderBottomLeft={true} borderTopLeft={true} text={distanceText} />
		</MyTouchableOpacity>
	)
}