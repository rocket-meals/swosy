import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {DeviceInformationHelper} from "../../../helper/DeviceInformationHelper";
import {SettingsRow} from "../../../components/settings/SettingsRow";
import {SettingsSpacer} from "../../../components/settings/SettingsSpacer";

export const DeviceInformationDebug: FunctionComponent = (props) => {

	const [deviceInformation, setDeviceInformation] = DeviceInformationHelper.useLocalDeviceInformation();

	function renderDeviceInformation(key, value){
		return (
			<>
				<SettingsRow leftContent={key} />
				<Text>{typeof value}</Text>
				<Text>{JSON.stringify(value, null, 2)}</Text>
				<SettingsSpacer />
			</>
		)
	}

	function renderDeviceInformations(){
		let output = [];
		for(let key in deviceInformation){
			output.push(renderDeviceInformation(key, deviceInformation[key]));
		}
		return output;
	}

	return(
		<>
			<View style={{width: "100%", height: "100%"}}>
				{renderDeviceInformations()}
			</View>
		</>
	)
}
