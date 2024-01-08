import React, {FunctionComponent, useEffect} from "react";
import {MyThemedBox, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {CanteenListAll} from "../../components/canteen/CanteenListAll";
import {Text, View} from "native-base";
import {useSynchedProfileCanteen} from "../../components/profile/ProfileAPI";
import {AppTranslation} from "../../components/translations/AppTranslation";
import {useDebugMode} from "../../helper/synchedJSONState";

export const SettingCanteen: FunctionComponent = (props) => {

	const params = props?.route?.params
	const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();

	const [debug, setDebug] = useDebugMode()

	function onPress(resourceId){
		if(resourceId){
			setProfileCanteenId(resourceId);
			if(params?.showbackbutton){
				Navigation.navigateBack();
//				NavigatorHelper.goBack()
			} else if(params?.goHome){
				Navigation.navigateHome()
//				NavigatorHelper.navigateHome();
			}
		}
	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [params])

	function renderDebug(){
		if(debug){
			return(
				<View style={{flexDirection: "column", flex: 1}}>
					<Text>{"profile.canteen"}</Text>
					<Text>{JSON.stringify(profileCanteenId, null, 2)}</Text>
				</View>
			)
		}
	}

	return(
		<View style={{width: "100%"}}>
			<MyThemedBox key={"food_name"} _shadeLevel={3} style={{flexDirection: "row", paddingVertical: "1%", paddingHorizontal: "1%"}}>
				<View style={{flexDirection: "column", flex: 1}}>
					<AppTranslation id={"selectYourCanteen"} />
				</View>
				{renderDebug()}
			</MyThemedBox>
			<CanteenListAll onPress={(resourceId) => {
				onPress(resourceId)
			}} />
		</View>
	)
}
