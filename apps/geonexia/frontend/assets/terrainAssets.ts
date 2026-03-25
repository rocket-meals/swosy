import { ImageSourcePropType } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TerrainCategory = 'Grass' | 'Stone' | 'Sand' | 'Dirt' | 'Mars';

export type TerrainAssetEntry = {
	/** Unique key used to persist the selection (e.g. "Grass/grass_01") */
	key: string;
	source: ImageSourcePropType;
};

// ─── Static asset registry ────────────────────────────────────────────────────
//
// All require() calls must be static literals so Metro can bundle them.

export const TERRAIN_ASSETS: Record<TerrainCategory, TerrainAssetEntry[]> = {
	Grass: [
		{ key: 'Grass/grass_01', source: require('./terrain/Grass/grass_01.png') },
		{ key: 'Grass/grass_02', source: require('./terrain/Grass/grass_02.png') },
		{ key: 'Grass/grass_03', source: require('./terrain/Grass/grass_03.png') },
		{ key: 'Grass/grass_04', source: require('./terrain/Grass/grass_04.png') },
		{ key: 'Grass/grass_05', source: require('./terrain/Grass/grass_05.png') },
		{ key: 'Grass/grass_06', source: require('./terrain/Grass/grass_06.png') },
		{ key: 'Grass/grass_07', source: require('./terrain/Grass/grass_07.png') },
		{ key: 'Grass/grass_08', source: require('./terrain/Grass/grass_08.png') },
		{ key: 'Grass/grass_09', source: require('./terrain/Grass/grass_09.png') },
		{ key: 'Grass/grass_10', source: require('./terrain/Grass/grass_10.png') },
		{ key: 'Grass/grass_11', source: require('./terrain/Grass/grass_11.png') },
		{ key: 'Grass/grass_12', source: require('./terrain/Grass/grass_12.png') },
		{ key: 'Grass/grass_13', source: require('./terrain/Grass/grass_13.png') },
		{ key: 'Grass/grass_14', source: require('./terrain/Grass/grass_14.png') },
		{ key: 'Grass/grass_15', source: require('./terrain/Grass/grass_15.png') },
		{ key: 'Grass/grass_16', source: require('./terrain/Grass/grass_16.png') },
		{ key: 'Grass/grass_17', source: require('./terrain/Grass/grass_17.png') },
		{ key: 'Grass/grass_18', source: require('./terrain/Grass/grass_18.png') },
		{ key: 'Grass/grass_19', source: require('./terrain/Grass/grass_19.png') },
	],
	Stone: [
		{ key: 'Stone/stone_01', source: require('./terrain/Stone/stone_01.png') },
		{ key: 'Stone/stone_02', source: require('./terrain/Stone/stone_02.png') },
		{ key: 'Stone/stone_03', source: require('./terrain/Stone/stone_03.png') },
		{ key: 'Stone/stone_04', source: require('./terrain/Stone/stone_04.png') },
		{ key: 'Stone/stone_05', source: require('./terrain/Stone/stone_05.png') },
		{ key: 'Stone/stone_06', source: require('./terrain/Stone/stone_06.png') },
		{ key: 'Stone/stone_07', source: require('./terrain/Stone/stone_07.png') },
		{ key: 'Stone/stone_08', source: require('./terrain/Stone/stone_08.png') },
		{ key: 'Stone/stone_09', source: require('./terrain/Stone/stone_09.png') },
		{ key: 'Stone/stone_10', source: require('./terrain/Stone/stone_10.png') },
		{ key: 'Stone/stone_11', source: require('./terrain/Stone/stone_11.png') },
		{ key: 'Stone/stone_12', source: require('./terrain/Stone/stone_12.png') },
		{ key: 'Stone/stone_13', source: require('./terrain/Stone/stone_13.png') },
		{ key: 'Stone/stone_14', source: require('./terrain/Stone/stone_14.png') },
		{ key: 'Stone/stone_15', source: require('./terrain/Stone/stone_15.png') },
		{ key: 'Stone/stone_16', source: require('./terrain/Stone/stone_16.png') },
		{ key: 'Stone/stone_17', source: require('./terrain/Stone/stone_17.png') },
		{ key: 'Stone/stone_18', source: require('./terrain/Stone/stone_18.png') },
		{ key: 'Stone/stone_19', source: require('./terrain/Stone/stone_19.png') },
	],
	Sand: [
		{ key: 'Sand/sand_01', source: require('./terrain/Sand/sand_01.png') },
		{ key: 'Sand/sand_02', source: require('./terrain/Sand/sand_02.png') },
		{ key: 'Sand/sand_03', source: require('./terrain/Sand/sand_03.png') },
		{ key: 'Sand/sand_04', source: require('./terrain/Sand/sand_04.png') },
		{ key: 'Sand/sand_05', source: require('./terrain/Sand/sand_05.png') },
		{ key: 'Sand/sand_06', source: require('./terrain/Sand/sand_06.png') },
		{ key: 'Sand/sand_07', source: require('./terrain/Sand/sand_07.png') },
		{ key: 'Sand/sand_08', source: require('./terrain/Sand/sand_08.png') },
		{ key: 'Sand/sand_09', source: require('./terrain/Sand/sand_09.png') },
		{ key: 'Sand/sand_10', source: require('./terrain/Sand/sand_10.png') },
		{ key: 'Sand/sand_11', source: require('./terrain/Sand/sand_11.png') },
		{ key: 'Sand/sand_12', source: require('./terrain/Sand/sand_12.png') },
		{ key: 'Sand/sand_13', source: require('./terrain/Sand/sand_13.png') },
		{ key: 'Sand/sand_14', source: require('./terrain/Sand/sand_14.png') },
		{ key: 'Sand/sand_15', source: require('./terrain/Sand/sand_15.png') },
		{ key: 'Sand/sand_16', source: require('./terrain/Sand/sand_16.png') },
		{ key: 'Sand/sand_17', source: require('./terrain/Sand/sand_17.png') },
		{ key: 'Sand/sand_18', source: require('./terrain/Sand/sand_18.png') },
		{ key: 'Sand/sand_19', source: require('./terrain/Sand/sand_19.png') },
	],
	Dirt: [
		{ key: 'Dirt/dirt_01', source: require('./terrain/Dirt/dirt_01.png') },
		{ key: 'Dirt/dirt_02', source: require('./terrain/Dirt/dirt_02.png') },
		{ key: 'Dirt/dirt_03', source: require('./terrain/Dirt/dirt_03.png') },
		{ key: 'Dirt/dirt_04', source: require('./terrain/Dirt/dirt_04.png') },
		{ key: 'Dirt/dirt_05', source: require('./terrain/Dirt/dirt_05.png') },
		{ key: 'Dirt/dirt_06', source: require('./terrain/Dirt/dirt_06.png') },
		{ key: 'Dirt/dirt_07', source: require('./terrain/Dirt/dirt_07.png') },
		{ key: 'Dirt/dirt_08', source: require('./terrain/Dirt/dirt_08.png') },
		{ key: 'Dirt/dirt_09', source: require('./terrain/Dirt/dirt_09.png') },
		{ key: 'Dirt/dirt_10', source: require('./terrain/Dirt/dirt_10.png') },
		{ key: 'Dirt/dirt_11', source: require('./terrain/Dirt/dirt_11.png') },
		{ key: 'Dirt/dirt_12', source: require('./terrain/Dirt/dirt_12.png') },
		{ key: 'Dirt/dirt_13', source: require('./terrain/Dirt/dirt_13.png') },
		{ key: 'Dirt/dirt_14', source: require('./terrain/Dirt/dirt_14.png') },
		{ key: 'Dirt/dirt_15', source: require('./terrain/Dirt/dirt_15.png') },
		{ key: 'Dirt/dirt_16', source: require('./terrain/Dirt/dirt_16.png') },
		{ key: 'Dirt/dirt_17', source: require('./terrain/Dirt/dirt_17.png') },
		{ key: 'Dirt/dirt_18', source: require('./terrain/Dirt/dirt_18.png') },
		{ key: 'Dirt/dirt_19', source: require('./terrain/Dirt/dirt_19.png') },
	],
	Mars: [
		{ key: 'Mars/mars_01', source: require('./terrain/Mars/mars_01.png') },
		{ key: 'Mars/mars_02', source: require('./terrain/Mars/mars_02.png') },
		{ key: 'Mars/mars_03', source: require('./terrain/Mars/mars_03.png') },
		{ key: 'Mars/mars_04', source: require('./terrain/Mars/mars_04.png') },
		{ key: 'Mars/mars_05', source: require('./terrain/Mars/mars_05.png') },
		{ key: 'Mars/mars_06', source: require('./terrain/Mars/mars_06.png') },
		{ key: 'Mars/mars_07', source: require('./terrain/Mars/mars_07.png') },
		{ key: 'Mars/mars_08', source: require('./terrain/Mars/mars_08.png') },
		{ key: 'Mars/mars_09', source: require('./terrain/Mars/mars_09.png') },
		{ key: 'Mars/mars_10', source: require('./terrain/Mars/mars_10.png') },
		{ key: 'Mars/mars_11', source: require('./terrain/Mars/mars_11.png') },
		{ key: 'Mars/mars_12', source: require('./terrain/Mars/mars_12.png') },
		{ key: 'Mars/mars_13', source: require('./terrain/Mars/mars_13.png') },
		{ key: 'Mars/mars_14', source: require('./terrain/Mars/mars_14.png') },
		{ key: 'Mars/mars_15', source: require('./terrain/Mars/mars_15.png') },
		{ key: 'Mars/mars_16', source: require('./terrain/Mars/mars_16.png') },
		{ key: 'Mars/mars_17', source: require('./terrain/Mars/mars_17.png') },
		{ key: 'Mars/mars_18', source: require('./terrain/Mars/mars_18.png') },
		{ key: 'Mars/mars_19', source: require('./terrain/Mars/mars_19.png') },
	],
};

export const TERRAIN_CATEGORIES: TerrainCategory[] = ['Grass', 'Stone', 'Sand', 'Dirt', 'Mars'];
