// The component to handle SSO login links


import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetIcon,
    ActionsheetItem,
    ActionsheetItemText
} from "@gluestack-ui/themed";
import React from "react";
import {KeyboardAvoidingView, Platform} from "react-native";
import {Icon, Text} from "@/components/Themed";
import {useSyncStateRaw} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";


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
    // disabled?: boolean,
    // renderContent?: (onSelect: any) => any,
    icon?: string,
    onSelect?: (key: string) => Promise<boolean | void> // return false to not close the actionsheet
    // onSelect: (key: string) => boolean | void // return true to close the actionsheet
}

export const useMyGlobalActionSheet = () => {
    const [showActionsheetConfigRaw, setShowActionsheetConfigRaw] = useSyncStateRaw<MyGlobalActionSheetConfig>(NonPersistentStore.globalMyActionSheetConfig)

    console.log("useMyGlobalActionSheet", showActionsheetConfigRaw)

    let usedShowActionsheetConfig: MyGlobalActionSheetConfig = {
        visible: false,
        title: "",
        items: []
    }

    if(!!showActionsheetConfigRaw){
        usedShowActionsheetConfig = showActionsheetConfigRaw
    }

    const setShowActionsheetConfig = (showActionsheetConfig: MyGlobalActionSheetConfig) => {
        setShowActionsheetConfigRaw(showActionsheetConfig)
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

export const MyGlobalActionSheet = (props) => {

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

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
            renderedItems.push(
                <ActionsheetItem key={item.key} onPress={async () => {
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
                    <ActionsheetIcon>
                        <Icon name={item.icon}/>
                    </ActionsheetIcon>
                    <ActionsheetItemText>{item.label}</ActionsheetItemText>
                </ActionsheetItem>
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
                <ActionsheetContent h="$72" zIndex={999}>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Text>{title}</Text>
                    {renderedItems}
                </ActionsheetContent>
            </Actionsheet>
        </KeyboardAvoidingView>
    )
}