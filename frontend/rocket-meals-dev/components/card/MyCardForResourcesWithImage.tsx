import {MyCardWithText, MyCardWithTextProps} from '@/components/card/MyCardWithText';
import {DirectusFiles} from '@/helper/database/databaseTypes/types';
import {Rectangle} from '@/components/shapes/Rectangle';
import React, {ReactNode} from 'react';
import {Spinner, Text, View} from '@/components/Themed';
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
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import * as ImagePicker from 'expo-image-picker';
import {ImagePickerAsset} from 'expo-image-picker';
import {PlatformHelper} from "@/helper/PlatformHelper";
import {ServerAPI} from "@/helper/database/server/ServerAPI";
import {updateField, updateFile, uploadFiles} from "@directus/sdk";
import {Platform} from "react-native";


export type MyCardForResourcesWithImageProps = {
    accessibilityLabel: string,
    thumbHash?: string | undefined | null,
	borderColor?: string,
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
	resourceCollectionName: string,
	onImageUpdated: () => void,
	aspect?: [number, number],
}
function ImageUploaderComponent(props: ImageUploaderComponentProps) {
	const onImageUpdated = props?.onImageUpdated;

	const [permissionForCamera, requestPermissionForCamera] = ImagePicker.useCameraPermissions();
	const [permissionForMediaLibrary, requestPermissionForMediaLibrary] = ImagePicker.useMediaLibraryPermissions();

	const translation_edit = useTranslation(TranslationKeys.edit);
	const translation_upload = useTranslation(TranslationKeys.upload);
	const translation_delete = useTranslation(TranslationKeys.delete);
	const translation_cancel = useTranslation(TranslationKeys.cancel);
	const translation_image = useTranslation(TranslationKeys.image);

	const translation_camera = useTranslation(TranslationKeys.camera);
	const translation_gallery = useTranslation(TranslationKeys.gallery);

	const title = translation_edit + " " + translation_image;

	const accessibilityLabel = title;

	const canUpdateImageField = PermissionHelper.useCanUpdate(props.resourceCollectionName, 'image');
	const canUpdateImageRemoteUrlField = PermissionHelper.useCanUpdate(props.resourceCollectionName, 'image_remote_url');

	// DirectusFiles
	const canCreateFile = PermissionHelper.useCanCreate('directus_files', 'file');

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet();

	const configErrorOnUpload: MyGlobalActionSheetConfig = useMyActionSheetConfigConfirmer({
		renderPreItemsContent: () => {
			return <View style={{
				width: '100%',
				padding: 20,
			}}>
				<Text>{"Error on upload"}</Text>
			</View>
		},
		onConfirm: async () => {
			return true
			hide()
		},
	})

	const pleaseWaitConfig: MyGlobalActionSheetConfig = {
		visible: true,
		title: "Please wait",
		renderCustomContent: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
			return <View style={{
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center',
				padding: 20,
			}}>
				<Text>{"Please wait"}</Text>
				<Spinner />
				<MyButton accessibilityLabel={"Dismiss"} onPress={() => {
					hide()
				} } />
			</View>
		}

	}

	async function handleSelectImageForUpload(useCamera: boolean) {
		try{
			const usedPermission = useCamera ? permissionForCamera : permissionForMediaLibrary;
			const usedGranted = usedPermission?.granted;
			const canRequest = usedPermission?.canAskAgain;

			const usedAspects = props.aspect || [4, 3];

			if (usedGranted) {
				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					aspect: usedAspects,
					quality: 1,
					// only 1
					selectionLimit: 1,
				});

				if (!result.canceled) {
					show(pleaseWaitConfig);
					const assets: ImagePickerAsset[] | null = result.assets;
					if (assets) {
						const asset = assets[0];
						const uri = asset.uri;

						const formData = new FormData();

						const file_name = props.resourceCollectionName + "_" + props.resourceId

						let fileSizes: number | undefined = undefined

						if(PlatformHelper.isWeb()){
							// https://github.com/expo/examples/blob/master/with-firebase-storage-upload/App.js
							// Why are we using XMLHttpRequest? See:
							// https://github.com/expo/expo/issues/2402#issuecomment-443726662
							const blob: Blob = await new Promise((resolve, reject) => {
								const xhr = new XMLHttpRequest();
								xhr.onload = function () {
									resolve(xhr.response);
								};
								xhr.onerror = function (e) {
									console.log(e);
									reject(new TypeError("Network request failed"));
								};
								xhr.responseType = "blob";
								xhr.open("GET", uri, true);
								xhr.send(null);
							});

							console.log("Web: blob size: "+blob.size);
							fileSizes = blob.size;
							formData.append('title', file_name);
							formData.append('image', blob);
						} else {
							// Form Upload for mobile generated by Copilot
							// get the file extension
							const uriParts = uri.split('.');
							const fileType = uriParts[uriParts.length - 1];
							const fileExtension = `.${fileType}`;
							// create the file
							const file = {
								uri,
								name: file_name + fileExtension,
								type: `image/${fileType}`,
							};
							formData.append('title', file_name);
							formData.append('image', file);

							// set the file size
							const response = await fetch(uri);
							const blob = await response.blob();
							// Sadly this Blob is not the same as the one from the web ...
							fileSizes = blob.size;
						}

						const client = ServerAPI.getClient();



						const resultFileUpload = await client.request(uploadFiles(formData));

						console.log("resultFileUpload");
						console.log(resultFileUpload);

						const file_id = resultFileUpload.id;

						// link the file to the resource
						const collectionHelper = new CollectionHelper(props.resourceCollectionName);
						let resultImageLinked = await collectionHelper.updateItem(props.resourceId, {
							image: file_id,
						})

						if (result) {
							if (onImageUpdated) {
								onImageUpdated()
							}
						}
					}

				} else {
				}
				hide()
			} else if (canRequest && !usedGranted) {
				if (useCamera) {
					await requestPermissionForCamera()
				} else {
					await requestPermissionForMediaLibrary()
				}
				handleSelectImageForUpload(useCamera)
			}
		} catch (e) {
			console.log("Error in handleSelectImageForUpload");
			console.log(e);
			show(configErrorOnUpload);
		}
	}

	async function handleDeleteImage() {
		console.log('delete image');
		const collectionHelper = new CollectionHelper(props.resourceCollectionName);
		show(pleaseWaitConfig);
		let result = await collectionHelper.updateItem(props.resourceId, {
			image: null,
			image_remote_url: null
		})
		hide()
		if (result) {
			if (onImageUpdated) {
				onImageUpdated()
			}
		}
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

	const items: MyGlobalActionSheetItem[] = []

	if(PlatformHelper.isSmartPhone()){
		items.push(
			{
				key: 'change_image_camera',
				label: translation_camera,
				accessibilityLabel: translation_camera+": "+translation_upload+": "+translation_image,
				icon: IconNames.camera_icon,
				onSelect: (key, hide) => {
					handleSelectImageForUpload(true)
				}
			}
		)
	}

	items.push(
		{
			key: 'change_image_gallery',
			label: translation_gallery,
			accessibilityLabel: translation_gallery+": "+translation_upload+": "+translation_image,
			icon: IconNames.gallery_icon,
			onSelect: (key, hide) => {
				handleSelectImageForUpload(false)
			}
		}
	)

	items.push(
		{
			key: 'delete_image',
			label: translation_delete,
			accessibilityLabel: translation_delete+": "+translation_image,
			icon: IconNames.delete_icon,
			onSelect: (key, hide) => {
				show(configDelete);
				return true;
			}
		}
	)
	items.push(
		{
			key: 'cancel',
			icon: IconNames.cancel_icon,
			label: translation_cancel,
			accessibilityLabel: translation_cancel,
			onSelect: (key, hide) => {
				hide();
				return true;
			}
		}
	)

	return <MyButton
		borderRadius={MyCardDefaultBorderRadius}
		onPress={() => {
			show({
				visible: true,
				title: title,
				items: items
			})
		}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={IconNames.change_image_icon} />
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