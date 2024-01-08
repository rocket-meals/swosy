import React, {FunctionComponent, useState} from "react";
import {Divider, Text, View} from "native-base";
import NfcManager, {NfcTech} from "react-native-nfc-manager";
import {Platform, TouchableOpacity} from "react-native";

// this is a component to read the content of intercard cards with the phone
export const IntercardReaderExample: FunctionComponent = (props) => {

	const [informations, setInformations] = useState("No card read yet");

	/**
	 * send Mifare APDU command to the NFC Card
	 * @param command the APDU Command
	 * @returns {Promise<number[]|undefined>}
	 */
	async function private_sendCommandToMensaCard(
		cardReader: any,
		command: any
	) {
		try {
			if (cardReader.Platform.OS === 'ios') {
				return await cardReader.NfcManager.sendMifareCommandIOS(command);
			} else {
				return await cardReader.NfcManager.transceive(command);
			}
		} catch (err) {
			console.warn(err);
			return undefined;
		}
	}

	// function to read the card
	async function readCard(){
		try{
			// start the nfc manager
			await NfcManager.start();
			// check if the nfc is enabled
			let isEnabled = await NfcManager.isEnabled();
			setInformations("NFC is enabled: " + isEnabled);
			if(isEnabled) {
				// read the card with mifare desfire
				const tech = Platform.OS === 'ios'
					? NfcTech.MifareClassic
					: NfcTech.MifareClassic;
				NfcTech.MifareIOS

				let tag = await NfcManager.requestTechnology(tech, {
					alertMessage: "Bitte karte ranhalten",
				});
				setInformations("Tag: " + JSON.stringify(tag, null, 2));
			}
		} catch (err){
			setInformations("Error: " + err);
		} finally {
			await _cleanUp();
		}
	}

	/**
	 * function for Cleaning up the requests
	 * @returns {Promise<void>}
	 * @private
	 */
     async function _cleanUp() {
		//console.log('Clean Up');
		try {
			await NfcManager.cancelTechnologyRequest();
			await NfcManager.unregisterTagEvent();
			//console.log('Success to cancelTechnologyRequest');
		} catch {
			console.warn('Clean Up failed');
		}
	}

	return(
		<>
			<View style={{width: "100%"}}>
				<Text>{"Intercard Reader"}</Text>
				<Divider />
				<TouchableOpacity onPress={readCard}>
					<Text>{"Read Card"}</Text>
				</TouchableOpacity>
				<Divider />
				<Text>{"Informations"}</Text>
				<Text>{JSON.stringify(informations, null, 2)}</Text>
			</View>
		</>
	)
}
