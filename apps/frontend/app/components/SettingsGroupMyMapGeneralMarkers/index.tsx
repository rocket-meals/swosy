import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_OSM_VECTOR_MAP_SHOW_SETTINGS } from '@/redux/Types/types';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsListBoolean from '@/components/SettingsListBoolean';
import { useTheme } from '@/hooks/useTheme';

const DEFAULT_SHOW_SETTINGS = { poi: true, transit: true, roadNames: true, leisure: true, barriers: true };

const SettingsGroupMyMapGeneralMarkers: React.FC = () => {
    const { theme } = useTheme();
    const dispatch = useDispatch();
    const showSettings = useAppSelector(
        (state) => ((state.settings as any).osmVectorMapShowSettings ?? DEFAULT_SHOW_SETTINGS) as Record<string, boolean>,
    );

    const toggle = (key: string) =>
        dispatch({ type: SET_OSM_VECTOR_MAP_SHOW_SETTINGS, payload: { [key]: !(showSettings[key] ?? true) } });

    return (
        <>
            <SettingsGroupTitle>Karten-Ebenen</SettingsGroupTitle>
            <SettingsListBoolean
                title="Shops/POI"
                leftIcon={<MaterialCommunityIcons name="store" size={20} color={theme.screen.icon} />}
                isEnabled={showSettings.poi ?? true}
                onToggle={() => toggle('poi')}
                groupPosition="top"
            />
            <SettingsListBoolean
                title="Bus/Transit"
                leftIcon={<MaterialCommunityIcons name="bus" size={20} color={theme.screen.icon} />}
                isEnabled={showSettings.transit ?? true}
                onToggle={() => toggle('transit')}
                groupPosition="middle"
            />
            <SettingsListBoolean
                title="Sport & Freizeit"
                leftIcon={<MaterialCommunityIcons name="swim" size={20} color={theme.screen.icon} />}
                isEnabled={showSettings.leisure ?? true}
                onToggle={() => toggle('leisure')}
                groupPosition="middle"
            />
            <SettingsListBoolean
                title="Barrieren & Sperren"
                leftIcon={<MaterialCommunityIcons name="boom-gate" size={20} color={theme.screen.icon} />}
                isEnabled={showSettings.barriers ?? true}
                onToggle={() => toggle('barriers')}
                groupPosition="middle"
            />
            <SettingsListBoolean
                title="Straßennamen"
                leftIcon={<MaterialCommunityIcons name="road" size={20} color={theme.screen.icon} />}
                isEnabled={showSettings.roadNames ?? true}
                onToggle={() => toggle('roadNames')}
                groupPosition="bottom"
            />
        </>
    );
};

export default SettingsGroupMyMapGeneralMarkers;
