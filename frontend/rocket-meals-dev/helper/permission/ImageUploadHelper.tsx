import * as ImagePicker from "expo-image-picker";

export interface ImageUploaderInterface {
	collection_name,
	instance_id ,
	field_name,
	selectionLimit?: number,
	aspect?: [number, number],
	onUpload?: any,
}
export enum ImageUploaderStatus {
	success="success",
	denied="denied",
	canceled="canceled",
	undertermined="undertermined",
	unknown="unknown"
}
export interface ImageUploaderResults {
	status: ImageUploaderStatus,
	data: any;
}
export class ImageUploader {

	static async getImagePermissionStatus(){
		if (!PlatformHelper.isWeb()) {
			return ImagePicker.PermissionStatus.GRANTED;
		} else {
			const { status } = await ImagePicker.getMediaLibraryPermissionsAsync(false);
			return status;
		}
	}

	static async uploadImageFromLibraryToFieldInCollection(data: ImageUploaderInterface): Promise<ImageUploaderResults>{
		if (!PlatformHelper.isWeb()) {
			return await ImageUploader.handleImageUploadProcess(data)
		} else {
			const { status } = await ImagePicker.getMediaLibraryPermissionsAsync(false);
			if(ImageUploader.isPermissionGranted(status)){
				return await ImageUploader.handleImageUploadProcess(data)
			} else if(ImageUploader.isPermissionUndetermined(status)) {
				//show warning about asking permission
				//callback to ask for permission
				//if permission granted, recall main function
				//if not granted, show warning that this is needed and the user should go into system settings
			} else if(ImageUploader.isPermissionDenied(status)){
				//if denied: ImagePicker.PermissionStatus.DENIED
				//show warning to go into system settings
				// if Granted
			} else {
				//show unkown error with status
			}
		}
	}

	static async deleteImageValueCollection(data: ImageUploaderInterface): Promise<ImageUploaderResults>{
		// @ts-ignore
		return ImageUploader.uploadBase64ImageToFieldInCollection(data.collection_name, data.instance_id, data.field_name, null, data.onUpload);
	}

	private static async handleImageUploadProcess(data: ImageUploaderInterface): Promise<ImageUploaderResults>{
		let result = await ImageUploader.openImageSelection(data.selectionLimit, data.aspect);
		if(!result){
			return {
				status: ImageUploaderStatus.canceled,
				data: null
			}
			//user canceled
		} else {
			let base64Image = ImageUploader.getGetBase64ImageFromResults(result);
			let updateResult = await ImageUploader.uploadBase64ImageToFieldInCollection(data.collection_name, data.instance_id, data.field_name, base64Image, data.onUpload);
			return {
				status: ImageUploaderStatus.success,
				data: updateResult
			}
		}
	}


	static isPermissionGranted(status){
		return status === ImagePicker.PermissionStatus.GRANTED // 'granted'
	}

	private static isPermissionUndetermined(status){
		return status === ImagePicker.PermissionStatus.UNDETERMINED
	}

	private static isPermissionDenied(status){
		return status === ImagePicker.PermissionStatus.DENIED
	}

	static async requestImagePermission(){
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		return ImageUploader.isPermissionGranted(status)
	}

	private static async openImageSelection(selectionLimit?: number, aspect?: [number, number]){
		let allowsMultipleSelection = false;
		if(selectionLimit===undefined || selectionLimit===null){
			selectionLimit = 1;
		} else if (selectionLimit > 1) {
			allowsMultipleSelection = true;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			allowsMultipleSelection: allowsMultipleSelection,
			aspect: aspect || [1, 1],
			selectionLimit: selectionLimit,
			base64: true,
			quality: 1,
		});

		if (!result.cancelled) {
			return result
		} else {
			return false;
		}
	}

	private static byteCount(s) {
		return encodeURI(s).split(/%..|./).length - 1;
	}

	private static getGetBase64ImageFromResults(result): string{
		let base64 = null;
		if(PlatformHelper.isWeb()){
			base64 = result.uri;
		} else {
			let base64Data = result.base64;
			if(base64Data.startsWith("data:image/")){
				base64 = base64Data;
			} else { //This is the normal case
				//https://www.codegrepper.com/code-examples/javascript/react+native+image+picker+get+base64
				base64 = `data:image/png;base64,${base64Data}`;
			}
		}
		//console.log("base64.length: "+base64.length);
		//console.log("ByteSize: "+ImageUploader.byteCount(base64));
		//console.log("KB: "+(ImageUploader.byteCount(base64)/1024))
		//console.log("MB: "+(ImageUploader.byteCount(base64)/1024/1024))
		return base64;
	}

	private static async uploadBase64ImageToFieldInCollection(collection_name, instance_id , field_name, base64Image, onUpload?){
			let directus = ServerAPI.getClient();

			if(!!onUpload){
				onUpload(base64Image.length)
			}
			let updateResult = await directus.items(collection_name).updateOne(instance_id, {[field_name]: base64Image});
			//console.log(updateResult);
			//console.log("Upload finished");
			return updateResult;
	}

}
