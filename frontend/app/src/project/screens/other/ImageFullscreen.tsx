import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import ImageViewer from "react-native-image-zoom-viewer-fixed";
import {Modal, TouchableOpacity} from "react-native";
import {
	Icon,
	NavigatorHelper,
	KitchenSafeAreaView,
	getDirectusImageUrl,
	ConfigHolder,
	Navigation
} from "../../../kitcheningredients";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";

export interface AppState{
	assetId: string;
}

export const ImageFullscreen: FunctionComponent<AppState> = (props) => {

	//TODO Refactor FoodImageFullscreen into FullscreenImage and pass only the assetId

	let id = props?.route?.params.id;

	const [history, setHistory] = Navigation.useNavigationHistory();
	const [showCloseButton, setShowCloseButton] = useState(true);

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

	let smallest = props?.dimension?.width > props?.dimension?.height ? props?.dimension?.height : props?.dimension?.width;

	//

	async function handleClose(){
		if(history?.length >= 1){
			Navigation.navigateBack()
//			NavigatorHelper.goBack();
		} else {
			Navigation.navigateHome()
//			NavigatorHelper.navigateHome()
		}
	}

	function renderImage(){
		if(!!id){
			let url = getDirectusImageUrl({assetId: id});

			const images = [{
				// Simplest usage.
				url: url,

				// width: number
				// height: number
				// Optional, if you know the image size, you can set the optimization performance
			}];

			return (
					<ImageViewer
						key={id}
						onClick={() => {
							setShowCloseButton(!showCloseButton)
						}}
						style={{width: props?.dimension?.width, height: props?.dimension?.height, backgroundColor: "black"}} imageUrls={images}/>
			)
		}
		return null;
	}

	function renderCloseButton(){
		if(showCloseButton){
			return (
				<View style={{position: "absolute", top: 0, right: 0, opacity: 0.5}}>
					<TouchableOpacity onPress={handleClose}>
						<ViewPercentageBorderradius style={{borderRadius: "100%", padding: 10, margin: 10, backgroundColor: "gray",alignItems: "center", justifyContent: "center", }}>
							<Icon name={"close"} color="white" />
						</ViewPercentageBorderradius>
					</TouchableOpacity>
				</View>
			)
		}
		return null;
	}

	return(
		<KitchenSafeAreaView>
			<View style={{width: props?.dimension?.width, height: props?.dimension?.height, backgroundColor: "black", alignItems: "center", justifyContent: "center"}}>
				<View style={{width: props?.dimension?.width, height: props?.dimension?.height, alignItems: "center", justifyContent: "center", backgroundColor: "black"}}>
					{renderImage()}
				</View>
				{renderCloseButton()}
			</View>
		</KitchenSafeAreaView>
	)
}
