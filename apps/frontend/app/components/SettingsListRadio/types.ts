import { SettingsListProps } from '@/components/SettingsList/types';

export type SettingsListRadioProps = Omit<SettingsListProps, 'rightElement' | 'rightIcon'> & {
        selected?: boolean;
        radioSize?: number;
};
