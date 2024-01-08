// @ts-nocheck
import React, {useState} from 'react';
import ServerAPI from "../ServerAPI";
import {AlertDialog, Button, Divider, Text, Tooltip} from "native-base";
import {TransparentTextButton} from "../components/buttons/TransparentTextButton";

import {Icon} from "../components/Icon";
import {ConfigHolder} from "../ConfigHolder";
import {TranslationKeys} from "../translations/TranslationKeys";

export interface AppState {
	onlyIcon?: boolean;
	transparent?: boolean;
	touchableOnly?: boolean
}
export const SignOutButton: (props) => JSX.Element[] = (props) => {

	const cancelRef = React.useRef(null)
	const [isOpen, setIsOpen] = useState(false)

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const accessibilityLabel = useTranslation(TranslationKeys.logout);
  const logout_confirm_message = useTranslation(TranslationKeys.logout_confirm_message);

	async function handleLogout(){
		await setIsOpen(false);
		try{
			await ServerAPI.handleLogout();
		} catch (err){
			console.log(err);
		}
	}

	function openConfirmBox(){
		setIsOpen(true);
	}

	function renderAlertBox(){
		return (
			<AlertDialog
				key={"SignOutAlertBox"}
				leastDestructiveRef={cancelRef}
				style={{maxWidth: 600, alignSelf: "center"}}
				isOpen={isOpen}
				onClose={() => {setIsOpen(false)}}
			>
				<AlertDialog.Content>
					<AlertDialog.CloseButton />
					<AlertDialog.Header>{accessibilityLabel}</AlertDialog.Header>
					<AlertDialog.Body>
						<Text key={"c"}>{logout_confirm_message}</Text>
					</AlertDialog.Body>
					<AlertDialog.Footer>
						<Button.Group space={2}>
							<Button accessibilityLabel={accessibilityLabel} onPress={handleLogout}>
                {accessibilityLabel}
							</Button>
						</Button.Group>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog>
		)
	}

	function renderOnlyIcon(){
		return (
		  <Tooltip label={accessibilityLabel} key={"logoutToolTip"}>
        <Button accessibilityLabel={accessibilityLabel} key={"LogoutButton"} style={{backgroundColor: "transparent"}} onPress={openConfirmBox} >
          <Icon name={"logout"} key={"logoutIcon"}/>
        </Button>
      </Tooltip>

		)
	}

	function renderLogoutText(){
		return(
			<TransparentTextButton accessibilityLabel={accessibilityLabel} key={"logoutTextButton"} onPress={openConfirmBox}>
				<Text>{accessibilityLabel}</Text>
			</TransparentTextButton>
		)
	}



	let content = [renderAlertBox()];
	if(props.onlyIcon){
		content.push(renderOnlyIcon());
	} else {
		content.push(renderLogoutText());
	}

	return content
}
