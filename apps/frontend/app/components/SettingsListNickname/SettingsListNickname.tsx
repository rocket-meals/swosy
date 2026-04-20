// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsListTextInput from '@/components/SettingsListTextInput';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { SET_NICKNAME_LOCAL, UPDATE_PROFILE } from '@/redux/Types/types';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import { DatabaseTypes } from 'repo-depkit-common';

import { SettingsListNicknameProps } from './types';

const SettingsListNickname: React.FC<SettingsListNicknameProps> = ({ groupPosition = 'single', leftIcon, iconBgColor }) => {
        const { translate } = useLanguage();
        const { theme } = useTheme();
        const dispatch = useDispatch();
        const { user, profile } = useAppSelector((state) => state.authReducer);
        const { nickNameLocal } = useAppSelector((state) => state.settings);
        const isRegisteredUser = UserHelper.isRegisteredUser(user);
        const profileHelper = useMemo(() => new ProfileHelper(), []);

        const currentNickname = useMemo(
                () => (profile?.id ? profile?.nickname ?? '' : nickNameLocal ?? ''),
                [nickNameLocal, profile?.id, profile?.nickname]
        );

        const [value, setValue] = useState(currentNickname);

        useEffect(() => {
                setValue(currentNickname);
        }, [currentNickname]);

        const trimmedValue = useMemo(() => value?.trim?.() ?? '', [value]);

        const disableSave = useMemo(
                () => trimmedValue === (currentNickname?.trim?.() ?? ''),
                [currentNickname, trimmedValue]
        );

        const handleSave = useCallback(async (savedValue: string) => {
                const nextNickname = savedValue?.trim?.() ?? trimmedValue;
                if (isRegisteredUser) {
                        const result = (await profileHelper.updateProfile({
                                ...profile,
                                nickname: nextNickname,
                        })) as DatabaseTypes.Profiles;
                        if (result) {
                                dispatch({ type: UPDATE_PROFILE, payload: result });
                        }
                } else {
                        dispatch({ type: SET_NICKNAME_LOCAL, payload: nextNickname });
                }
        }, [dispatch, isRegisteredUser, profile, profileHelper, trimmedValue]);

        const resolvedIcon = useMemo(
                () => leftIcon ?? <MaterialCommunityIcons name="account" size={24} color={theme.screen.icon} />,
                [leftIcon, theme.screen.icon]
        );

	return (
		<SettingsListTextInput
			label={translate(TranslationKeys.nickname)}
			value={value}
			placeholder={translate(TranslationKeys.nickname)}
			saveLabel={translate(TranslationKeys.save)}
			onSave={handleSave}
			initialValue={value}
			checkTextInput={currentValue => ({
				isValid: true,
				value: currentValue.trim(),
			})}
			groupPosition={groupPosition}
			leftIcon={resolvedIcon}
			iconBgColor={iconBgColor}
		/>
	);
};

export default SettingsListNickname;
