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
import {Heading, View, Text} from "@/components/Themed";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MarkingList} from "@/components/food/MarkingList";

interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();

	const [showActionsheet, setShowActionsheet] = useState(false)

	const onPress = () => {
		setShowActionsheet(!showActionsheet)
	}

	const onCancel = () => {
		setShowActionsheet(false)

	}

	//                <MyButton
	//                     useOnlyNecessarySpace={true} accessibilityLabel={"Canteen"} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />

	return (
		<>
		<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={onPress} />
			<Actionsheet isOpen={showActionsheet} onClose={onCancel} zIndex={999}>
				<ActionsheetBackdrop onPress={onCancel} />
				<ActionsheetContent
					maxHeight={"80%"}
					zIndex={999}
					style={{
						backgroundColor: "red",
						flexGrow: 1
					}}
				>
					<View style={{

					}}>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator
								style={{
									backgroundColor: "green",
								}}
							/>
							<View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}><Heading>{tooltip}</Heading></View>
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
			</>
	)
}
