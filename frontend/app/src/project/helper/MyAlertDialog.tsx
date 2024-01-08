// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {AlertDialog, Button, Center, Divider, Text, View} from "native-base";
import {Icon} from "../../kitcheningredients";
import {TouchableOpacity} from "react-native";

interface AppState {
	isOpen: boolean;
	onClose: () => {};
	onAccept: () => {};
	title: string;
	content: string;
	accept: string;
}
export const MyAlertDialog : FunctionComponent<AppState> = (props) => {

	const [isOpen, setIsOpen] = React.useState(props.isOpen)

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	const onClose = async () => {
		let allowAction = true;
		if(props.onClose){
			allowAction = await props.onClose()
		}
		if(allowAction){
			setIsOpen(false)
		}
	}

	const onAccept = async () => {
		let allowAction = true;
		if(props.onAccept){
			allowAction = await props.onAccept()
		}
		if(allowAction){
			setIsOpen(false)
		}
	}

	const cancelRef = React.useRef(null)
	return (
		<Center>
			<AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<View style={{flexDirection: "row"}}>
							<View style={{flex: 1}}>
								<Text>{props.title}</Text>
							</View>
							<View>
								<TouchableOpacity onPress={onClose}>
									<Icon name={"close"} />
								</TouchableOpacity>
							</View>
						</View>

					</AlertDialog.Header>
					<AlertDialog.Body>
						{props.content}
					</AlertDialog.Body>
					<AlertDialog.Footer>
						<View style={{flex:1,
							flexDirection: 'row-reverse',
							flexWrap: 'wrap'}}>
								<Button onPress={onClose} ref={cancelRef}>
									Cancel
								</Button>
								<Button style={{margin: 10, backgroundColor: "#EF4444"}} onPress={onAccept}>
									{props.accept}
								</Button>
						</View>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog>
		</Center>
	)
}
