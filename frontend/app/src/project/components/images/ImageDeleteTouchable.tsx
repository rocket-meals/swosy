import React, {FunctionComponent, useState} from "react";
import {TouchableOpacity} from "react-native";
import {ImageUploader, ImageUploaderInterface, ImageUploaderStatus} from "./ImageUploader";
import {MyAlertDialog} from "../../helper/MyAlertDialog";

export const ImageDeleteTouchable: FunctionComponent<{style?, data: ImageUploaderInterface, onUpload: any}> = (props) => {

	const [alertOpen, setAlertOpen] = useState(false);

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
				<MyAlertDialog key={alertOpen} isOpen={alertOpen} title={"Image Delete"} content={"Are you sure you want to delete the image?"} accept={"OK"} onClose={async () => {closeAlert()}} onAccept={async () => {
					handleDelete()
					closeAlert()
				}} />
		)
	}

	return (
		<TouchableOpacity key={alertOpen} style={props?.style} onPress={() => {setAlertOpen(true)}}>
			{renderAlertDialog()}
			{props.children}
		</TouchableOpacity>
	)
}