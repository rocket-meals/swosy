import React, {FunctionComponent, useState} from 'react';
import {Icon, Text, View, useTextContrastColor, useViewBackgroundColor} from '@/components/Themed';
import {ActionsheetItem, ActionsheetItemText} from '@gluestack-ui/themed';
import {AccessibilityRole, TouchableOpacity} from 'react-native';
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from '@/helper/color/MyContrastColor';
import {useProjectColor} from '@/states/ProjectInfo';
import {IconNames} from '@/constants/IconNames';
import {MyActionsheetItem} from "@/components/settings/MyActionsheetItem";

export interface SettingsRowProps {
    key?: any;
    children?: any;
    labelLeft: string,
    labelRight?: string | null,
    leftContent?: string | any,
    rightContent?: React.ReactNode,
	active?: boolean,
    disabled?: boolean,
    leftIcon?: any | string,
	iconLeftCustom?: React.ReactNode,
    rightIcon?: string,
    onPress?: any,
	padding?: number | undefined
    color?: any
    hideLeftContent?: boolean,
    expandable?: boolean,
    expanded?: boolean,
    customDivider?: any,
    accessibilityLabel: string,
    accessibilityRole?: AccessibilityRole | undefined,
    accessibilityState?: any,
    flex?: number,
    shadeLevel?: number
}

export const SETTINGS_ROW_DEFAULT_PADDING = 12;
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const textColor = useTextContrastColor()
	const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
	const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
	const projectColor = useProjectColor()
	const projectColorContrast = useMyContrastColor(projectColor)
	const isActive = props.active || false;

	const [isHovered, setIsHovered] = useState(false);

	// Function to handle mouse enter event
	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	// Function to handle mouse leave event
	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const item = {
		key: props?.key,
		icon: props.leftIcon,
		label: props.labelLeft,
		accessibilityLabel: props.accessibilityLabel,
		onSelect: props.onPress,
		leftIcon: props.leftIcon,
	}

	const ultraPerformance = false

	if(ultraPerformance) {
		return (
			<>
				<View style={{
					padding: SETTINGS_ROW_DEFAULT_PADDING, width: '100%', justifyContent: 'center', alignItems: 'center'
				}}>
					<Text>{item.label}</Text>
				</View>

			</>
		)
	}

	function renderRightContent(showPress: boolean): React.ReactNode {
		const rightIcon = props?.rightIcon
		const rightContent = props?.rightContent
		if (rightContent) {
			return rightContent;
		}

		let content:any = null;

		if (showPress && !rightIcon) {
			content = <Icon style={{color: usedTextColor}} name={IconNames.chevron_right_icon} />;
		}
		if (rightIcon) {
			content = <Icon style={{color: usedTextColor}} name={rightIcon} />
		}

		return (
			<ActionsheetItemText selectable={true}
				sx={{
					color: usedTextColor,
				}}
			>{content}
			</ActionsheetItemText>
		)
	}

	const usedViewBackgroundColor = isActive ? projectColor : viewBackgroundColor;
	const usedTextColor = isActive ? projectColorContrast : textColor;



	let renderedLeftIcon: any = <Icon style={{color: usedTextColor}} name={item.icon} />
	if(props.iconLeftCustom){
		renderedLeftIcon = props.iconLeftCustom
	}

	const expanded = props.expanded;
	const children = props.children;

	let renderedChildren = null;
	if (expanded) {
		renderedChildren = children;
	}

	const contentWithShrinkingSpaceOnlyRight = (
		<View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
			<View style={{
			}}
			>
				<Text style={{ color: usedTextColor }}>{item.label}</Text>
			</View>
			<View style={{
				flexShrink: 1,
			}}
			>
				<Text style={{ color: usedTextColor, textAlign: 'right' }}>{props.labelRight}</Text>
			</View>
		</View>
	)

	const content = contentWithShrinkingSpaceOnlyRight;

	const performance = true;

	const renderLeftIcon = (icon: any) => {
		return <View style={{
			paddingLeft: 8,
			paddingRight: 8,
		}}>
			{icon}
		</View>
	}

	if(performance){
		return (
			<>
				<MyActionsheetItem
					disabled={!item.onSelect || props.disabled}
					accessibilityLabel={item.accessibilityLabel}
					onPress={item.onSelect}
					active={isActive}
					key={item.key}
				>
					{renderLeftIcon(renderedLeftIcon)}
					{content}
					{renderRightContent(!!item.onSelect)}
				</MyActionsheetItem>
				{/* Your rendered children go here */}
			</>
		);
	} else {
		return (
			<>
				<ActionsheetItem
					padding={props.padding || SETTINGS_ROW_DEFAULT_PADDING}
					disabled={!item.onSelect || props.disabled}
					accessibilityLabel={item.accessibilityLabel}
					sx={{
						bg: usedViewBackgroundColor,
						':hover': {
							bg: lighterOrDarkerBackgroundColor,
						},
					}}
					key={item.key}
					onPress={item.onSelect}
				>
					<ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
					{content}
					{renderRightContent(!!item.onSelect)}
				</ActionsheetItem>
				{renderedChildren}
			</>
		)
	}



}
