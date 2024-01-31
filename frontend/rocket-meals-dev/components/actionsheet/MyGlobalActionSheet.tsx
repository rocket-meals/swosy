// The component to handle SSO login links


import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetIcon,
    ActionsheetItem,
    ActionsheetItemText, Divider
} from "@gluestack-ui/themed";
import React from "react";
import {KeyboardAvoidingView, Platform} from "react-native";
import {Icon, Text, useTextContrastColor, useViewBackgroundColor, View} from "@/components/Themed";
import {useSyncStateRaw} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {
    useLighterOrDarkerColorForSelection,
    useMyContrastColor
} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";


export type MyGlobalActionSheetConfig = {
    visible: boolean,
    title: string,
    // description?: string,
    items: MyGlobalActionSheetItem[]
    onCancel?: any
}

export type MyGlobalActionSheetItem = {
    key: string,
    label: string,
    accessibilityLabel: string,
    // disabled?: boolean,
    // renderContent?: (onSelect: any) => any,
    icon?: string,
    active?: boolean,
    onSelect?: (key: string) => Promise<boolean | void> // return false to not close the actionsheet
    // onSelect: (key: string) => boolean | void // return true to close the actionsheet
}

export const useMyGlobalActionSheet: () => [show: (config?: MyGlobalActionSheetConfig) => void, hide: () => void, showActionsheetConfig: MyGlobalActionSheetConfig]
    = () => {
    const [actionsheetConfigRaw, setActionsheetConfigRaw] = useSyncStateRaw<MyGlobalActionSheetConfig>(NonPersistentStore.globalMyActionSheetConfig)

    console.log("useMyGlobalActionSheet", actionsheetConfigRaw)

    let usedShowActionsheetConfig: MyGlobalActionSheetConfig = {
        visible: false,
        title: "",
        items: []
    }

    if(!!actionsheetConfigRaw){
        usedShowActionsheetConfig = actionsheetConfigRaw
    }

    const setShowActionsheetConfig = (showActionsheetConfig: MyGlobalActionSheetConfig) => {
        setActionsheetConfigRaw(showActionsheetConfig)
    }

    const show = (config?: MyGlobalActionSheetConfig) => {
        setShowActionsheetConfig(config || {
            visible: true,
            title: "",
            items: []
        })
    }

    const hide = () => {
        setShowActionsheetConfig({
            visible: false,
            title: "",
            items: []
        })
    }

    return [
        show,
        hide,
        usedShowActionsheetConfig
    ]
}

export const MyGlobalActionSheet = (props: any) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
    const viewBackgroundColor = useViewBackgroundColor()
    const textColor = useTextContrastColor()
    const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
    const projectColor = useProjectColor()
    const projectColorContrast = useMyContrastColor(projectColor)

    const showActionsheet = showActionsheetConfig.visible || false;

    let title = showActionsheetConfig.title || ""

    const onCancel = async () => {
        let congifOnCancel = showActionsheetConfig.onCancel
        let cancelAllowed = true;
        if(!!congifOnCancel){
            let cancelAllowedFromMethod = await congifOnCancel();
            if(cancelAllowedFromMethod===false){ // if the method returns false, we don't close the actionsheet otherwise we close it
                cancelAllowed = false;
            }
        }
        if(cancelAllowed){
            hide()
        }
    }

    let renderedItems = []
    let renderedItemsForStringify = []

    if(!!showActionsheetConfig.items){
        for(let item of showActionsheetConfig.items) {
            let isActive = item.active || false;

            const usedViewBackgroundColor = isActive ? projectColor : viewBackgroundColor;
            let usedTextColor = isActive ? projectColorContrast : textColor;

            let renderedCheckboxIcon = <Icon color={textColor} name={"checkbox-blank-circle-outline"} />
            if(isActive){
                renderedCheckboxIcon = <Icon color={projectColorContrast} name={"checkbox-blank-circle"} />
            }

            let renderedLeftIcon = <Icon color={textColor} name={item.icon} />
            if(isActive){
                renderedLeftIcon = <Icon color={projectColorContrast} name={item.icon} />
            }

            renderedItems.push(
                <ActionsheetItem
                    accessibilityLabel={item.accessibilityLabel}
                    sx={{
                        bg: usedViewBackgroundColor,
                        ":hover": {
                            bg: lighterOrDarkerBackgroundColor,
                        },
                    }}
                    key={item.key} onPress={async () => {
                    let closeActionsheet = true;
                    if (!!item.onSelect) {
                        let onSelectResult = await item.onSelect(item.key)
                        if (onSelectResult === false) {
                            closeActionsheet = false;
                        }
                    }
                    if (closeActionsheet) {
                        hide()
                    }
                }}>
                    <ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
                    <View style={{
                        flex: 1
                    }}>
                        <ActionsheetItemText sx={{
                            color: usedTextColor,
                            ":hover": {
                                color: "red",
                            },
                        }}>{item.label}</ActionsheetItemText>
                    </View>
                    <ActionsheetItemText>{renderedCheckboxIcon}</ActionsheetItemText>
                </ActionsheetItem>
            )
            renderedItems.push(
                <Divider key={"divider"+item.key} />
            )

            renderedItemsForStringify.push({
                key: item.key,
                label: item.label,
                icon: item.icon,
            })
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Actionsheet isOpen={showActionsheet} onClose={onCancel} zIndex={999}>
                <ActionsheetBackdrop onPress={onCancel} />
                <ActionsheetContent h="$72" zIndex={999}
                    style={{
                        backgroundColor: viewBackgroundColor,
                    }}
                >
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator
                            style={{
                                backgroundColor: textColor,
                            }}
                        />
                    </ActionsheetDragIndicatorWrapper>
                    <Text>{title}</Text>
                    {renderedItems}
                </ActionsheetContent>
            </Actionsheet>
        </KeyboardAvoidingView>
    )
}