import React from 'react';
import {DimensionValue} from 'react-native';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {Text, View} from '@/components/Themed';
import {Tooltip, TooltipContent, TooltipText} from '@gluestack-ui/themed';
import {useIsDebug} from "@/states/Debug";
import {UtilizationData} from "@/compositions/utilizationForecast/UtilizationForecastRow";

const paddingLeft = 5;

/**
 * RushMinutes can show the user how full the canteen is probably
 */
export type UtilizationForecastBarProps = {
    width: DimensionValue,
    height: DimensionValue,
	populartime?: UtilizationData,
	maxHeight: DimensionValue,
    bgColor: string,
    textInside: string | null,
    textBelow: string | null,
    isActive: boolean | undefined,
    accessibilityLabel?: string
    tooltip?: string
}
export const UtilizationForecastBar = (props: UtilizationForecastBarProps) => {
	const isDebug = useIsDebug()
	const width = props?.width;
	const height = props?.height
	const maxHeight = props?.maxHeight
	const bgColor = props?.bgColor;
	const textInside = props?.textInside;
	const textBelow = props?.textBelow;
	const populartime = props?.populartime;
	let isActive: boolean | undefined = props?.isActive;

	const bgContrast = useMyContrastColor(bgColor)

	const borderColor = isActive ? bgContrast : 'transparent';

	function renderDebug() {
		if (!isDebug) {
			return null;
		}

		return (
			<View style={{flexDirection: 'column', alignItems: 'center', borderColor: "red", borderWidth: 1}}>
				<Text>{populartime?.percentage+"%"}</Text>
			</View>
		)
	}

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
						<Text>{textBelow}</Text>
						{renderDebug()}
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
