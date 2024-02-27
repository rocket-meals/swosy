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
import {DimensionValue, KeyboardAvoidingView, Platform} from "react-native";
import {Heading, Icon, Text, useTextContrastColor, useViewBackgroundColor, View} from "@/components/Themed";
import {useSyncStateRaw} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {
    useLighterOrDarkerColorForSelection,
    useMyContrastColor
} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/states/ProjectInfo";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaView} from "@/components/MySafeAreaView";


export type MyGlobalActionSheetConfig = {
    visible: boolean,
    title: string,
    // description?: string,
    items?: MyGlobalActionSheetItem[],
    renderCustomContent?: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined,
    onCancel?: () => Promise<boolean>
    maxHeight?: DimensionValue
}

export type MyGlobalActionSheetItem = {
    key: string,
    label: string,
    accessibilityLabel: string,
    render?: (backgroundColor: string, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined,
    renderLeftIcon?: (backgroundColor: string, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined,
    icon?: string,
    active?: boolean,
    onSelect?: (key: string, hide: () => void) => void // return false to not close the actionsheet
    // onSelect: (key: string) => boolean | void // return true to close the actionsheet
}

export const useMyGlobalActionSheet: () => [show: (config?: MyGlobalActionSheetConfig) => void, hide: () => void, showActionsheetConfig: MyGlobalActionSheetConfig]
    = () => {
    const [actionsheetConfigRaw, setActionsheetConfigRaw] = useSyncStateRaw<MyGlobalActionSheetConfig>(NonPersistentStore.globalMyActionSheetConfig)

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

    const maxHeightDefault: DimensionValue = PlatformHelper.isWeb() ? "70%" : "80%"
    const maxHeight: DimensionValue = showActionsheetConfig.maxHeight || maxHeightDefault

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

            let usedViewBackgroundColor: string = "transparent";
            let usedTextColor = textColor;
            if(isActive && projectColor){
                usedViewBackgroundColor = projectColor
                usedTextColor = projectColorContrast
            }
            if(!isActive && viewBackgroundColor){
                usedViewBackgroundColor = viewBackgroundColor
                usedTextColor = lighterOrDarkerTextColor
            }

            const customRender = item.render;
            if(!!customRender){
                renderedItems.push(
                    customRender(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide)
                )
            } else {
                let checkboxIconName = isActive ? "checkbox-blank-circle" : "checkbox-blank-circle-outline"
                let renderedCheckboxIcon = <Icon color={usedTextColor} name={checkboxIconName} />

                let renderedLeftIcon: any = <Icon color={usedTextColor} name={item.icon} />
                if(!!item.renderLeftIcon){
                    renderedLeftIcon = item.renderLeftIcon(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide)
                }

                let onSelectMethod: any = undefined
                if(item.onSelect){
                    onSelectMethod = async () => {
                        if (!!item.onSelect) {
                            await item.onSelect(item.key, hide)
                        } else {
                            hide()
                        }
                    }
                }

                renderedItems.push(
                    <ActionsheetItem
                        disabled={!item.onSelect}
                        accessibilityLabel={item.accessibilityLabel}
                        sx={{
                            bg: usedViewBackgroundColor,
                            ":hover": {
                                bg: lighterOrDarkerBackgroundColor,
                            },
                        }}
                        key={item.key} onPress={onSelectMethod}>
                        <ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
                        <View style={{
                            flex: 1
                        }}>
                            <ActionsheetItemText selectable={true} sx={{
                                color: usedTextColor,
                            }}>{item.label}</ActionsheetItemText>
                        </View>
                        <ActionsheetItemText>{renderedCheckboxIcon}</ActionsheetItemText>
                    </ActionsheetItem>
                )
            }

            renderedItemsForStringify.push({
                key: item.key,
                label: item.label,
                icon: item.icon,
            })
        }
    }

    let content = undefined
    if(!!showActionsheetConfig.renderCustomContent){
        content = showActionsheetConfig.renderCustomContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
    } else {
        content = <MyScrollView>
            {renderedItems}
        </MyScrollView>
    }


    return (
            <Actionsheet isOpen={showActionsheet} onClose={onCancel} zIndex={999}
            >
                <ActionsheetBackdrop onPress={onCancel} />
                <ActionsheetContent
                    maxHeight={maxHeight}
                     zIndex={999}
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
                    <Heading>{title}</Heading>
                    <MySafeAreaView>
                        {content}
                    </MySafeAreaView>
                </ActionsheetContent>
            </Actionsheet>
    )
}