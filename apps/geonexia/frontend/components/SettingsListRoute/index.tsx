import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsList } from 'repo-depkit-common-ui';

import { SavedRoute } from '../../helpers/RouteStorage';
import { computeRouteLengthKm, formatDistanceKm } from '../../helpers/H3Helper';

const PRIMARY_COLOR = '#2563eb';
const ICON_COLOR = '#ffffff';
const CHEVRON_COLOR = '#9ca3af';

function formatRouteDate(timestamp: number): string {
	const d = new Date(timestamp);
	return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildRouteMeta(route: SavedRoute): string {
	const dateStr = formatRouteDate(route.createdAt);
	const tileCount = route.hexTiles.length;
	const distanceKm = computeRouteLengthKm(route.hexTiles);
	const distStr = distanceKm > 0 ? ` · ${formatDistanceKm(distanceKm)}` : '';
	const sportStr = route.sportType ? ` · ${route.sportType}` : '';
	return `${dateStr} · ${tileCount} tile${tileCount !== 1 ? 's' : ''}${distStr} · Res ${route.h3Resolution}${sportStr}`;
}

type Props = {
	route: SavedRoute;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	showSeparator?: boolean;
	onPress?: () => void;
};

const SettingsListRoute: React.FC<Props> = ({ route, groupPosition, showSeparator, onPress }) => {
	return (
		<SettingsList
			leftIcon={<MaterialIcons name="route" size={20} color={ICON_COLOR} />}
			iconBackgroundColor={PRIMARY_COLOR}
			title={route.name}
			value={buildRouteMeta(route)}
			rightIcon={<MaterialIcons name="chevron-right" size={20} color={CHEVRON_COLOR} />}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			onPress={onPress}
		/>
	);
};

export default SettingsListRoute;
