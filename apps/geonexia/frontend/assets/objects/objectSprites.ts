// Individual SVG object sprites for the Geonexia map.
// Each entry maps a numeric index (used in the billboard key "objects:N") to a named SVG file.
// require() calls must be static literals so Metro can bundle them.

export interface ObjectSprite {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	source: any;
	/** Scale factor relative to townhall (viewBox width ~94.65 = 7×). */
	scaleFactor: number;
	/**
	 * Vertical anchor as a fraction of the rendered image height (0 = top, 1 = bottom).
	 * The geographic map coordinate attaches at this Y position of the rendered sprite.
	 * Derived from the `anchor-point` circle in each SVG, accounting for letterboxing inside
	 * the square marker element when the sprite's aspect ratio is not 1:1.
	 */
	anchorY: number;
}

export const OBJECT_SPRITES: ObjectSprite[] = [
	{ name: 'anvil', source: require('./anvil.svg'), scaleFactor: 2.97, anchorY: 0.75 }, // 0
	{ name: 'archway', source: require('./archway.svg'), scaleFactor: 5.0, anchorY: 0.85 }, // 1
	{ name: 'archway2', source: require('./archway2.svg'), scaleFactor: 5.0, anchorY: 0.85 }, // 2
	{ name: 'archwayStone', source: require('./archwayStone.svg'), scaleFactor: 6.65, anchorY: 0.88 }, // 3
	{ name: 'bank', source: require('./bank.svg'), scaleFactor: 8.46, anchorY: 0.69 }, // 4
	{ name: 'barn1', source: require('./barn1.svg'), scaleFactor: 5.61, anchorY: 0.72 }, // 5
	{ name: 'barn1Small', source: require('./barn1Small.svg'), scaleFactor: 5.07, anchorY: 0.72 }, // 6
	{ name: 'barn2', source: require('./barn2.svg'), scaleFactor: 7.35, anchorY: 0.72 }, // 7
	{ name: 'bench', source: require('./bench.svg'), scaleFactor: 3.98, anchorY: 0.82 }, // 8
	{ name: 'buildingConstructionLarge', source: require('./buildingConstructionLarge.svg'), scaleFactor: 10.22, anchorY: 0.69 }, // 9
	{ name: 'buildingConstructionSmall', source: require('./buildingConstructionSmall.svg'), scaleFactor: 6.57, anchorY: 0.70 }, // 10
	{ name: 'castle1', source: require('./castle1.svg'), scaleFactor: 8.79, anchorY: 0.75 }, // 11
	{ name: 'castle2', source: require('./castle2.svg'), scaleFactor: 8.78, anchorY: 0.78 }, // 12
	{ name: 'castle3', source: require('./castle3.svg'), scaleFactor: 9.32, anchorY: 0.73 }, // 13
	{ name: 'factory', source: require('./factory.svg'), scaleFactor: 8.33, anchorY: 0.70 }, // 14
	{ name: 'fairgroundHut', source: require('./fairgroundHut.svg'), scaleFactor: 3.17, anchorY: 0.78 }, // 15
	{ name: 'farm1', source: require('./farm1.svg'), scaleFactor: 5.08, anchorY: 0.72 }, // 16
	{ name: 'farmland', source: require('./farmland.svg'), scaleFactor: 5.8, anchorY: 0.68 }, // 17
	{ name: 'fire', source: require('./fire.svg'), scaleFactor: 2.77, anchorY: 0.79 }, // 18
	{ name: 'fountain', source: require('./fountain.svg'), scaleFactor: 4.81, anchorY: 0.83 }, // 19
	{ name: 'furnace', source: require('./furnace.svg'), scaleFactor: 4.59, anchorY: 0.84 }, // 20
	{ name: 'hedge1', source: require('./hedge1.svg'), scaleFactor: 10.22, anchorY: 0.83 }, // 21
	{ name: 'house1', source: require('./house1.svg'), scaleFactor: 4.76, anchorY: 0.70 }, // 22
	{ name: 'houseLarge', source: require('./houseLarge.svg'), scaleFactor: 7.52, anchorY: 0.73 }, // 23
	{ name: 'houseMedium', source: require('./houseMedium.svg'), scaleFactor: 6.43, anchorY: 0.70 }, // 24
	{ name: 'houseModern1', source: require('./houseModern1.svg'), scaleFactor: 8.29, anchorY: 0.67 }, // 25
	{ name: 'houseModern2Small', source: require('./houseModern2Small.svg'), scaleFactor: 5.28, anchorY: 0.72 }, // 26
	{ name: 'houseSmall', source: require('./houseSmall.svg'), scaleFactor: 5.59, anchorY: 0.72 }, // 27
	{ name: 'mineEntrance', source: require('./mineEntrance.svg'), scaleFactor: 4.69, anchorY: 0.84 }, // 28
	{ name: 'mountain1', source: require('./mountain1.svg'), scaleFactor: 4.44, anchorY: 0.84 }, // 29
	{ name: 'mountain2', source: require('./mountain2.svg'), scaleFactor: 4.33, anchorY: 0.86 }, // 30
	{ name: 'mountain3', source: require('./mountain3.svg'), scaleFactor: 5.23, anchorY: 0.86 }, // 31
	{ name: 'ruin', source: require('./ruin.svg'), scaleFactor: 5.12, anchorY: 0.78 }, // 32
	{ name: 'shop', source: require('./shop.svg'), scaleFactor: 6.96, anchorY: 0.71 }, // 33
	{ name: 'signPost', source: require('./signPost.svg'), scaleFactor: 2.77, anchorY: 0.81 }, // 34
	{ name: 'silo', source: require('./silo.svg'), scaleFactor: 4.56, anchorY: 0.87 }, // 35
	{ name: 'stone1', source: require('./stone1.svg'), scaleFactor: 3.32, anchorY: 0.73 }, // 36
	{ name: 'stone2', source: require('./stone2.svg'), scaleFactor: 3.41, anchorY: 0.78 }, // 37
	{ name: 'stone3', source: require('./stone3.svg'), scaleFactor: 3.44, anchorY: 0.78 }, // 38
	{ name: 'stone4', source: require('./stone4.svg'), scaleFactor: 3.69, anchorY: 0.76 }, // 39
	{ name: 'stone5', source: require('./stone5.svg'), scaleFactor: 3.78, anchorY: 0.73 }, // 40
	{ name: 'stone6', source: require('./stone6.svg'), scaleFactor: 3.74, anchorY: 0.79 }, // 41
	{ name: 'stoneLarge', source: require('./stoneLarge.svg'), scaleFactor: 5.47, anchorY: 0.85 }, // 42
	{ name: 'streetlight', source: require('./streetlight.svg'), scaleFactor: 2.78, anchorY: 0.81 }, // 43
	{ name: 'tent', source: require('./tent.svg'), scaleFactor: 4.2, anchorY: 0.82 }, // 44
	{ name: 'tent2front', source: require('./tent2front.svg'), scaleFactor: 4.52, anchorY: 0.83 }, // 45
	{ name: 'tower', source: require('./tower.svg'), scaleFactor: 4.99, anchorY: 0.88 }, // 46
	{ name: 'townhall', source: require('./townhall.svg'), scaleFactor: 7.0, anchorY: 0.72 }, // 47
	{ name: 'trainstation', source: require('./trainstation.svg'), scaleFactor: 9.33, anchorY: 0.67 }, // 48
	{ name: 'treeLargeCube', source: require('./treeLargeCube.svg'), scaleFactor: 3.02, anchorY: 0.82 }, // 49
	{ name: 'treePineLarge', source: require('./treePineLarge.svg'), scaleFactor: 3.32, anchorY: 0.81 }, // 50
	{ name: 'treePineSmall', source: require('./treePineSmall.svg'), scaleFactor: 2.48, anchorY: 0.79 }, // 51
	{ name: 'treeSmallCube', source: require('./treeSmallCube.svg'), scaleFactor: 2.97, anchorY: 0.77 }, // 52
	{ name: 'voratsSilo', source: require('./voratsSilo.svg'), scaleFactor: 4.49, anchorY: 0.87 }, // 53
	{ name: 'windmillComplete', source: require('./windmillComplete.svg'), scaleFactor: 5.29, anchorY: 0.86 }, // 54
	{ name: 'woodLogs', source: require('./woodLogs.svg'), scaleFactor: 4.09, anchorY: 0.76 }, // 55
	{ name: 'farmFieldFull', source: require('./farmFieldFull.svg'), scaleFactor: 5.57, anchorY: 0.70 }, // 56
];
