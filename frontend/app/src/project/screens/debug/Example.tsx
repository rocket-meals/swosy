import React, {useEffect, useState} from "react";
import {Input, Text, View} from "native-base";
import {ServerAPI} from "../../../kitcheningredients";
import {useSynchedState} from "../../../kitcheningredients";
import {SynchedStateKeys} from "../../helper/synchedVariables/SynchedStateKeys";
import {RequiredStorageKeys} from "../../../kitcheningredients";

export const Example = (props) => {

	const [synchedText, setSynchedText] = useSynchedState(SynchedStateKeys.exampleSynchedText);
	const [synchedStorageText, setSynchedStorageText] = useSynchedState(RequiredStorageKeys.KEY_TEST_VALUE);

	const [ms, setMs] = useState(null);
	const [date, setDate] = useState(new Date());
	const [info, setInfo] = useState(null);

	async function downloadServerStatus(){
		let directus = ServerAPI.getClient();
		let startTime = performance.now()
		await directus.server.ping();
		let endTime = performance.now();
		let msCalculated = endTime-startTime;
		msCalculated = parseInt(msCalculated.toFixed(0));
		setMs(msCalculated);
		setDate(new Date());

		try{
			let users = await directus.users.readByQuery({limit: -1});
			setInfo(users);
		} catch (err){
			//console.log(err);
		}
		//setTimeout(() => { downloadServerStatus(); }, 1000);
	}

	// corresponding componentDidMount
	useEffect(() => {
		downloadServerStatus()
	}, [props?.route?.params])

	return(
		<>
			<Text>{"Welcome Home"}</Text>
			<Text>{"MS: "+ms}</Text>
			<Text>{date.toString()}</Text>
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
			<Text>{JSON.stringify(info, null, 4)}</Text>
		</>
	)
}
