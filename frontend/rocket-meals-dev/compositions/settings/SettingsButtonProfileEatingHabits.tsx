import React, {FunctionComponent, useState} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {
	useEditProfileEatingHabitsAccessibilityLabel,
	useGlobalActionSheetSettingProfileEatingHabits
} from '@/compositions/settings/SettingsRowEatingHabits';
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper
} from "@gluestack-ui/themed";
import {Heading, View, Text, useViewBackgroundColor} from "@/components/Themed";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MarkingList} from "@/components/food/MarkingList";
import {Modal} from "react-native";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";

interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();
	const viewBackgroundColor = useViewBackgroundColor();

	const [showActionsheet, setShowActionsheet] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const onPressLegacy = useGlobalActionSheetSettingProfileEatingHabits()

	const onPress = () => {
		setShowActionsheet(!showActionsheet)
	}

	const onCancel = () => {
		setShowActionsheet(false)

	}

	const useLegacy = false;
	let usedOnPress: any = onPress;
	if(useLegacy){
		usedOnPress = onPressLegacy;
	}
	if(true){
		usedOnPress = () => {
			setShowModal(true)
		}
	}

	return (
		<>
		<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={usedOnPress} />
			<Actionsheet isOpen={showActionsheet} onClose={onCancel} zIndex={999}>
				<ActionsheetBackdrop onPress={onCancel} />
				<ActionsheetContent
					maxHeight={"80%"}
					zIndex={999}
					style={{
						backgroundColor: "white",
						flexGrow: 1
					}}
				>
					<View style={{
						width: "100%",
					}}>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator
								style={{
									backgroundColor: "black",
								}}
							/>
							<View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}><Heading>{"Test"}</Heading></View>
						</ActionsheetDragIndicatorWrapper>
					</View>

					<View style={{
						width: "100%",
						flexGrow: 1, // werde so groß wie möglich
						flexShrink: 1 // aber lass them action sheet drag indicator platz
					}}>
						<MySafeAreaView>
							<MarkingList />
						</MySafeAreaView>
					</View>
				</ActionsheetContent>
			</Actionsheet>
			{showModal && <Modal animationType={"none"} onRequestClose={() => {
				setShowModal(false)
			}} presentationStyle={"overFullScreen"} visible={showModal} style={{
			}} transparent={true}>
				<View style={{
					width: "100%",
					height: "100%",
				}} onLayout={() => {
					console.log("Layout MODAL")
				}}>
					<MyTouchableOpacity accessibilityLabel={"Close"} onPress={() => {
						setShowModal(false)
					}} style={{
						height: "20%",
						width: "100%",
						// background should dim the background
						backgroundColor: "rgba(0,0,0,0.5)",
					}} />
					<View style={{
						width: "100%",
						height: "80%",
						backgroundColor: viewBackgroundColor,
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						overflow: "hidden",
						paddingTop: 20,
					}}>
						<MySafeAreaView>
							<MarkingList />
						</MySafeAreaView>
					</View>
				</View>
			</Modal>}
		</>
	)
}
