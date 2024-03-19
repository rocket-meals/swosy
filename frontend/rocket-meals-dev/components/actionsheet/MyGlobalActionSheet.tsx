import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	ActionsheetItem,
	ActionsheetItemText
} from '@gluestack-ui/themed';
import React, {useEffect, useState} from 'react';
import {DimensionValue, FlatListProps, TouchableOpacity} from 'react-native';
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
import { Spinner } from "@gluestack-ui/themed"
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";

export type RenderCustomContent = (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => React.ReactNode | undefined
export type MyGlobalActionSheetConfig = {
    visible: boolean,
    title: string,
    renderPreItemsContent?: RenderCustomContent,
    items?: MyGlobalActionSheetItem[],
    renderPostItemsContent?: RenderCustomContent,
    renderCustomContent?: RenderCustomContent,
    onCancel?: () => Promise<boolean>
    maxHeight?: DimensionValue
}

export type MyGlobalActionSheetItem = {
    key: string,
    label: string,
    accessibilityLabel: string,
    render?: RenderCustomContent
    renderLeftIcon?: RenderCustomContent
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

const MyGlobalActionSheetItem = ({item}: {item: MyGlobalActionSheetItem}) => {
	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
	const viewBackgroundColor = useViewBackgroundColor()
	const textColor = useTextContrastColor()
	const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
	const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
	const projectColor = useProjectColor()
	const projectColorContrast = useMyContrastColor(projectColor)

	let onSelectMethod = undefined;
	if (item.onSelect) {
		onSelectMethod = async () => {
			await item.onSelect(item.key, hide);
		};
	}

	const [isHovered, setIsHovered] = useState(false);

	// Function to handle mouse enter event
	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	// Function to handle mouse leave event
	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const isActive = item.active || false;
	let usedViewBackgroundColor = 'transparent';
	let usedTextColor = textColor;
	if (isActive && projectColor) {
		usedViewBackgroundColor = projectColor;
		usedTextColor = projectColorContrast;
	} else if (!isActive && viewBackgroundColor) {
		usedViewBackgroundColor = viewBackgroundColor;
		usedTextColor = lighterOrDarkerTextColor;
	}

	let renderedLeftIcon = item.renderLeftIcon ? item.renderLeftIcon(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide) : <Icon color={usedTextColor} name={item.icon} />;

	let content = item.render ? item.render(usedViewBackgroundColor, lighterOrDarkerBackgroundColor, usedTextColor, lighterOrDarkerTextColor, hide) : (
		<TouchableOpacity
			style={{
				minHeight: 50,
				width: '100%',
				flexDirection: 'row',
				alignItems: 'center',
				padding: 10,
				backgroundColor: isHovered ? lighterOrDarkerBackgroundColor : usedViewBackgroundColor,
			}}
			accessibilityLabel={item.accessibilityLabel}
			onPress={onSelectMethod}
			activeOpacity={0.6}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<ActionsheetItemText>{renderedLeftIcon}</ActionsheetItemText>
			<View style={{ flex: 1 }}>
				<ActionsheetItemText selectable={true}
									 sx={{
										 color: usedTextColor,
									 }}
				>{item.label}</ActionsheetItemText>
			</View>
			<ActionsheetItemText>{<Icon color={usedTextColor} name={item.active ? 'checkbox-blank-circle' : 'checkbox-blank-circle-outline'} />}</ActionsheetItemText>
		</TouchableOpacity>
	);
	return content;
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

	let flatListData = showActionsheetConfig.items?.map(item => {
		return {
			...item,
		};
	});

	const renderItem = ({ item }) => {
		return (
			<MyGlobalActionSheetItem item={item} />
		);
	};

	let content: any = undefined
	if (showActionsheetConfig.renderCustomContent) {
		content = showActionsheetConfig.renderCustomContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
	} else {
		let renderedPreItem: any = undefined
		if (showActionsheetConfig.renderPreItemsContent) {
			renderedPreItem = showActionsheetConfig.renderPreItemsContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
		}
		let renderedPostItem: any = undefined
		if (showActionsheetConfig.renderPostItemsContent) {
			renderedPostItem = showActionsheetConfig.renderPostItemsContent(viewBackgroundColor, lighterOrDarkerBackgroundColor, textColor, lighterOrDarkerTextColor, hide)
		}

		content = (
			<MyGridFlatList
				data={flatListData}
				renderItem={renderItem}
				keyExtractor={item => item.key}
				flatListProps={{
					ListHeaderComponent: renderedPreItem,
					ListFooterComponent: renderedPostItem,
				}}
				amountColumns={1}
			/>
		)
	}

	let usedTitle = title; // We add a space to the title to make sure the title is not empty and the actionsheet is not too small
	if (!usedTitle) {
		usedTitle = StringHelper.EMPTY_SPACE
	}

	useEffect(() => {
		if (!showActionsheet) {
			setDisplayContent(false)
		}
	}, [showActionsheetConfig]);

	const [displayContent, setDisplayContent] = useState(false);

	let renderedContent = content;

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
					width: "100%",
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
						{renderedContent}
					</MySafeAreaView>
				</View>
			</ActionsheetContent>
		</Actionsheet>
	)
}
