import React from 'react';
import {DimensionValue} from 'react-native';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {Text, View} from '@/components/Themed';
import {Tooltip, TooltipContent, TooltipText} from '@gluestack-ui/themed';

const paddingLeft = 5;

/**
 * RushMinutes can show the user how full the canteen is probably
 */
export type UtilizationForecastBarProps = {
    width: DimensionValue,
    height: DimensionValue,
	maxHeight: DimensionValue,
    bgColor: string,
    textInside: string | null,
    textBelow: string | null,
    isActive: boolean | undefined,
    accessibilityLabel?: string
    tooltip?: string
}
export const UtilizationForecastBar = (props: UtilizationForecastBarProps) => {
	const width = props?.width;
	const height = props?.height
	const maxHeight = props?.maxHeight
	const bgColor = props?.bgColor;
	const textInside = props?.textInside;
	const textBelow = props?.textBelow;
	let isActive = props?.isActive

	const bgContrast = useMyContrastColor(bgColor)

	isActive = true;
	const borderColor = isActive ? bgContrast : 'transparent';

	const textStyle = {color: bgContrast}

	return (
		<Tooltip
			placement="top"
			trigger={(triggerProps) => {
				return (
					<View
						{...triggerProps}
						style={{alignItems: 'center', paddingRight: 0, paddingLeft: paddingLeft}}
					>

						<View
							accessibilityLabel={props?.accessibilityLabel}
							style={{
								width: width,
								height: maxHeight,
								borderColor: bgContrast,
								justifyContent: 'flex-end',
								alignItems: 'center',
							}}
						>
							<View
								accessibilityLabel={props?.accessibilityLabel}
								style={{
									width: width,
									height: height,
									borderRadius: 10,
									borderWidth: 2,
									borderColor: borderColor,
									backgroundColor: bgColor,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<View style={{

									width: '100%',
									justifyContent: 'center',
									alignItems: 'center',
									flex: 1
								}}
								>
									<Text>{textInside}</Text>
								</View>
							</View>
						</View>
						<Text >{textBelow}</Text>
					</View>
				)
			}}
		>
			<TooltipContent>
				<TooltipText>{props.tooltip}</TooltipText>
			</TooltipContent>
		</Tooltip>
	)
}
