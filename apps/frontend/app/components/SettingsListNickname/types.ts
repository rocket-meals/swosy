import type { SettingsListItemBaseProps } from 'repo-depkit-common-ui';

export interface SettingsListNicknameProps extends Pick<SettingsListItemBaseProps, 'leftIcon' | 'iconBgColor'> {
        groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
}
