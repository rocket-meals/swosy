import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import React from "react";

export type SimpleBadgeIconButtonProps = {
  icon?: string;
  accessibilityLabel: string;
  customIcon?: React.ReactNode;
  borderTopLeft?: boolean;
  borderBottomLeft?: boolean;
  borderTopRight?: boolean;
  borderBottomRight?: boolean;
  hide_border?: boolean;
  borderRadius?: number;
  color?: string;
  onPress?: () => void;
}


export default function SimpleBadgeIconButton(props: SimpleBadgeIconButtonProps) {
	const borderRadius = props.borderRadius || MyCardDefaultBorderRadius;

	const hide_border = props.hide_border

	const accessibilityLabel = props.accessibilityLabel

	const onPress = () => {
		if(props.onPress){
			props.onPress();
		}
	}

	let customIcon = props.customIcon;

	let usedIcon = props.icon;

	if(!usedIcon && !customIcon){
		usedIcon = IconNames.identifier;
	}

	return 	<>
		<MyButton
			useTransparentBorderColor={hide_border}
			useOnlyNecessarySpace={true}
			borderRadius={borderRadius}
			onPress={onPress}
			accessibilityLabel={accessibilityLabel}
			tooltip={accessibilityLabel}
			icon={usedIcon}
			customIcon={customIcon}
		/>
	</>
}