// Individual SVG object sprites for the Geonexia map.
// Each entry maps a numeric index (used in the billboard key "objects:N") to a named SVG file.
// require() calls must be static literals so Metro can bundle them.

export interface ObjectSprite {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	source: any;
}

export const OBJECT_SPRITES: ObjectSprite[] = [
	{ name: 'anvil', source: require('./anvil.svg') }, // 0
	{ name: 'archway', source: require('./archway.svg') }, // 1
	{ name: 'archway2', source: require('./archway2.svg') }, // 2
	{ name: 'archwayStone', source: require('./archwayStone.svg') }, // 3
	{ name: 'bank', source: require('./bank.svg') }, // 4
	{ name: 'barn1', source: require('./barn1.svg') }, // 5
	{ name: 'barn1Small', source: require('./barn1Small.svg') }, // 6
	{ name: 'barn2', source: require('./barn2.svg') }, // 7
	{ name: 'bench', source: require('./bench.svg') }, // 8
	{ name: 'buildingConstructionLarge', source: require('./buildingConstructionLarge.svg') }, // 9
	{ name: 'buildingConstructionSmall', source: require('./buildingConstructionSmall.svg') }, // 10
	{ name: 'castle1', source: require('./castle1.svg') }, // 11
	{ name: 'castle2', source: require('./castle2.svg') }, // 12
	{ name: 'castle3', source: require('./castle3.svg') }, // 13
	{ name: 'factory', source: require('./factory.svg') }, // 14
	{ name: 'fairgroundHut', source: require('./fairgroundHut.svg') }, // 15
	{ name: 'farm1', source: require('./farm1.svg') }, // 16
	{ name: 'farmland', source: require('./farmland.svg') }, // 17
	{ name: 'fire', source: require('./fire.svg') }, // 18
	{ name: 'fountain', source: require('./fountain.svg') }, // 19
	{ name: 'furnace', source: require('./furnace.svg') }, // 20
	{ name: 'hedge1', source: require('./hedge1.svg') }, // 21
	{ name: 'house1', source: require('./house1.svg') }, // 22
	{ name: 'houseLarge', source: require('./houseLarge.svg') }, // 23
	{ name: 'houseMedium', source: require('./houseMedium.svg') }, // 24
	{ name: 'houseModern1', source: require('./houseModern1.svg') }, // 25
	{ name: 'houseModern2Small', source: require('./houseModern2Small.svg') }, // 26
	{ name: 'houseSmall', source: require('./houseSmall.svg') }, // 27
	{ name: 'mineEntrance', source: require('./mineEntrance.svg') }, // 28
	{ name: 'mountain1', source: require('./mountain1.svg') }, // 29
	{ name: 'mountain2', source: require('./mountain2.svg') }, // 30
	{ name: 'mountain3', source: require('./mountain3.svg') }, // 31
	{ name: 'ruin', source: require('./ruin.svg') }, // 32
	{ name: 'shop', source: require('./shop.svg') }, // 33
	{ name: 'signPost', source: require('./signPost.svg') }, // 34
	{ name: 'silo', source: require('./silo.svg') }, // 35
	{ name: 'stone1', source: require('./stone1.svg') }, // 36
	{ name: 'stone2', source: require('./stone2.svg') }, // 37
	{ name: 'stone3', source: require('./stone3.svg') }, // 38
	{ name: 'stone4', source: require('./stone4.svg') }, // 39
	{ name: 'stone5', source: require('./stone5.svg') }, // 40
	{ name: 'stone6', source: require('./stone6.svg') }, // 41
	{ name: 'stoneLarge', source: require('./stoneLarge.svg') }, // 42
	{ name: 'streetlight', source: require('./streetlight.svg') }, // 43
	{ name: 'tent', source: require('./tent.svg') }, // 44
	{ name: 'tent2front', source: require('./tent2front.svg') }, // 45
	{ name: 'tower', source: require('./tower.svg') }, // 46
	{ name: 'townhall', source: require('./townhall.svg') }, // 47
	{ name: 'trainstation', source: require('./trainstation.svg') }, // 48
	{ name: 'treeLargeCube', source: require('./treeLargeCube.svg') }, // 49
	{ name: 'treePineLarge', source: require('./treePineLarge.svg') }, // 50
	{ name: 'treePineSmall', source: require('./treePineSmall.svg') }, // 51
	{ name: 'treeSmallCube', source: require('./treeSmallCube.svg') }, // 52
	{ name: 'voratsSilo', source: require('./voratsSilo.svg') }, // 53
	{ name: 'windmillComplete', source: require('./windmillComplete.svg') }, // 54
	{ name: 'woodLogs', source: require('./woodLogs.svg') }, // 55
];
