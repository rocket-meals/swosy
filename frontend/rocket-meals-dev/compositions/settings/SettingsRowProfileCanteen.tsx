import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {MyCanteenSelectionModal,} from '@/compositions/settings/UseGlobalActionSheetSettingProfileCanteen';
import {IconNames} from '@/constants/IconNames';
import {useIsFoodsEnabled} from '@/states/SynchedAppSettings';

interface AppState {

}

export function useEditProfileCanteenAccessibilityLabel(): string {
	const translation_title = useTranslation(TranslationKeys.canteen)
	const translation_select = useTranslation(TranslationKeys.select)
	return translation_title + ': ' + translation_select;
}

export const SettingsRowProfileCanteen: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [show, setShow] = React.useState(false);
	const isFoodsEnabled = useIsFoodsEnabled();

	const leftIcon = IconNames.canteen_icon
	const translation_title = useTranslation(TranslationKeys.canteen)
	const label = translation_title
	const canteenId = profileCanteen?.id;
	const canteenIdAsString = canteenId ? canteenId+'' : undefined;
	const labelRight: string = profileCanteen?.alias || canteenIdAsString || 'unknown';

	const accessibilityLabel = useEditProfileCanteenAccessibilityLabel();

	const onPress = () => {
		setShow(true);
	}

	if (!isFoodsEnabled) {
		return null;
	}

	return (
		<>
			<SettingsRow accessibilityLabel={accessibilityLabel} labelRight={labelRight} labelLeft={label} leftIcon={leftIcon} {...props} onPress={onPress} />
			<MyCanteenSelectionModal visible={show} setVisible={setShow} />
		</>
	)
}
