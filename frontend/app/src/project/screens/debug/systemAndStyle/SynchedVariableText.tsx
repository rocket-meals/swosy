import React, {useEffect} from "react";
import {Input, Text, View} from "native-base";
import {useSynchedState, RequiredStorageKeys} from "../../../../kitcheningredients";
import {SynchedStateKeys} from "../../../helper/synchedVariables/SynchedStateKeys";

export const SynchedVariableText = (props) => {

	const [synchedText, setSynchedText] = useSynchedState(SynchedStateKeys.exampleSynchedText);
	const [synchedStorageText, setSynchedStorageText] = useSynchedState(RequiredStorageKeys.KEY_TEST_VALUE);

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

	return(
		<>
			<Text>{"Synched Text"}</Text>
			<Text>{synchedText}</Text>
			<View style={{marginVertical: 10}} >
				<Input
					value={synchedText}
					onChange={(event) => { // @ts-ignore
						setSynchedText(event.nativeEvent.text)
					}} placeholder="Synched Text" size="lg" />
			</View>
			<Text>{"synchedStorageText"}</Text>
			<Text>{synchedStorageText}</Text>
			<View style={{marginVertical: 10}} >
				<Input
					value={synchedStorageText}
					onChange={(event) => { // @ts-ignore
						setSynchedStorageText(event.nativeEvent.text)
					}} placeholder="synchedStorageText" size="lg" />
			</View>

		</>
	)
}
