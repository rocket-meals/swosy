import React, {FunctionComponent, useState} from 'react';
import {Icon, Text, View, useTextContrastColor, useViewBackgroundColor} from '@/components/Themed';
import {ActionsheetItem, ActionsheetItemText} from '@gluestack-ui/themed';
import {AccessibilityRole, TouchableOpacity} from 'react-native';
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from '@/helper/color/MyContrastColor';
import {useProjectColor} from '@/states/ProjectInfo';
import {IconNames} from '@/constants/IconNames';

export interface SettingsRowProps {
    key?: any;
    children?: any;
    labelLeft: string,
    labelRight?: string | null,
    leftContent?: string | any,
    rightContent?: React.ReactNode,
    disabled?: boolean,
    leftIcon?: any | string,
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

const DEFAULT_PADDING = 12;
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const textColor = useTextContrastColor()
	const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
	const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
	const projectColor = useProjectColor()
	const projectColorContrast = useMyContrastColor(projectColor)

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

	/**
	return (
		<>
			<View style={{
				padding: DEFAULT_PADDING, width: '100%', justifyContent: 'center', alignItems: 'center'
			}}>
				<Text>{item.label}</Text>
			</View>

		</>
	)
	*/

	function renderRightContent(showPress: boolean): React.ReactNode {
		const rightIcon = props?.rightIcon
		const rightContent = props?.rightContent
		if (rightContent) {
			return rightContent;
		}

		let content:any = null;

		if (showPress && !rightIcon) {
			content = <Icon name={IconNames.chevron_right_icon} />;
		}
		if (rightIcon) {
			content = <Icon name={rightIcon} />
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

	const isActive = false
	const usedViewBackgroundColor = isActive ? projectColor : viewBackgroundColor;
	const usedTextColor = isActive ? projectColorContrast : textColor;



	let renderedLeftIcon = <Icon color={textColor} name={item.icon} />
	if (isActive) {
		renderedLeftIcon = <Icon color={projectColorContrast} name={item.icon} />
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

	if(performance){
		return (
			<>
				<TouchableOpacity
					style={{
						padding: props.padding || DEFAULT_PADDING,
						backgroundColor: isHovered ? lighterOrDarkerBackgroundColor : usedViewBackgroundColor,
					}}
					accessibilityLabel={item.accessibilityLabel}
					onPress={item.onSelect}
					key={item.key}
					activeOpacity={0.6}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					<ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
					{content}
					{renderRightContent(!!item.onSelect)}
				</TouchableOpacity>
				{/* Your rendered children go here */}
			</>
		);
	} else {
		return (
			<>
				<ActionsheetItem
					padding={props.padding || DEFAULT_PADDING}
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
