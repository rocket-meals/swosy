import React, {FunctionComponent} from 'react';
import {MyCanteenSelectionModal} from '@/compositions/settings/UseGlobalActionSheetSettingProfileCanteen';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {useEditProfileCanteenAccessibilityLabel} from '@/compositions/settings/SettingsRowProfileCanteen';

interface AppState {

}
export const SettingsButtonProfileCanteen: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileCanteenAccessibilityLabel();
	const tooltip = useEditProfileCanteenAccessibilityLabel();
	const [show, setShow] = React.useState(false);

	const onPress = () => {
		setShow(true);
	}

	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />
			<MyCanteenSelectionModal visible={show} setVisible={setShow} />
		</>

	)
}
