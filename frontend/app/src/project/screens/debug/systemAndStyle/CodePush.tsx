import React, {FunctionComponent, useEffect, useState} from "react";
import {Spacer, Text, View} from "native-base";

import { useOTAMetaData } from "../../../helper/codepushmetahelper"

export const CodePush: FunctionComponent = (props) => {

	const { appMetaData } = useOTAMetaData()

	//console.log("appMetaData: ");
	//console.log(appMetaData);

	return(
		<>
			<View style={{width: "100%", height: "100%"}}>
				<Text>{"DEBUG INFORMATIONS"}</Text>
				<Spacer />
				<Text>{"label: "+appMetaData?.label}</Text>
				<Text>{"appVersion: "+appMetaData?.appVersion}</Text>
				<Text>{"failedInstall: "+appMetaData?.failedInstall}</Text>
				<Text>{"isFirstRun: "+appMetaData?.isFirstRun}</Text>
				<Text>{"isMandatory: "+appMetaData?.isMandatory}</Text>
				<Text>{"isPending: "+appMetaData?.isPending}</Text>
				<Text>{"packageSize: "+appMetaData?.packageSize}</Text>
				<Text>{"packageHash: "+appMetaData?.packageHash}</Text>
				<Spacer />
				<Text>{"appMetaData: "}</Text>
				<Text>{JSON.stringify(appMetaData)}</Text>
			</View>
		</>
	)
}
