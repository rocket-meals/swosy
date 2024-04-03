import {Icon, Text, View} from '@/components/Themed';
import React, {useState} from 'react';
import {Tooltip, TooltipContent, TooltipText} from '@gluestack-ui/themed';
import {StyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import {Pressable, ViewStyle} from 'react-native';
import {MyNewButtonProps} from '@/components/buttons/MyButton';
import {PlatformHelper} from '@/helper/PlatformHelper';
import {useIsDebug} from '@/states/Debug';
import {CommonSystemActionHelper} from '@/helper/device/CommonSystemActionHelper';
import {MyAccessibilityRoles} from '@/helper/accessibility/MyAccessibilityRoles';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const BUTTON_DEFAULT_Padding = 12;
export const BUTTON_DEFAULT_BorderRadius = BUTTON_DEFAULT_Padding/2

export type MyNewButtonPropsCustom = {
    activeBackgroundColor?: string,
    activeTextColor?: string,
    activeHoveredBackgroundColor?: string,
    activeHoveredTextColor?: string,
    inactiveBackgroundColor?: string,
    inactiveTextColor?: string,
    inactiveHoveredBackgroundColor?: string,
    inactiveHoveredTextColor?: string,
    activeBorderColor?: string,
    inactiveBorderColor?: string,
} & MyNewButtonProps // TODO change this to merge with MyButton
export const MyButtonCustom = ({centerItems, icon, isActive, borderBottomRadius, borderTopRadius, borderLeftRadius, borderRightRadius, tooltip, disabled, leftIconColoredBox, onPress, accessibilityLabel, text, leftIcon, activeBorderColor, inactiveBorderColor, leftIconActive, rightIcon, rightIconActive, useOnlyNecessarySpace, activeHoveredBackgroundColor, inactiveHoveredBackgroundColor, activeHoveredTextColor, inactiveHoveredTextColor, inactiveBackgroundColor, inactiveTextColor, activeTextColor, activeBackgroundColor, borderRadius, href, accessibilityRole, openHrefInNewTab}: MyNewButtonPropsCustom) => {
	const [hovered, setHovered] = useState<boolean>(false)
	const [isPressed, setIsPressed] = useState<boolean>(false)

	const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)

	const isDebug = useIsDebug()

	let usedViewBackgroundColor: string | undefined;
	let usedTextColor: string | undefined;
	let usedBorderColor: string | undefined;
	let usedIconBoxBackgroundColor: string | undefined;
	let usedIconBoxTextColor: string | undefined;

	if (isActive) {
		if (hovered) {
			usedViewBackgroundColor = activeHoveredBackgroundColor
			usedTextColor = activeHoveredTextColor
			usedIconBoxBackgroundColor = activeHoveredBackgroundColor
			usedIconBoxTextColor = activeHoveredTextColor
		} else {
			usedViewBackgroundColor = activeBackgroundColor
			usedTextColor = activeTextColor
			usedIconBoxBackgroundColor = activeBackgroundColor
			usedIconBoxTextColor = activeTextColor
		}
		usedBorderColor = activeBorderColor
	} else {
		if (hovered) {
			usedViewBackgroundColor = inactiveHoveredBackgroundColor
			usedTextColor = inactiveHoveredTextColor
			usedIconBoxBackgroundColor = inactiveHoveredBackgroundColor
			usedIconBoxTextColor = inactiveHoveredTextColor
		} else {
			usedViewBackgroundColor = inactiveBackgroundColor
			usedTextColor = inactiveTextColor

			// only used for leftIconColoredBox shall be the active color used
			if (leftIconColoredBox) {
				usedIconBoxBackgroundColor = activeBackgroundColor
				usedIconBoxTextColor = activeTextColor
			} else {
				usedIconBoxBackgroundColor = inactiveBackgroundColor
				usedIconBoxTextColor = inactiveTextColor
			}
		}
		usedBorderColor = inactiveBorderColor
	}

	if (isDebug) {
		usedBorderColor = 'red'
	}


	let leftIconUsed = leftIcon;
	if (isActive && leftIconActive) {
		leftIconUsed = leftIconActive
	}
	let rightIconUsed = rightIcon;
	if (isActive && rightIconActive) {
		rightIconUsed = rightIconActive
	}

	const defaultInnerStyle: StyleProp<ViewStyle> = {
		flexDirection: 'row',
	}


	const usedInnerViewStyle: StyleProp<ViewStyle> = [defaultInnerStyle]

	const pressedStyle: StyleProp<ViewStyle> = {
		opacity: isPressed ? 0.5 : 1,
	}


	const disabledStyle: StyleProp<ViewStyle> = {
		// @ts-ignore // This is a valid style on web
		cursor: disabled ? 'not-allowed' : 'pointer',
		opacity: disabled ? 0.5 : 1,
	}


	const leftIconPaddingRight = BUTTON_DEFAULT_Padding
	const leftIconPaddingLeft = BUTTON_DEFAULT_Padding

	const leftIconViewStyle: StyleProp<ViewStyle> = {
		backgroundColor: leftIconColoredBox ? usedIconBoxBackgroundColor : undefined,
		paddingRight: leftIconPaddingRight,
		paddingLeft: leftIconPaddingLeft,
		paddingVertical: BUTTON_DEFAULT_Padding,
		justifyContent: 'center',
	}

	let leftItem: any = undefined
	if (leftIcon) {
		leftItem = (
			<View style={leftIconViewStyle}>
				<Icon color={usedIconBoxTextColor} name={leftIconUsed} />
			</View>
		)
	}

	let renderedText: any = null;
	if (text) {
		renderedText = (
			<View style={{
				marginVertical: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				marginLeft: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				marginRight: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				flexDirection: 'row', flexWrap: 'wrap',

			}}
			>
				<Text style={{
					flexShrink: 1,
					color: usedTextColor,
				}}
				>{text}
				</Text>
			</View>
		)
	}

	if (icon) {
		renderedText = (
			<View style={{
				marginVertical: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				marginLeft: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				marginRight: BUTTON_DEFAULT_Padding, // https://stackoverflow.com/questions/37785345/how-to-get-flexbox-to-include-padding-in-calculations
				flexDirection: 'row', flexWrap: 'wrap',

			}}
			>
				<Icon name={icon} color={usedTextColor} />
			</View>
		)
	}

	const rightIconViewStyle: StyleProp<ViewStyle> = {
		paddingRight: leftIconPaddingRight,
		paddingLeft: (!!text || !!leftIcon) ? 0 : BUTTON_DEFAULT_Padding,
		paddingVertical: BUTTON_DEFAULT_Padding,
		justifyContent: 'center',
	}

	let rightItem: any = undefined
	if (rightIcon) {
		rightItem = (
			<View style={rightIconViewStyle}>
				<Icon color={usedIconBoxTextColor} name={rightIconUsed} />
			</View>
		)
	}

	const renderButton = (triggerProps: any) => {
		const usedOnPress = async () => {
			if (href) {
				if (PlatformHelper.isWeb()) {
					// on web we will use the
				} else {
					await CommonSystemActionHelper.openExternalURL(href, openHrefInNewTab);
				}
			}
			if (onPress) {
				await onPress()
			}
		}

		let usedAccessibilityRole = accessibilityRole || MyAccessibilityRoles.Button
		let usedAccessibilityLabel = accessibilityLabel
		if (href) {
			usedAccessibilityRole = MyAccessibilityRoles.Link
			usedAccessibilityLabel = translation_navigate_to + ': ' + accessibilityLabel
		}

		const renderedButton = (
			<Pressable
				{...triggerProps}
				disabled={disabled}
				onHoverIn={() => setHovered(true)}
				onHoverOut={() => setHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}

				accessibilityLabel={usedAccessibilityLabel}
				accessibilityRole={usedAccessibilityRole}

				style={
					[disabledStyle, pressedStyle, {
						borderColor: usedBorderColor,
						borderWidth: 1,
						backgroundColor: usedViewBackgroundColor,
						justifyContent: 'flex-start',
						alignSelf: useOnlyNecessarySpace ? 'flex-start' : undefined,
						overflow: 'hidden',
						borderRadius: borderRadius ?? BUTTON_DEFAULT_BorderRadius,
						borderBottomLeftRadius: borderLeftRadius ?? borderBottomRadius,
						borderTopLeftRadius: borderLeftRadius ?? borderTopRadius,
						borderBottomRightRadius: borderRightRadius ?? borderBottomRadius,
						borderTopRightRadius: borderRightRadius ?? borderTopRadius,
						flexDirection: 'row',
						//height: "100%",
						flexShrink: 1,
					}]
				}
				onPress={usedOnPress}
			>
				{leftItem}
				<View style={{
					justifyContent: 'center',
					alignItems: centerItems ? 'center' : 'flex-start',
					// and make sure the text gets wrapped if it is too long
					flexShrink: 1,
					flexGrow: PlatformHelper.isWeb() ? 1 : useOnlyNecessarySpace ? 0 : 1,
				}}
				>
					{renderedText}
				</View>
				{rightItem}
			</Pressable>
		)

		if (PlatformHelper.isWeb() && href) {
			return (
				<a href={href} target={openHrefInNewTab ? '_blank' : '_self'} style={{textDecoration: 'none'}} rel="noreferrer">
					{renderedButton}
				</a>
			)
		} else {
			return renderedButton
		}
	}

	if (tooltip) {
		return (
			<Tooltip

				placement="top"
				trigger={(triggerProps) => {
					return renderButton(triggerProps)
				}}
			>
				<TooltipContent style={{
				}}>
					<TooltipText>{tooltip}</TooltipText>
				</TooltipContent>
			</Tooltip>
		)
	} else {
		return renderButton({})
	}
}