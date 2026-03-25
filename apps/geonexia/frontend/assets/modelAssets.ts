// ─── Static model asset registry ─────────────────────────────────────────────
//
// Maps every model key (used in HexTileRecord.model) to a static require() for
// its .glb file so that Metro can bundle the assets.
//
// All require() calls MUST be static literals – Metro resolves them at build
// time and cannot handle dynamic/computed require() paths.

export const MODEL_ASSETS: Record<string, number> = {
	'bridge': require('./models/bridge.glb'),

	// Buildings
	'building-archery': require('./models/building-archery.glb'),
	'building-cabin': require('./models/building-cabin.glb'),
	'building-castle': require('./models/building-castle.glb'),
	'building-dock': require('./models/building-dock.glb'),
	'building-farm': require('./models/building-farm.glb'),
	'building-house': require('./models/building-house.glb'),
	'building-market': require('./models/building-market.glb'),
	'building-mill': require('./models/building-mill.glb'),
	'building-mine': require('./models/building-mine.glb'),
	'building-port': require('./models/building-port.glb'),
	'building-sheep': require('./models/building-sheep.glb'),
	'building-smelter': require('./models/building-smelter.glb'),
	'building-tower': require('./models/building-tower.glb'),
	'building-village': require('./models/building-village.glb'),
	'building-wall': require('./models/building-wall.glb'),
	'building-walls': require('./models/building-walls.glb'),
	'building-watermill': require('./models/building-watermill.glb'),
	'building-wizard-tower': require('./models/building-wizard-tower.glb'),

	// Terrain
	'dirt': require('./models/dirt.glb'),
	'dirt-lumber': require('./models/dirt-lumber.glb'),
	'grass': require('./models/grass.glb'),
	'grass-forest': require('./models/grass-forest.glb'),
	'grass-hill': require('./models/grass-hill.glb'),
	'sand': require('./models/sand.glb'),
	'sand-desert': require('./models/sand-desert.glb'),
	'sand-rocks': require('./models/sand-rocks.glb'),
	'stone': require('./models/stone.glb'),
	'stone-hill': require('./models/stone-hill.glb'),
	'stone-mountain': require('./models/stone-mountain.glb'),
	'stone-rocks': require('./models/stone-rocks.glb'),
	'water': require('./models/water.glb'),
	'water-island': require('./models/water-island.glb'),
	'water-rocks': require('./models/water-rocks.glb'),

	// Paths
	'path-corner': require('./models/path-corner.glb'),
	'path-corner-sharp': require('./models/path-corner-sharp.glb'),
	'path-crossing': require('./models/path-crossing.glb'),
	'path-end': require('./models/path-end.glb'),
	'path-intersectionA': require('./models/path-intersectionA.glb'),
	'path-intersectionB': require('./models/path-intersectionB.glb'),
	'path-intersectionC': require('./models/path-intersectionC.glb'),
	'path-intersectionD': require('./models/path-intersectionD.glb'),
	'path-intersectionE': require('./models/path-intersectionE.glb'),
	'path-intersectionF': require('./models/path-intersectionF.glb'),
	'path-intersectionG': require('./models/path-intersectionG.glb'),
	'path-intersectionH': require('./models/path-intersectionH.glb'),
	'path-square': require('./models/path-square.glb'),
	'path-square-end': require('./models/path-square-end.glb'),
	'path-start': require('./models/path-start.glb'),
	'path-straight': require('./models/path-straight.glb'),

	// Rivers
	'river-corner': require('./models/river-corner.glb'),
	'river-corner-sharp': require('./models/river-corner-sharp.glb'),
	'river-crossing': require('./models/river-crossing.glb'),
	'river-end': require('./models/river-end.glb'),
	'river-intersectionA': require('./models/river-intersectionA.glb'),
	'river-intersectionB': require('./models/river-intersectionB.glb'),
	'river-intersectionC': require('./models/river-intersectionC.glb'),
	'river-intersectionD': require('./models/river-intersectionD.glb'),
	'river-intersectionE': require('./models/river-intersectionE.glb'),
	'river-intersectionF': require('./models/river-intersectionF.glb'),
	'river-intersectionG': require('./models/river-intersectionG.glb'),
	'river-intersectionH': require('./models/river-intersectionH.glb'),
	'river-start': require('./models/river-start.glb'),
	'river-straight': require('./models/river-straight.glb'),

	// Units
	'unit-house': require('./models/unit-house.glb'),
	'unit-mansion': require('./models/unit-mansion.glb'),
	'unit-mill': require('./models/unit-mill.glb'),
	'unit-ship': require('./models/unit-ship.glb'),
	'unit-ship-large': require('./models/unit-ship-large.glb'),
	'unit-tower': require('./models/unit-tower.glb'),
	'unit-tree': require('./models/unit-tree.glb'),
	'unit-wall-tower': require('./models/unit-wall-tower.glb'),
};
