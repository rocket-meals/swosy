import {Text, View} from "@/components/Themed";
import SimpleBadge from "@/components/badge/SimpleBadge";
import {IconNames} from "@/constants/IconNames";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {LocationAnimation} from "@/compositions/animations/LocationAnimation";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyModal} from "@/components/modal/MyModal";
import {useState} from "react";

export type DistanceBadgeProps = {
  distanceInMeter: number
}


export default function DistanceBadge(props: DistanceBadgeProps) {
	const [show, setShow] = useState(false)
	const translation_title = useTranslation(TranslationKeys.sort_option_distance)

	const translation_distance_based_canteen_selection_or_if_asked_on_real_location = useTranslation(TranslationKeys.distance_based_canteen_selection_or_if_asked_on_real_location)

	let distanceInMeter = props.distanceInMeter
	let distanceText = distanceInMeter+"";
	if(distanceInMeter<1000){
		// round up to 50m
		distanceInMeter = Math.ceil(distanceInMeter/50)*50;
		distanceText = distanceInMeter+" m";
	} else {
		// to fixed 1
		let distanceInKm = (distanceInMeter/1000).toFixed(1);
		distanceText = distanceInKm+" km";
	}

	const buttonAccessibilityLabel = translation_title + ' ' + distanceText;


	return (
		<>
			<MyTouchableOpacity accessibilityLabel={buttonAccessibilityLabel} onPress={() => {
				setShow(true)
			}}>
				<SimpleBadge icon={IconNames.sort_distance_icon} borderBottomLeft={true} borderTopLeft={true} text={distanceText} />
			</MyTouchableOpacity>
			<MyModal visible={show} title={translation_title}>
					<MyScrollView>
						<View style={{
							padding: 20,
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
			</MyModal>
		</>
	)
}