// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {AlertDialog, Button, Center, Divider, Text, View} from "native-base";
import {BreakPointLayout} from "../templates/BreakPointLayout";
import {Icon} from "./../components/Icon";
import {TouchableOpacity} from "react-native";

interface AppState {
	isOpen: boolean;
	onClose: () => {};
	onAccept: () => {};
	title: any;
	content: any;
	accept: string;
}
export const MyAlertDialog : FunctionComponent<AppState> = (props) => {

	const [isOpen, setIsOpen] = React.useState(props.isOpen)

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	const onClose = async () => {
		let allowAction = true;
		if(!!props.onClose){
			allowAction = await props.onClose()
		}
		if(allowAction){
			setIsOpen(false)
		}
	}

	const onAccept = async () => {
		let allowAction = true;
		if(!!props.onAccept){
			allowAction = await props.onAccept()
		}
		if(allowAction){
			setIsOpen(false)
		}
	}

	let titleComponent = props.title;
	if(typeof props.title ==="string"){
    titleComponent = (<Text>{props.title}</Text>);
  }

  let contentComponent = props.content;
  if(typeof props.content ==="string"){
    contentComponent = (<Text>{props.content}</Text>);
  }

	const cancelRef = React.useRef(null)
	return (
			<AlertDialog
				leastDestructiveRef={cancelRef}
				isOpen={isOpen}
				onClose={onClose}
				size={props.size}
			>
						<AlertDialog.Content>
							<AlertDialog.CloseButton />
              <View style={{flexDirection: "row"}}>
                <View style={{flex: 1}}>
                  {titleComponent}
                </View>
                <View>
                  <TouchableOpacity onPress={onClose}>
                    <Icon name={"close"} />
                  </TouchableOpacity>
                </View>
              </View>
							<AlertDialog.Body>
                {contentComponent}
							</AlertDialog.Body>
							<AlertDialog.Footer>
                <View style={{flex:1,
                  flexDirection: 'row-reverse',
                  flexWrap: 'wrap'}}>
                  <Button onPress={onClose} ref={cancelRef}>
                    Cancel
                  </Button>
                  <Button style={{margin: 10, backgroundColor: "#EF4444"}} onPress={onClose}>
                    Delete
                  </Button>
                </View>

								<Button.Group space={2}>
									<Button onPress={onAccept}>
										{props.accept}
									</Button>
								</Button.Group>
							</AlertDialog.Footer>
						</AlertDialog.Content>
			</AlertDialog>
	)
}
