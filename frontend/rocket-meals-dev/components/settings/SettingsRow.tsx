import React, {FunctionComponent} from 'react';
import {Icon, Text, View, useTextContrastColor, useViewBackgroundColor} from '@/components/Themed';
import {ActionsheetItem, ActionsheetItemText} from '@gluestack-ui/themed';
import {AccessibilityRole} from 'react-native';
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
	padding?: number
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
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const textColor = useTextContrastColor()
	const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
	const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
	const projectColor = useProjectColor()
	const projectColorContrast = useMyContrastColor(projectColor)

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

	const item = {
		key: props?.key,
		icon: props.leftIcon,
		label: props.labelLeft,
		accessibilityLabel: props.accessibilityLabel,
		onSelect: props.onPress,
		leftIcon: props.leftIcon,
	}

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

	const contentWithShrinkingSpace = (
		<View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
			<View style={{
				flexShrink: 1,
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

	const contentWithWrap = (
		<View style={{
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between', // This will align the first child left and the last child right
			flex: 1
		}}
		>
			<View style={{
				// The red view
				flexShrink: 1,
				//marginRight: 'auto', // This ensures that the view stays left
			}}
			>
				<Text style={{ color: usedTextColor }}>{item.label}</Text>
			</View>
			<View style={{
				flexShrink: 1,
				// The blue view
				//marginLeft: 'auto', // This ensures that the view stays right
			}}
			>
				<Text style={{ color: usedTextColor, textAlign: 'right'
				}}
				>{props.labelRight}
				</Text>
			</View>
		</View>
	)

	const content = contentWithShrinkingSpaceOnlyRight;

	return (
		<>
			<ActionsheetItem
				padding={props.padding}
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
