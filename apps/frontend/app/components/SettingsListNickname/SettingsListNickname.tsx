// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsListTextInput from '@/components/SettingsListTextInput';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

import { SettingsListNicknameProps } from './types';

const SettingsListNickname: React.FC<SettingsListNicknameProps> = ({ initialValue, onSave, groupPosition = 'single', leftIcon, iconBgColor }) => {
        const { translate } = useLanguage();
        const { theme } = useTheme();
        const [value, setValue] = useState(initialValue ?? '');

        useEffect(() => {
                setValue(initialValue ?? '');
        }, [initialValue]);

        const trimmedValue = useMemo(() => value?.trim?.() ?? '', [value]);

        const disableSave = useMemo(
                () => trimmedValue === (initialValue?.trim?.() ?? ''),
                [initialValue, trimmedValue]
        );

        const handleSave = useCallback(() => onSave(trimmedValue), [onSave, trimmedValue]);

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
