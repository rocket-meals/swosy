import React from 'react';
import {DrawerItem} from '@react-navigation/drawer';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {router} from 'expo-router';
import {CommonSystemActionHelper} from '@/helper/device/CommonSystemActionHelper';
import {getMyDrawerItemIcon} from '@/components/drawer/MyDrawerItemIcon';
import {getMyDrawerItemLabel} from '@/components/drawer/MyDrawerItemLabel';
import {useProjectColor} from '@/states/ProjectInfo';

export type MyDrawerCustomItemProps = {
    label: string,
    innerKey?: string | number,
    isFocused?: boolean,
    onPress?: () => void,
    onPressInternalRouteTo?: string, // TODO: check if we can use StaticRoutes or something like that?
    onPressExternalRouteTo?: string | undefined | null,
    drawerIcon?: (props: {focused: boolean, size: number, color: string}) => React.ReactNode,
    icon?: string,
    position?: number
}

export const getMyDrawerCustomItem = (customItem: MyDrawerCustomItemProps) => {
	return <MyDrawerCustomItem {...customItem} />
}

export const MyDrawerCustomItem = (customItem: MyDrawerCustomItemProps) => {
	const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)

	const projectColor = useProjectColor()

	// @ts-ignore
	let label = getMyDrawerItemLabel(customItem.label);
	const drawer_item_accessibility_label = translation_navigate_to + ' ' + customItem.label
	const key = customItem?.key || customItem?.label
	const isFocused = customItem.isFocused;
	const backgroundColor = isFocused ? projectColor : undefined

	let onPress: any = undefined;
	if (customItem.onPress) {
		onPress = customItem.onPress;
	}

	let asLink = false;
	let to = undefined

	if (!onPress) {
		if (customItem.onPressInternalRouteTo) {
			onPress = () => {
				console.log('Route to: '+customItem.onPressInternalRouteTo)
				// @ts-ignore TODO: test if Href if working here
				router.navigate(customItem.onPressInternalRouteTo)
			};
		}

		const externalHref = customItem.onPressExternalRouteTo
		if (externalHref) {
			to = externalHref
			label += ' (External) '+externalHref
			asLink = true;
			onPress = () => {
				CommonSystemActionHelper.openExternalURL(externalHref, true);
			};
		}
	}

	let renderIcon: (props: {focused: boolean, size: number, color: string}) => React.ReactNode = getMyDrawerItemIcon(customItem.icon)
	if (!customItem.icon && !!customItem.drawerIcon) {
		renderIcon = customItem.drawerIcon
	}

	return (
		<DrawerItem to={to} accessibilityLabel={drawer_item_accessibility_label} label={label} key={key} focused={isFocused} onPress={onPress} style={{backgroundColor: backgroundColor}} icon={renderIcon}/>
	);
}