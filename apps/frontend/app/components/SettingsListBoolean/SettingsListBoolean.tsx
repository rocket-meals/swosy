// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React from 'react';
import { SettingsListBoolean as CommonSettingsListBoolean } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import type { SettingsListBooleanProps } from 'repo-depkit-common-ui';

export type { SettingsListBooleanProps };

const SettingsListBoolean: React.FC<SettingsListBooleanProps> = (props) => {
	const { primaryColor } = useAppSelector((state) => state.settings);

	return (
		<CommonSettingsListBoolean
			{...props}
			primaryColor={props.primaryColor ?? primaryColor}
		/>
	);
};

export default SettingsListBoolean;

