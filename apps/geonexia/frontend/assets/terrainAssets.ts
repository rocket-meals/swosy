import { ImageSourcePropType } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TerrainCategory = 'Grass' | 'Stone' | 'Sand' | 'Dirt' | 'Clay' | 'Plains' | 'Forest' | 'Mountain';

export type TerrainAssetEntry = {
	/** Unique key used to persist the selection (e.g. "Grass/grass") */
	key: string;
	source: ImageSourcePropType;
	/** MIME type of the asset. Defaults to 'image/svg+xml' if omitted. */
	mimeType?: string;
};

// ─── Static asset registry ────────────────────────────────────────────────────
//
// All require() calls must be static literals so Metro can bundle them.

export const TERRAIN_ASSETS: Record<TerrainCategory, TerrainAssetEntry[]> = {
	Grass: [{ key: 'Grass/grass', source: require('./terrain/tileGras.svg') }],
	Stone: [{ key: 'Stone/stone', source: require('./terrain/tileStone.svg') }],
	Sand: [{ key: 'Sand/sand', source: require('./terrain/tileSand.svg') }],
	Dirt: [{ key: 'Dirt/dirt', source: require('./terrain/tileDirt.svg') }],
	Clay: [{ key: 'Clay/clay', source: require('./terrain/tileClay.svg') }],
	Plains: [{ key: 'Plains/hexPlains00', source: require('./hexagons/tileBases/hexPlains00.png'), mimeType: 'image/png' }],
	Forest: [{ key: 'Forest/hexForestBroadleaf00', source: require('./hexagons/tileBases/hexForestBroadleaf00.png'), mimeType: 'image/png' }],
	Mountain: [{ key: 'Mountain/hexMountain00', source: require('./hexagons/tileBases/hexMountain00.png'), mimeType: 'image/png' }],
};

export const TERRAIN_CATEGORIES: TerrainCategory[] = ['Grass', 'Stone', 'Sand', 'Dirt', 'Clay', 'Plains', 'Forest', 'Mountain'];
