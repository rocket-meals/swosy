import React, {FunctionComponent, useEffect} from "react";
import {Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {View} from "native-base";
import {SettingsUsersNicknameComponent} from "../../components/settings/SettingsUsersNicknameComponent";

export const SettingProfile: FunctionComponent = (props) => {

	const params = props?.route?.params

	function handleContinue(){
		if(params?.showbackbutton){
			Navigation.navigateBack()
//			NavigatorHelper.goBack()
		} else if(params?.goHome){
			Navigation.navigateHome()
//			NavigatorHelper.navigateHome();
		}
	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [params])

	return(
		<View style={{width: "100%"}}>
			<SettingsUsersNicknameComponent onChange={() => {
				handleContinue();
			}} />
		</View>
	)
}
