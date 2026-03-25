// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React from 'react';
import { SettingsListLikeDislikeFast as CommonSettingsListLikeDislikeFast } from 'repo-depkit-common-ui';
import type { SettingsListLikeDislikeFastProps } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';

export type { SettingsListLikeDislikeFastProps };

const SettingsListLikeDislikeFast: React.FC<SettingsListLikeDislikeFastProps> = (props) => {
	const { appSettings } = useAppSelector((state) => state.settings);
	const foodsColor = appSettings?.foods_area_color ?? undefined;

	return (
		<CommonSettingsListLikeDislikeFast
			{...props}
			primaryColor={props.primaryColor ?? foodsColor}
		/>
	);
};

export default React.memo(SettingsListLikeDislikeFast);

