import {useProjectColor} from '@/states/ProjectInfo';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {View, Text, Icon} from "@/components/Themed";
import {IconNames} from "@/constants/IconNames";

export type SimpleBadgeProps = {
  text: string;
  icon?: string;
  borderTopLeft?: boolean;
  borderBottomLeft?: boolean;
  borderTopRight?: boolean;
  borderBottomRight?: boolean;
  borderRadius?: number;
  color?: string;
}


export default function SimpleBadge(props: SimpleBadgeProps) {
	const projectColor = props.color ?? useProjectColor();
	const projectContrastColor = useMyContrastColor(projectColor);

	let usedBorderRadius = props.borderRadius ?? 14;

	let renderedIcon = null;
	if(props.icon){
		renderedIcon = <View style={{
			paddingRight: 5,
		}}>
			<Icon style={{color: projectContrastColor}} name={props.icon} />
		</View>
	}

	return (
		<View style={{
			backgroundColor: projectColor,
			padding: 5,
			borderTopLeftRadius: props.borderTopLeft ? usedBorderRadius : 0,
			borderBottomLeftRadius: props.borderBottomLeft ? usedBorderRadius : 0,
			borderTopRightRadius: props.borderTopRight ? usedBorderRadius : 0,
			borderBottomRightRadius: props.borderBottomRight ? usedBorderRadius : 0,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
		}}
		>
			{renderedIcon}<Text style={{color: projectContrastColor}}>{props.text}</Text>
		</View>
	)
}