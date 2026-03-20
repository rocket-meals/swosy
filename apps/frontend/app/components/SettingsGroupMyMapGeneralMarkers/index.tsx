import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import {
    SET_OSM_VECTOR_MAP_SHOW_POI,
    SET_OSM_VECTOR_MAP_SHOW_TRANSIT,
    SET_OSM_VECTOR_MAP_SHOW_ROAD_NAMES,
} from '@/redux/Types/types';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsListBoolean from '@/components/SettingsListBoolean';
import { useTheme } from '@/hooks/useTheme';

const SettingsGroupMyMapGeneralMarkers: React.FC = () => {
    const { theme } = useTheme();
    const dispatch = useDispatch();
    const showPOI = useAppSelector((state) => (state.settings as any).osmVectorMapShowPOI ?? true);
    const showTransit = useAppSelector((state) => (state.settings as any).osmVectorMapShowTransit ?? true);
    const showRoadNames = useAppSelector((state) => (state.settings as any).osmVectorMapShowRoadNames ?? true);

    return (
        <>
            <SettingsGroupTitle>Karten-Ebenen</SettingsGroupTitle>
            <SettingsListBoolean
                title="Shops/POI"
                leftIcon={<MaterialCommunityIcons name="store" size={20} color={theme.screen.icon} />}
                isEnabled={showPOI}
                onToggle={() => dispatch({ type: SET_OSM_VECTOR_MAP_SHOW_POI, payload: !showPOI })}
                groupPosition="top"
            />
            <SettingsListBoolean
                title="Bus/Transit"
                leftIcon={<MaterialCommunityIcons name="bus" size={20} color={theme.screen.icon} />}
                isEnabled={showTransit}
                onToggle={() => dispatch({ type: SET_OSM_VECTOR_MAP_SHOW_TRANSIT, payload: !showTransit })}
                groupPosition="middle"
            />
            <SettingsListBoolean
                title="Straßennamen"
                leftIcon={<MaterialCommunityIcons name="road" size={20} color={theme.screen.icon} />}
                isEnabled={showRoadNames}
                onToggle={() => dispatch({ type: SET_OSM_VECTOR_MAP_SHOW_ROAD_NAMES, payload: !showRoadNames })}
                groupPosition="bottom"
            />
        </>
    );
};

export default SettingsGroupMyMapGeneralMarkers;
