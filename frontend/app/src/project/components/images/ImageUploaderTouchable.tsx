import React, {FunctionComponent, useState} from "react";
import {TouchableOpacity} from "react-native";
import {ImageUploader, ImageUploaderInterface, ImageUploaderStatus} from "./ImageUploader";
import {MyAlertDialog} from "../../helper/MyAlertDialog";

export const ImageUploaderTouchable: FunctionComponent<{style?, data: ImageUploaderInterface, onUpload: any}> = (props) => {

	const [alertOpen, setAlertOpen] = useState(false);

	async function handleUpload(){
		let status = await ImageUploader.getImagePermissionStatus();
		let isGranted = ImageUploader.isPermissionGranted(status);
		if(isGranted){
			//TODO: show loading indicator
			let result = await ImageUploader.uploadImageFromLibraryToFieldInCollection(props?.data);
			if(result?.status === 400){
				//TODO: show error message
			} else {
				if(!!props?.onUpload){
					props.onUpload();
				}
			}
		} else {
			setAlertOpen(true);
		}
	}

	async function handleDelete(){
		let result = await ImageUploader.deleteImageValueCollection(props?.data);
		if(!!props?.onUpload){
			props.onUpload();
		}
	}

	function closeAlert(){
		setAlertOpen(false)
	}

	function renderAlertDialog(){
		/**
		 isOpen: boolean;
		 onClose: () => {};
		 onAccept: () => {};
		 title: string;
		 content: string;
		 accept: string;
		 */
		return(
				<MyAlertDialog key={alertOpen} isOpen={alertOpen} title={"Image Upload"} content={"We need your permission to access your images."} accept={"OK"} onClose={async () => {closeAlert()}} onAccept={async () => {
					let allowed = await ImageUploader.requestImagePermission();
					closeAlert()
					if(allowed){
						handleUpload();
					}
				}} />
		)
	}

	return (
		<TouchableOpacity key={alertOpen} style={props?.style} onPress={handleUpload}>
			{renderAlertDialog()}
			{props.children}
		</TouchableOpacity>
	)
}