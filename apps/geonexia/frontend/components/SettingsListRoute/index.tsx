import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsList } from 'repo-depkit-common-ui';

import { SavedRoute } from '../../helpers/RouteStorage';
import { computeRouteLengthKm, formatDistanceKm } from '../../helpers/H3Helper';

const PRIMARY_COLOR = '#2563eb';
const ICON_COLOR = '#ffffff';
const CHEVRON_COLOR = '#9ca3af';

function buildRouteMeta(route: SavedRoute, activityCount: number): string {
	const distanceKm = computeRouteLengthKm(route.hexTiles);
	const distStr = distanceKm > 0 ? formatDistanceKm(distanceKm) : '0 km';
	const activityStr = `${activityCount} ${activityCount === 1 ? 'Activity' : 'Activities'}`;
	return `${distStr} · ${activityStr}`;
}

type Props = {
	route: SavedRoute;
	/** Actual number of activities associated with this route. */
	activityCount?: number;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	showSeparator?: boolean;
	onPress?: () => void;
};

const SettingsListRoute: React.FC<Props> = ({ route, activityCount, groupPosition, showSeparator, onPress }) => {
	return (
		<SettingsList
			leftIcon={<MaterialIcons name="route" size={20} color={ICON_COLOR} />}
			iconBackgroundColor={PRIMARY_COLOR}
			title={route.name}
			value={buildRouteMeta(route, activityCount ?? route.activityIds?.length ?? 0)}
			rightIcon={<MaterialIcons name="chevron-right" size={20} color={CHEVRON_COLOR} />}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			onPress={onPress}
		/>
	);
};

export default SettingsListRoute;
