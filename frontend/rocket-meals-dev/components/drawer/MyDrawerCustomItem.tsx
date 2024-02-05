import React from "react";
import {DrawerItem} from "@react-navigation/drawer";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {router} from "expo-router";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {getMyDrawerItemIcon} from "@/components/drawer/MyDrawerItemIcon";
import {getMyDrawerItemLabel} from "@/components/drawer/MyDrawerItemLabel";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";

export type MyDrawerCustomItemProps = {
    label: string,
    key?: string | number,
    isFocused?: boolean,
    onPress?: () => void,
    onPressInternalRouteTo?: string, // TODO: check if we can use StaticRoutes or something like that?
    onPressExternalRouteTo?: string,
    drawerIcon?: (props: {focused: boolean, size: number, color: string}) => React.ReactNode,
    icon?: string,
    position?: number
}

export const getMyDrawerCustomItem = (customItem: MyDrawerCustomItemProps) => {
    return <MyDrawerCustomItem {...customItem} />
}

export const MyDrawerCustomItem = (customItem: MyDrawerCustomItemProps) => {
    const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)

    let projectColor = useProjectColor()

    // @ts-ignore
    const label = getMyDrawerItemLabel(customItem.label);
    const drawer_item_accessibility_label = translation_navigate_to + " " + customItem.label
    const key = customItem?.key || customItem?.label
    const isFocused = customItem.isFocused;
    let backgroundColor = isFocused ? projectColor : undefined

    let onPress: any = undefined;
    if(!!customItem.onPress){
        onPress = customItem.onPress;
    }

    if(!onPress){
        if(customItem.onPressInternalRouteTo){
            onPress = () => {
                console.log("Route to: "+customItem.onPressInternalRouteTo)
                // @ts-ignore TODO: test if Href if working here
                router.navigate(customItem.onPressInternalRouteTo)
            };
        }
        if(customItem.onPressExternalRouteTo){
            onPress = () => {
                CommonSystemActionHelper.openExternalURL(customItem.onPressExternalRouteTo);
            };
        }
    }

    let renderIcon: (props: {focused: boolean, size: number, color: string}) => React.ReactNode = getMyDrawerItemIcon(customItem.icon)
    if(!customItem.icon && !!customItem.drawerIcon){
        renderIcon = customItem.drawerIcon
    }

    return (
        <DrawerItem accessibilityLabel={drawer_item_accessibility_label} label={label} key={key} focused={isFocused} onPress={onPress} style={{backgroundColor: backgroundColor}} icon={renderIcon}/>
    );
}