// Hinweis: Wenn neue SettingsList-Komponenten entstehen, bitte auch im Experimental-Screen hinzufügen.
import React from 'react';
import { Switch } from 'react-native';
import { useAppSelector } from '@/redux/hooks';
import SettingsList from '@/components/SettingsList';
import { useTheme } from '@/hooks/useTheme';
import type { PropsWithChildren } from 'react';
import type { SettingsListProps } from '@/components/SettingsList';

type SettingsListBooleanPropsOwn = {
        isEnabled: boolean;
        onToggle: () => void;
        disabled?: boolean;
        valueActive?: string;
        valueInactive?: string;
};

export type SettingsListBooleanProps = PropsWithChildren<
        Omit<SettingsListProps, 'rightElement' | 'rightIcon' | 'onPress' | 'handleFunction' | 'value'> & SettingsListBooleanPropsOwn
>;

const SettingsListBoolean: React.FC<SettingsListBooleanProps> = ({
        isEnabled,
        onToggle,
        disabled = false,
        valueActive = 'Aktiv',
        valueInactive = 'Inaktiv',
        ...props
}) => {
        const { theme } = useTheme();
        const { primaryColor } = useAppSelector(state => state.settings);

        return (
                <SettingsList
                        {...props}
                        value={isEnabled ? valueActive : valueInactive}
                        rightElement={
                                <Switch
                                        value={isEnabled}
                                        onValueChange={onToggle}
                                        trackColor={{ false: theme.screen.iconBg, true: primaryColor }}
                                        thumbColor={theme.screen.icon}
                                        ios_backgroundColor={theme.screen.iconBg}
                                        disabled={disabled}
                                />
                        }
                        handleFunction={disabled ? undefined : onToggle}
                />
        );
};

export default SettingsListBoolean;
