// ─── Types ────────────────────────────────────────────────────────────────────

export type ModelEntry = {
	/** Filename without the .glb extension – used as the persisted key */
	key: string;
	/** Human-readable display label */
	label: string;
};

export type ModelGroup = {
	label: string;
	models: ModelEntry[];
};

// ─── Grouped model list ───────────────────────────────────────────────────────

export const MODEL_GROUPS: ModelGroup[] = [
	{
		label: 'Terrain',
		models: [
			{ key: 'grass', label: 'Grass' },
			{ key: 'grass-forest', label: 'Grass Forest' },
			{ key: 'grass-hill', label: 'Grass Hill' },
			{ key: 'stone', label: 'Stone' },
			{ key: 'stone-hill', label: 'Stone Hill' },
			{ key: 'stone-mountain', label: 'Stone Mountain' },
			{ key: 'stone-rocks', label: 'Stone Rocks' },
			{ key: 'sand', label: 'Sand' },
			{ key: 'sand-desert', label: 'Sand Desert' },
			{ key: 'sand-rocks', label: 'Sand Rocks' },
			{ key: 'dirt', label: 'Dirt' },
			{ key: 'dirt-lumber', label: 'Dirt Lumber' },
			{ key: 'water', label: 'Water' },
			{ key: 'water-island', label: 'Water Island' },
			{ key: 'water-rocks', label: 'Water Rocks' },
		],
	},
	{
		label: 'Buildings',
		models: [
			{ key: 'building-archery', label: 'Archery' },
			{ key: 'building-cabin', label: 'Cabin' },
			{ key: 'building-castle', label: 'Castle' },
			{ key: 'building-dock', label: 'Dock' },
			{ key: 'building-farm', label: 'Farm' },
			{ key: 'building-house', label: 'House' },
			{ key: 'building-market', label: 'Market' },
			{ key: 'building-mill', label: 'Mill' },
			{ key: 'building-mine', label: 'Mine' },
			{ key: 'building-port', label: 'Port' },
			{ key: 'building-sheep', label: 'Sheep Farm' },
			{ key: 'building-smelter', label: 'Smelter' },
			{ key: 'building-tower', label: 'Tower' },
			{ key: 'building-village', label: 'Village' },
			{ key: 'building-wall', label: 'Wall' },
			{ key: 'building-walls', label: 'Walls' },
			{ key: 'building-watermill', label: 'Watermill' },
			{ key: 'building-wizard-tower', label: 'Wizard Tower' },
		],
	},
	{
		label: 'Units',
		models: [
			{ key: 'unit-house', label: 'House' },
			{ key: 'unit-mansion', label: 'Mansion' },
			{ key: 'unit-mill', label: 'Mill' },
			{ key: 'unit-ship', label: 'Ship' },
			{ key: 'unit-ship-large', label: 'Large Ship' },
			{ key: 'unit-tower', label: 'Tower' },
			{ key: 'unit-tree', label: 'Tree' },
			{ key: 'unit-wall-tower', label: 'Wall Tower' },
		],
	},
	{
		label: 'Paths',
		models: [
			{ key: 'path-straight', label: 'Straight' },
			{ key: 'path-corner', label: 'Corner' },
			{ key: 'path-corner-sharp', label: 'Sharp Corner' },
			{ key: 'path-end', label: 'End' },
			{ key: 'path-start', label: 'Start' },
			{ key: 'path-square', label: 'Square' },
			{ key: 'path-square-end', label: 'Square End' },
			{ key: 'path-crossing', label: 'Crossing' },
			{ key: 'path-intersectionA', label: 'Intersection A' },
			{ key: 'path-intersectionB', label: 'Intersection B' },
			{ key: 'path-intersectionC', label: 'Intersection C' },
			{ key: 'path-intersectionD', label: 'Intersection D' },
			{ key: 'path-intersectionE', label: 'Intersection E' },
			{ key: 'path-intersectionF', label: 'Intersection F' },
			{ key: 'path-intersectionG', label: 'Intersection G' },
			{ key: 'path-intersectionH', label: 'Intersection H' },
		],
	},
	{
		label: 'Rivers',
		models: [
			{ key: 'river-straight', label: 'Straight' },
			{ key: 'river-corner', label: 'Corner' },
			{ key: 'river-corner-sharp', label: 'Sharp Corner' },
			{ key: 'river-end', label: 'End' },
			{ key: 'river-start', label: 'Start' },
			{ key: 'river-crossing', label: 'Crossing' },
			{ key: 'river-intersectionA', label: 'Intersection A' },
			{ key: 'river-intersectionB', label: 'Intersection B' },
			{ key: 'river-intersectionC', label: 'Intersection C' },
			{ key: 'river-intersectionD', label: 'Intersection D' },
			{ key: 'river-intersectionE', label: 'Intersection E' },
			{ key: 'river-intersectionF', label: 'Intersection F' },
			{ key: 'river-intersectionG', label: 'Intersection G' },
			{ key: 'river-intersectionH', label: 'Intersection H' },
		],
	},
	{
		label: 'Misc',
		models: [
			{ key: 'bridge', label: 'Bridge' },
		],
	},
];

/** Flat list of all model keys, useful for validation */
export const ALL_MODEL_KEYS: string[] = MODEL_GROUPS.flatMap((g) => g.models.map((m) => m.key));
