import {useProjectColor} from '@/states/ProjectInfo';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {View, Text} from "@/components/Themed";
import SimpleBadge from "@/components/badge/SimpleBadge";
import {IconNames} from "@/constants/IconNames";

export type DistanceBadgeProps = {
  distanceInMeter: number
}


export default function DistanceBadge(props: DistanceBadgeProps) {
	let distanceInMeter = props.distanceInMeter
	let distanceText = distanceInMeter+"";
	if(distanceInMeter<1000){
		distanceText = distanceInMeter+" m";
	} else {
		// to fixed 1
		let distanceInKm = (distanceInMeter/1000).toFixed(1);
		distanceText = distanceInKm+" km";
	}



	return (
		<SimpleBadge icon={IconNames.sort_distance_icon} borderBottomLeft={true} borderTopLeft={true} text={distanceText} />
	)
}