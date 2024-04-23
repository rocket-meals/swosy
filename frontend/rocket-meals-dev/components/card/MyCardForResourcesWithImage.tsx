import {MyCardWithText, MyCardWithTextProps} from '@/components/card/MyCardWithText';
import {DirectusFiles} from '@/helper/database/databaseTypes/types';
import {Rectangle} from '@/components/shapes/Rectangle';
import React, {ReactNode} from 'react';
import {MySpinner, Text, View} from '@/components/Themed';
import ImageWithComponents from "@/components/project/ImageWithComponents";
import {MyButton} from "@/components/buttons/MyButton";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {IconNames} from "@/constants/IconNames";
import {PermissionHelper} from "@/helper/permission/PermissionHelper";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import * as ImagePicker from 'expo-image-picker';
import {ImagePickerAsset, launchCameraAsync} from 'expo-image-picker';
import {PlatformHelper} from "@/helper/PlatformHelper";
import {ServerAPI} from "@/helper/database/server/ServerAPI";
import {uploadFiles} from "@directus/sdk";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {ImagePickerOptions} from "expo-image-picker/src/ImagePicker.types";


export type MyCardForResourcesWithImageProps = {
    accessibilityLabel: string,
    thumbHash?: string | undefined | null,
	borderColor?: string,
    onPress?: () => void,
    assetId?: string | DirectusFiles | undefined | null,
	placeholderAssetId?: string | DirectusFiles | undefined | null,
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

	const [modalConfig, setModalConfig] = useModalGlobalContext();


	function setLoading(){
		setModalConfig({
			key: "image_upload",
			label: "Upload Image",
			accessibilityLabel: "Upload Image",
			renderAsContentInsteadItems: (key, hide) => {
				return <View style={{
					width: '100%',
					justifyContent: 'center',
					alignItems: 'center',
					padding: 20,
				}}>
					<Text>{"Please wait"}</Text>
					<MySpinner />
					<MyButton accessibilityLabel={"Dismiss"} onPress={() => {
						hide()
					} } />
				</View>
			}

		})
	}

	async function handleSelectImageForUpload(useCamera: boolean) {
		try{
			const usedPermission = useCamera ? permissionForCamera : permissionForMediaLibrary;
			const usedGranted = usedPermission?.granted;
			const canRequest = usedPermission?.canAskAgain;

			const usedAspects = props.aspect || [1, 1];

			if (usedGranted) {
				let imageLibraryOptions: ImagePickerOptions = {
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					aspect: usedAspects,
					quality: 1,
					// only 1
					allowsMultipleSelection: false,
					selectionLimit: 1,
				};


				let result = null;
				if(useCamera) {
					result = await ImagePicker.launchCameraAsync(imageLibraryOptions);
				} else {
					result = await ImagePicker.launchImageLibraryAsync(imageLibraryOptions);
				}

				if (!!result && !result.canceled) {
					setLoading()
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
							formData.append('image', blob);
						} else {
							// Form Upload for mobile generated by Copilot
							// get the file extension
							const uriParts = uri.split('.');
							const fileType = uriParts[uriParts.length - 1];
							const fileExtension = `.${fileType}`;
							// create the file
							const file: any = {
								uri,
								name: file_name + fileExtension,
								type: `image/${fileType}`,
							};
							formData.append('image', file);

							// set the file size
							const response = await fetch(uri);
							const blob = await response.blob();
							// Sadly this Blob is not the same as the one from the web ...
							fileSizes = blob.size;
						}

						const client = ServerAPI.getClient();


						formData.append('title', file_name);
						//formData.append('folder', folder);

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
				setModalConfig(null)
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
			setModalConfig({
				key: "image_upload_error",
				label: "Error",
				accessibilityLabel: "Error",
				renderAsContentInsteadItems: (key, hide) => {
					return <View style={{
						width: '100%',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 20,
					}}>
						<Text>{"Error on upload"}</Text>
						<MyButton accessibilityLabel={"Dismiss"} onPress={() => {
							hide()
						} } />
					</View>
				}
			})
		}
	}

	async function handleDeleteImage() {
		console.log('delete image');
		const collectionHelper = new CollectionHelper(props.resourceCollectionName);
		setLoading()
		let result = await collectionHelper.updateItem(props.resourceId, {
			image: null,
			image_remote_url: null
		})
		setModalConfig(null)
		if (result) {
			if (onImageUpdated) {
				onImageUpdated()
			}
		}
	}

	const hasPermission = canUpdateImageField || canUpdateImageRemoteUrlField || canCreateFile;

	if(!hasPermission){
		return null;
	}

	const items: MyModalActionSheetItem[] = []

	if(PlatformHelper.isSmartPhone()){
		items.push(
			{
				key: 'change_image_camera',
				label: translation_camera,
				accessibilityLabel: translation_camera+": "+translation_upload+": "+translation_image,
				iconLeft: IconNames.camera_icon,
				onSelect: (key) => {
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
			iconLeft: IconNames.gallery_icon,
			onSelect: (key) => {
				handleSelectImageForUpload(false)
			}
		}
	)

	items.push(
		{
			key: 'delete_image',
			label: translation_delete,
			accessibilityLabel: translation_delete+": "+translation_image,
			iconLeft: IconNames.delete_icon,
			items: [
				{
					key: 'delete_image_confirm',
					label: translation_delete,
					accessibilityLabel: translation_delete+": "+translation_image,
					iconLeft: IconNames.delete_icon,
					onSelect: (key, hide) => {
						handleDeleteImage()
					}
				},
				{
					key: 'delete_image_cancel',
					label: translation_cancel,
					accessibilityLabel: translation_cancel+": "+translation_image,
					iconLeft: IconNames.cancel_icon,
					onSelect: (key, hide) => {
						hide();
						return true;
					}
				}
			]
		}
	)
	items.push(
		{
			key: 'cancel',
			iconLeft: IconNames.cancel_icon,
			label: translation_cancel,
			accessibilityLabel: translation_cancel,
			onSelect: (key, hide) => {
				hide();
				return true;
			}
		}
	)

	const onPress = () => {
		let item: MyModalActionSheetItem = {
			key: "image_edit",
			label: title,
			title: title,
			accessibilityLabel: accessibilityLabel,
			items: items
		}

		setModalConfig(item)
	}

	return <>
		<MyButton
			borderRadius={MyCardDefaultBorderRadius}
			onPress={onPress} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={IconNames.change_image_icon} />
	</>
}

// define the button component
export const MyCardForResourcesWithImage = ({heading, accessibilityLabel, assetId, onPress, image_url, placeholderAssetId, thumbHash, imageHeight, ...props}: MyCardForResourcesWithImageProps) => {

	const imageUploaderConfig = props.imageUploaderConfig;
	const imageUploader = imageUploaderConfig ? <ImageUploaderComponent {...imageUploaderConfig} /> : null;

	const topLeftComponent = <>
		{props.topLeftComponent}
		{imageUploader}
	</>

	const topContent = (
		<Rectangle>
			<ImageWithComponents image={{
				fallbackAssetId: placeholderAssetId,
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