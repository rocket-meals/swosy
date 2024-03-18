import {MyCardWithText, MyCardWithTextProps} from '@/components/card/MyCardWithText';
import {DirectusFiles} from '@/helper/database/databaseTypes/types';
import {Rectangle} from '@/components/shapes/Rectangle';
import React, {ReactNode} from 'react';
import {View, Text} from '@/components/Themed';
import ImageWithComponents from "@/components/project/ImageWithComponents";
import {MyButton} from "@/components/buttons/MyButton";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {IconNames} from "@/constants/IconNames";
import {PermissionHelper} from "@/helper/permission/PermissionHelper";
import {
	MyGlobalActionSheetConfig,
	MyGlobalActionSheetItem,
	useMyGlobalActionSheet
} from "@/components/actionsheet/MyGlobalActionSheet";
import {useMyActionSheetConfigConfirmer} from "@/components/actionsheet/usePredefinedActionSheetConfigs";

export type MyCardForResourcesWithImageProps = {
    accessibilityLabel: string,
    thumbHash?: string | undefined | null,
    onPress?: () => void,
    assetId?: string | DirectusFiles | undefined | null,
    image_url?: string | undefined | null,
    imageHeight?: number,
    bottomRightComponent?: ReactNode,
    topRightComponent?: ReactNode,
    bottomLeftComponent?: ReactNode,
    topLeftComponent?: ReactNode,
    innerPadding?: number,
	imageUploaderConfig?: ImageUploaderComponentProps
} & MyCardWithTextProps

export type ImageUploaderComponentProps = {
	resourceId: string | number
	resourceCollectionName: string
}
function ImageUploaderComponent(props: ImageUploaderComponentProps) {
	const accessibilityLabel = 'Edit image';

	const canUpdateImageField = PermissionHelper.useCanUpdate(props.resourceCollectionName, 'image');
	const canUpdateImageRemoteUrlField = PermissionHelper.useCanUpdate(props.resourceCollectionName, 'image_remote_url');

	// DirectusFiles
	const canCreateFile = PermissionHelper.useCanCreate('directus_files', 'file');

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet();

	function handleUploadImage() {
		console.log('upload image');
	}

	function handleDeleteImage() {
		console.log('delete image');
	}

	const configDelete: MyGlobalActionSheetConfig = useMyActionSheetConfigConfirmer({
		renderPreItemsContent: () => {
			return <View style={{
				width: '100%',
				padding: 20,
			}}>
				<Text>{"Are you sure you want to delete the image?"}</Text>
			</View>
		},
		onConfirm: async () => {
			handleDeleteImage()
			return true
		},
		onCancel: async () => {
			return false
		}
	})

	const hasPermission = canUpdateImageField || canUpdateImageRemoteUrlField || canCreateFile;

	if(!hasPermission){
		return null;
	}


	const items: MyGlobalActionSheetItem[] = [
		{
			key: 'change_image',
			label: 'Change image',
			accessibilityLabel: 'Change image',
			icon: IconNames.upload_icon,
			onSelect: (key, hide) => {
				console.log('change image');
				return true;
			}
		},
		{
			key: 'delete_image',
			label: 'Delete image',
			accessibilityLabel: 'Delete image',
			icon: IconNames.delete_icon,
			onSelect: (key, hide) => {
				show(configDelete);
				return true;
			}
		},
		{
			key: 'cancel',
			icon: IconNames.cancel_icon,
			label: 'Cancel',
			accessibilityLabel: 'Cancel',
			onSelect: (key, hide) => {
				hide();
				return true;
			}
		}
		]

	return <View style={{
		width: '100%',
		height: '100%',
	}}>
		<Text>{"image: "+canUpdateImageField}</Text>
		<Text>{"image_remote_url: "+canUpdateImageRemoteUrlField}</Text>
		<Text>{"file: "+canCreateFile}</Text>
		<MyButton
			borderRadius={MyCardDefaultBorderRadius}
			onPress={() => {
				show({
					visible: true,
					title: 'Image',
					items: items
				})
			}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={IconNames.change_image_icon} />
	</View>
}

// define the button component
export const MyCardForResourcesWithImage = ({heading, accessibilityLabel, assetId, onPress, image_url, thumbHash, imageHeight, ...props}: MyCardForResourcesWithImageProps) => {

	const imageUploaderConfig = props.imageUploaderConfig;
	const imageUploader = imageUploaderConfig ? <ImageUploaderComponent {...imageUploaderConfig} /> : null;

	const topLeftComponent = <>
		{props.topLeftComponent}
		{imageUploader}
	</>

	const topContent = (
		<Rectangle>
			<ImageWithComponents image={{
				image_url: image_url,
				assetId: assetId,
				thumbHash: thumbHash,
			}} accesibilityLabel={accessibilityLabel}
								 topRightComponent={props.topRightComponent}
								 bottomRightComponent={props.bottomRightComponent}
								 bottomLeftComponent={props.bottomLeftComponent}
								 topLeftComponent={topLeftComponent}
				onPress={onPress}
			/>
		</Rectangle>
	)

	return (
		<MyCardWithText topComponent={topContent} heading={heading} {...props} />
	)
}