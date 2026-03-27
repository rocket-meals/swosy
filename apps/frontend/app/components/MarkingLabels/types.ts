import { SettingsListProps } from '@/components/SettingsList/types';

export interface MarkingLabelProps {
	markingId: string;
	handleMenuSheet?: () => void;
	size?: number;
	groupPosition?: SettingsListProps['groupPosition'];
}
