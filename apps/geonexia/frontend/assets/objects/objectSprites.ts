// Individual SVG object sprites for the Geonexia map.
// Each entry maps a numeric index (used in the billboard key "objects:N") to a named SVG file.
// require() calls must be static literals so Metro can bundle them.

export interface ObjectSprite {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	source: any;
	/** Scale factor relative to townhall (viewBox width ~94.65 = 7×). */
	scaleFactor: number;
}

export const OBJECT_SPRITES: ObjectSprite[] = [
	{ name: 'anvil', source: require('./anvil.svg'), scaleFactor: 2.97 }, // 0
	{ name: 'archway', source: require('./archway.svg'), scaleFactor: 5.0 }, // 1
	{ name: 'archway2', source: require('./archway2.svg'), scaleFactor: 5.0 }, // 2
	{ name: 'archwayStone', source: require('./archwayStone.svg'), scaleFactor: 6.65 }, // 3
	{ name: 'bank', source: require('./bank.svg'), scaleFactor: 8.46 }, // 4
	{ name: 'barn1', source: require('./barn1.svg'), scaleFactor: 5.61 }, // 5
	{ name: 'barn1Small', source: require('./barn1Small.svg'), scaleFactor: 5.07 }, // 6
	{ name: 'barn2', source: require('./barn2.svg'), scaleFactor: 7.35 }, // 7
	{ name: 'bench', source: require('./bench.svg'), scaleFactor: 3.98 }, // 8
	{ name: 'buildingConstructionLarge', source: require('./buildingConstructionLarge.svg'), scaleFactor: 10.22 }, // 9
	{ name: 'buildingConstructionSmall', source: require('./buildingConstructionSmall.svg'), scaleFactor: 6.57 }, // 10
	{ name: 'castle1', source: require('./castle1.svg'), scaleFactor: 8.79 }, // 11
	{ name: 'castle2', source: require('./castle2.svg'), scaleFactor: 8.78 }, // 12
	{ name: 'castle3', source: require('./castle3.svg'), scaleFactor: 9.32 }, // 13
	{ name: 'factory', source: require('./factory.svg'), scaleFactor: 8.33 }, // 14
	{ name: 'fairgroundHut', source: require('./fairgroundHut.svg'), scaleFactor: 3.17 }, // 15
	{ name: 'farm1', source: require('./farm1.svg'), scaleFactor: 5.08 }, // 16
	{ name: 'farmland', source: require('./farmland.svg'), scaleFactor: 5.8 }, // 17
	{ name: 'fire', source: require('./fire.svg'), scaleFactor: 2.77 }, // 18
	{ name: 'fountain', source: require('./fountain.svg'), scaleFactor: 4.81 }, // 19
	{ name: 'furnace', source: require('./furnace.svg'), scaleFactor: 4.59 }, // 20
	{ name: 'hedge1', source: require('./hedge1.svg'), scaleFactor: 10.22 }, // 21
	{ name: 'house1', source: require('./house1.svg'), scaleFactor: 4.76 }, // 22
	{ name: 'houseLarge', source: require('./houseLarge.svg'), scaleFactor: 7.52 }, // 23
	{ name: 'houseMedium', source: require('./houseMedium.svg'), scaleFactor: 6.43 }, // 24
	{ name: 'houseModern1', source: require('./houseModern1.svg'), scaleFactor: 8.29 }, // 25
	{ name: 'houseModern2Small', source: require('./houseModern2Small.svg'), scaleFactor: 5.28 }, // 26
	{ name: 'houseSmall', source: require('./houseSmall.svg'), scaleFactor: 5.59 }, // 27
	{ name: 'mineEntrance', source: require('./mineEntrance.svg'), scaleFactor: 4.69 }, // 28
	{ name: 'mountain1', source: require('./mountain1.svg'), scaleFactor: 4.44 }, // 29
	{ name: 'mountain2', source: require('./mountain2.svg'), scaleFactor: 4.33 }, // 30
	{ name: 'mountain3', source: require('./mountain3.svg'), scaleFactor: 5.23 }, // 31
	{ name: 'ruin', source: require('./ruin.svg'), scaleFactor: 5.12 }, // 32
	{ name: 'shop', source: require('./shop.svg'), scaleFactor: 6.96 }, // 33
	{ name: 'signPost', source: require('./signPost.svg'), scaleFactor: 2.77 }, // 34
	{ name: 'silo', source: require('./silo.svg'), scaleFactor: 4.56 }, // 35
	{ name: 'stone1', source: require('./stone1.svg'), scaleFactor: 3.32 }, // 36
	{ name: 'stone2', source: require('./stone2.svg'), scaleFactor: 3.41 }, // 37
	{ name: 'stone3', source: require('./stone3.svg'), scaleFactor: 3.44 }, // 38
	{ name: 'stone4', source: require('./stone4.svg'), scaleFactor: 3.69 }, // 39
	{ name: 'stone5', source: require('./stone5.svg'), scaleFactor: 3.78 }, // 40
	{ name: 'stone6', source: require('./stone6.svg'), scaleFactor: 3.74 }, // 41
	{ name: 'stoneLarge', source: require('./stoneLarge.svg'), scaleFactor: 5.47 }, // 42
	{ name: 'streetlight', source: require('./streetlight.svg'), scaleFactor: 2.78 }, // 43
	{ name: 'tent', source: require('./tent.svg'), scaleFactor: 4.2 }, // 44
	{ name: 'tent2front', source: require('./tent2front.svg'), scaleFactor: 4.52 }, // 45
	{ name: 'tower', source: require('./tower.svg'), scaleFactor: 4.99 }, // 46
	{ name: 'townhall', source: require('./townhall.svg'), scaleFactor: 7.0 }, // 47
	{ name: 'trainstation', source: require('./trainstation.svg'), scaleFactor: 9.33 }, // 48
	{ name: 'treeLargeCube', source: require('./treeLargeCube.svg'), scaleFactor: 3.02 }, // 49
	{ name: 'treePineLarge', source: require('./treePineLarge.svg'), scaleFactor: 3.32 }, // 50
	{ name: 'treePineSmall', source: require('./treePineSmall.svg'), scaleFactor: 2.48 }, // 51
	{ name: 'treeSmallCube', source: require('./treeSmallCube.svg'), scaleFactor: 2.97 }, // 52
	{ name: 'voratsSilo', source: require('./voratsSilo.svg'), scaleFactor: 4.49 }, // 53
	{ name: 'windmillComplete', source: require('./windmillComplete.svg'), scaleFactor: 5.29 }, // 54
	{ name: 'woodLogs', source: require('./woodLogs.svg'), scaleFactor: 4.09 }, // 55
	{ name: 'farmFieldFull', source: require('./farmFieldFull.svg'), scaleFactor: 5.57 }, // 56
];
