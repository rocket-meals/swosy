import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetItem,
	ActionsheetItemText
} from '@gluestack-ui/themed';
import React from 'react';
import {DimensionValue} from 'react-native';
import {Heading, Icon, View, useTextContrastColor, useViewBackgroundColor} from '@/components/Themed';
import {useSyncStateRaw} from '@/helper/syncState/SyncState';
import {NonPersistentStore} from '@/helper/syncState/NonPersistentStore';
import {
	useLighterOrDarkerColorForSelection,
	useMyContrastColor
} from '@/helper/color/MyContrastColor';
import {useProjectColor} from '@/states/ProjectInfo';
import {PlatformHelper} from '@/helper/PlatformHelper';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {StringHelper} from '@/helper/string/StringHelper';
import {MyAccessibilityRoles} from '@/helper/accessibility/MyAccessibilityRoles';


export type MyGlobalActionSheetConfig = {
    visible: boolean,
    title: string,
    renderPreItemsContent?: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined,
    items?: MyGlobalActionSheetItem[],
    renderPostItemsContent?: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined
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

export const useMyGlobalActionSheet: () => [show: (config?: MyGlobalActionSheetConfig) => void, hide: () => void, showActionsheetConfig: MyGlobalActionSheetConfig, visible: boolean]
    = () => {
    	const [actionsheetConfigRaw, setActionsheetConfigRaw] = useSyncStateRaw<MyGlobalActionSheetConfig>(NonPersistentStore.globalMyActionSheetConfig)

    	let usedShowActionsheetConfig: MyGlobalActionSheetConfig = {
    		visible: false,
    		title: '',
    		items: []
    	}

    	if (actionsheetConfigRaw) {
    		usedShowActionsheetConfig = actionsheetConfigRaw
    	}

    	const setShowActionsheetConfig = (showActionsheetConfig: MyGlobalActionSheetConfig) => {
    		setActionsheetConfigRaw(showActionsheetConfig)
    	}

    	const show = (config?: MyGlobalActionSheetConfig) => {
    		setShowActionsheetConfig(config || {
    			visible: true,
    			title: '',
    			items: []
    		})
    	}

    	const hide = () => {
    		setShowActionsheetConfig({
    			visible: false,
    			title: '',
    			items: []
    		})
    	}

    	const visible = usedShowActionsheetConfig?.visible

    	return [
    		show,
    		hide,
    		usedShowActionsheetConfig,
    		visible
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

	const maxHeightDefault: DimensionValue = PlatformHelper.isWeb() ? '70%' : '80%'
	const maxHeight: DimensionValue = showActionsheetConfig.maxHeight || maxHeightDefault

	const title = showActionsheetConfig.title || ''

	const onCancel = async () => {
		const congifOnCancel = showActionsheetConfig.onCancel
		let cancelAllowed = true;
		if (congifOnCancel) {
			const cancelAllowedFromMethod = await congifOnCancel();
			if (cancelAllowedFromMethod===false) { // if the method returns false, we don't close the actionsheet otherwise we close it
				cancelAllowed = false;
			}
		}
		if (cancelAllowed) {
			hide()
		}
	}

	const renderedItems = []
	const renderedItemsForStringify = []

	if (showActionsheetConfig.items) {
		for (const item of showActionsheetConfig.items) {
			const isActive = item.active || false;

			let usedViewBackgroundColor: string = 'transparent';
			let usedTextColor = textColor;
			if (isActive && projectColor) {
				usedViewBackgroundColor = projectColor
				usedTextColor = projectColorContrast
			}
			if (!isActive && viewBackgroundColor) {
				usedViewBackgroundColor = viewBackgroundColor
				usedTextColor = lighterOrDarkerTextColor
			}

			const customRender = item.render;
			if (customRender) {
				renderedItems.push(
					customRender(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide)
				)
			} else {
				const checkboxIconName = isActive ? 'checkbox-blank-circle' : 'checkbox-blank-circle-outline'
				const renderedCheckboxIcon = <Icon color={usedTextColor} name={checkboxIconName} />

				let renderedLeftIcon: any = <Icon color={usedTextColor} name={item.icon} />
				if (item.renderLeftIcon) {
					renderedLeftIcon = item.renderLeftIcon(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide)
				}

				let onSelectMethod: any = undefined
				if (item.onSelect) {
					onSelectMethod = async () => {
						if (item.onSelect) {
							await item.onSelect(item.key, hide)
						} else {
							hide()
						}
					}
				}

				renderedItems.push(
					<ActionsheetItem
						disabled={!item.onSelect}
						accessibilityRole={MyAccessibilityRoles.Radio}
						accessibilityLabel={item.accessibilityLabel}
						sx={{
							bg: usedViewBackgroundColor,
							':hover': {
								bg: lighterOrDarkerBackgroundColor,
							},
						}}
						key={item.key}
						onPress={onSelectMethod}
					>
						<ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
						<View style={{
							flex: 1
						}}
						>
							<ActionsheetItemText selectable={true}
								sx={{
									color: usedTextColor,
								}}
							>{item.label}
							</ActionsheetItemText>
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

	let content = []
	if (showActionsheetConfig.renderCustomContent) {
		content = showActionsheetConfig.renderCustomContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
	} else {
		let renderedPreItem = undefined
		if (showActionsheetConfig.renderPreItemsContent) {
			renderedPreItem = showActionsheetConfig.renderPreItemsContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
		}
		let renderedPostItem = undefined
		if (showActionsheetConfig.renderPostItemsContent) {
			renderedPostItem = showActionsheetConfig.renderPostItemsContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
		}


		content = (
			<MyScrollView>
				{renderedItems}
			</MyScrollView>
		)
	}

	let usedTitle = title; // We add a space to the title to make sure the title is not empty and the actionsheet is not too small
	if (!usedTitle) {
		usedTitle = StringHelper.EMPTY_SPACE
	}

	return (
		<Actionsheet isOpen={showActionsheet} onClose={onCancel} zIndex={999}>
			<ActionsheetBackdrop onPress={onCancel} />
			<ActionsheetContent
				maxHeight={maxHeight}
				zIndex={999}
				style={{
					backgroundColor: viewBackgroundColor,
					flexGrow: 1
				}}
			>
				<View style={{

				}}>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator
							style={{
								backgroundColor: textColor,
							}}
						/>
						<View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}><Heading>{usedTitle}</Heading></View>
					</ActionsheetDragIndicatorWrapper>
				</View>

				<View style={{
					width: "100%",
					flexGrow: 1, // werde so groß wie möglich
					flexShrink: 1 // aber lass them action sheet drag indicator platz
				}}>
					<MySafeAreaView>
						{content}
					</MySafeAreaView>
				</View>
			</ActionsheetContent>
		</Actionsheet>
	)
}
