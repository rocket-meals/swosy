import { DatabaseTypes } from 'repo-depkit-common';
import { SettingsListProps } from '@/components/SettingsList/types';

export interface CanteenFeedbackLabelProps {
	label: DatabaseTypes.CanteensFeedbacksLabels;
	date: string;
	groupPosition?: SettingsListProps['groupPosition'];
	isAccountRequired?: boolean;
}

export interface ModifiedCanteensFeedbacksLabelsEntries {
	count: string;
	like: boolean;
}
