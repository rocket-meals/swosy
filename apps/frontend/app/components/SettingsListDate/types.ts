import type { PropsWithChildren } from 'react';
import type { SettingsListProps } from '@/components/SettingsList';
import type { FormInputBaseProps } from '@/components/DropdownInput/types';

type SettingsListDatePropsOwn = Omit<FormInputBaseProps, 'error'> & {
	value: string;
	onError: (id: string, error: string) => void;
	error: string;
	label?: string;
	placeholder?: string;
	editable?: boolean;
};

export type SettingsListDateProps = PropsWithChildren<
	Omit<SettingsListProps, 'label' | 'title' | 'value' | 'handleFunction' | 'onPress' | 'rightIcon' | 'rightElement'> & SettingsListDatePropsOwn
>;
