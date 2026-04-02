// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React, { useMemo } from 'react';
import { SettingsListBoolean as CommonSettingsListBoolean } from 'repo-depkit-common-ui';
import type { SettingsListBooleanProps } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';

const SettingsListBoolean: React.FC<SettingsListBooleanProps> = (props) => {
	const language = useAppSelector((state) => state.settings.language);
	const isArabic = language === 'ar';
	const resolvedTitleTextAlign = useMemo(
		() => props.titleTextAlign ?? (isArabic ? (props.reverseLayout ?? true) ? 'right' : 'left' : undefined),
		[isArabic, props.reverseLayout, props.titleTextAlign]
	);
	const resolvedReverseLayout = useMemo(
		() => props.reverseLayout ?? (isArabic ? true : undefined),
		[isArabic, props.reverseLayout]
	);
	return <CommonSettingsListBoolean {...props} titleTextAlign={resolvedTitleTextAlign} reverseLayout={resolvedReverseLayout} />;
};

export type { SettingsListBooleanProps };
export default SettingsListBoolean;
