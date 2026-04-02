import React, { useMemo } from 'react';
import { SettingsList as CommonSettingsList } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import type { SettingsListProps } from './types';

const SettingsList: React.FC<SettingsListProps> = (props) => {
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

	return <CommonSettingsList {...props} titleTextAlign={resolvedTitleTextAlign} reverseLayout={resolvedReverseLayout} />;
};

export default SettingsList;
