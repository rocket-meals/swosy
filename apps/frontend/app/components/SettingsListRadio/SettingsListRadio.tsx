import React from 'react';
import SettingsList from '@/components/SettingsList';
import ProjectRadioElement from '@/components/ProjectRadioElement';
import { SettingsListRadioProps } from './types';

const SettingsListRadio: React.FC<SettingsListRadioProps> = ({ selected = false, radioSize, ...settingsListProps }) => {
        return (
                <SettingsList
                        {...settingsListProps}
                        rightElement={<ProjectRadioElement selected={selected} size={radioSize} />}
                />
        );
};

export default SettingsListRadio;
