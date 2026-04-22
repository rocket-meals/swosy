// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React, { useMemo } from 'react';
import { SettingsListEditable as CommonSettingsListEditable } from 'repo-depkit-common-ui';
import type { SettingsListEditableProps } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

export type { SettingsListEditableProps };

const SettingsListEditable: React.FC<SettingsListEditableProps> = (props) => {
	const language = useAppSelector((state) => state.settings.language);
	const isLtrLanguage = useIsLtrLanguage();
	const isArabic = !isLtrLanguage;
	const resolvedReverseLayout = useMemo(
		() => props.reverseLayout ?? (isArabic ? true : undefined),
		[isArabic, props.reverseLayout]
	);
	const resolvedTitleTextAlign = useMemo(
		() => props.titleTextAlign ?? (isArabic ? (resolvedReverseLayout ? 'right' : 'left') : undefined),
		[isArabic, props.titleTextAlign, resolvedReverseLayout]
	);
	return <CommonSettingsListEditable {...props} reverseLayout={resolvedReverseLayout} titleTextAlign={resolvedTitleTextAlign} />;
};

export default SettingsListEditable;

