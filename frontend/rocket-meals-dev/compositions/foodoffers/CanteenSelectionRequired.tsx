import React, {FunctionComponent} from 'react';
import {
	useGlobalActionSheetSettingProfileCanteen
} from '@/compositions/settings/UseGlobalActionSheetSettingProfileCanteen';
import {Heading, View} from '@/components/Themed';
import {useEditProfileCanteenAccessibilityLabel} from '@/compositions/settings/SettingsRowProfileCanteen';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {useSynchedCanteensDict} from '@/states/SynchedCanteens';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';

export function useIsValidCanteenSelected(): boolean {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [canteensDict, setCanteensDict] = useSynchedCanteensDict();
	// check if profileCanteen is found in canteensDict
	if (!!profileCanteen && !!canteensDict) {
		const foundCanteen = canteensDict[profileCanteen?.id];
		return !!foundCanteen;
	}
	return false;
}

interface AppState {

}
export const CanteenSelectionRequired: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileCanteenAccessibilityLabel();
	const tooltip = useEditProfileCanteenAccessibilityLabel();

	const onPress = useGlobalActionSheetSettingProfileCanteen();

	//                <MyButton
	//                     useOnlyNecessarySpace={true} accessibilityLabel={"Canteen"} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />

	return (
		<View style={{
			width: '100%',
			height: '100%',
			alignItems: 'center',
			flex: 1
		}}
		>
			<View>
				<Heading>{tooltip}</Heading>
			</View>
			<View style={{
				width: '100%',
				height: '100%',
				alignItems: 'center',
				flex: 1
			}}
			>
				<CanteenSelectGridList />
			</View>
		</View>
	)
}
