// Static registry of all GLB 3-D model assets.
// All require() calls must be static literals so Metro can bundle them.

export type GlbModelEntry = {
	/** Display name shown in the picker */
	label: string;
	/** Unique key / id used for the GLB layer on the map */
	key: string;
	/** Metro asset require handle */
	source: number;
};

const MODELS: GlbModelEntry[] = [
	{ key: 'arrow', label: 'Arrow', source: require('./3dmodels/arrow.glb') },
	{ key: 'arrow-standing', label: 'Arrow Standing', source: require('./3dmodels/arrow-standing.glb') },
	{ key: 'boat-fan', label: 'Boat Fan', source: require('./3dmodels/boat-fan.glb') },
	{ key: 'boat-fishing-small', label: 'Boat Fishing Small', source: require('./3dmodels/boat-fishing-small.glb') },
	{ key: 'boat-house-a', label: 'Boat House A', source: require('./3dmodels/boat-house-a.glb') },
	{ key: 'boat-house-b', label: 'Boat House B', source: require('./3dmodels/boat-house-b.glb') },
	{ key: 'boat-house-c', label: 'Boat House C', source: require('./3dmodels/boat-house-c.glb') },
	{ key: 'boat-house-d', label: 'Boat House D', source: require('./3dmodels/boat-house-d.glb') },
	{ key: 'boat-row-large', label: 'Boat Row Large', source: require('./3dmodels/boat-row-large.glb') },
	{ key: 'boat-row-small', label: 'Boat Row Small', source: require('./3dmodels/boat-row-small.glb') },
	{ key: 'boat-sail-a', label: 'Boat Sail A', source: require('./3dmodels/boat-sail-a.glb') },
	{ key: 'boat-sail-b', label: 'Boat Sail B', source: require('./3dmodels/boat-sail-b.glb') },
	{ key: 'boat-speed-a', label: 'Boat Speed A', source: require('./3dmodels/boat-speed-a.glb') },
	{ key: 'boat-speed-b', label: 'Boat Speed B', source: require('./3dmodels/boat-speed-b.glb') },
	{ key: 'boat-speed-c', label: 'Boat Speed C', source: require('./3dmodels/boat-speed-c.glb') },
	{ key: 'boat-speed-d', label: 'Boat Speed D', source: require('./3dmodels/boat-speed-d.glb') },
	{ key: 'boat-speed-e', label: 'Boat Speed E', source: require('./3dmodels/boat-speed-e.glb') },
	{ key: 'boat-speed-f', label: 'Boat Speed F', source: require('./3dmodels/boat-speed-f.glb') },
	{ key: 'boat-speed-g', label: 'Boat Speed G', source: require('./3dmodels/boat-speed-g.glb') },
	{ key: 'boat-speed-h', label: 'Boat Speed H', source: require('./3dmodels/boat-speed-h.glb') },
	{ key: 'boat-speed-i', label: 'Boat Speed I', source: require('./3dmodels/boat-speed-i.glb') },
	{ key: 'boat-speed-j', label: 'Boat Speed J', source: require('./3dmodels/boat-speed-j.glb') },
	{ key: 'boat-tow-a', label: 'Boat Tow A', source: require('./3dmodels/boat-tow-a.glb') },
	{ key: 'boat-tow-b', label: 'Boat Tow B', source: require('./3dmodels/boat-tow-b.glb') },
	{ key: 'boat-tug-a', label: 'Boat Tug A', source: require('./3dmodels/boat-tug-a.glb') },
	{ key: 'boat-tug-b', label: 'Boat Tug B', source: require('./3dmodels/boat-tug-b.glb') },
	{ key: 'boat-tug-c', label: 'Boat Tug C', source: require('./3dmodels/boat-tug-c.glb') },
	{ key: 'buoy', label: 'Buoy', source: require('./3dmodels/buoy.glb') },
	{ key: 'buoy-flag', label: 'Buoy Flag', source: require('./3dmodels/buoy-flag.glb') },
	{ key: 'cargo-container-a', label: 'Cargo Container A', source: require('./3dmodels/cargo-container-a.glb') },
	{ key: 'cargo-container-b', label: 'Cargo Container B', source: require('./3dmodels/cargo-container-b.glb') },
	{ key: 'cargo-container-c', label: 'Cargo Container C', source: require('./3dmodels/cargo-container-c.glb') },
	{ key: 'cargo-pile-a', label: 'Cargo Pile A', source: require('./3dmodels/cargo-pile-a.glb') },
	{ key: 'cargo-pile-b', label: 'Cargo Pile B', source: require('./3dmodels/cargo-pile-b.glb') },
	{ key: 'gate', label: 'Gate', source: require('./3dmodels/gate.glb') },
	{ key: 'gate-finish', label: 'Gate Finish', source: require('./3dmodels/gate-finish.glb') },
	{ key: 'ramp', label: 'Ramp', source: require('./3dmodels/ramp.glb') },
	{ key: 'ramp-wide', label: 'Ramp Wide', source: require('./3dmodels/ramp-wide.glb') },
	{ key: 'ship-cargo-a', label: 'Ship Cargo A', source: require('./3dmodels/ship-cargo-a.glb') },
	{ key: 'ship-cargo-b', label: 'Ship Cargo B', source: require('./3dmodels/ship-cargo-b.glb') },
	{ key: 'ship-cargo-c', label: 'Ship Cargo C', source: require('./3dmodels/ship-cargo-c.glb') },
	{ key: 'ship-large', label: 'Ship Large', source: require('./3dmodels/ship-large.glb') },
	{ key: 'ship-ocean-liner', label: 'Ship Ocean Liner', source: require('./3dmodels/ship-ocean-liner.glb') },
	{ key: 'ship-ocean-liner-small', label: 'Ship Ocean Liner Small', source: require('./3dmodels/ship-ocean-liner-small.glb') },
	{ key: 'ship-small', label: 'Ship Small', source: require('./3dmodels/ship-small.glb') },
	{ key: 'ship-small-ghost', label: 'Ship Small Ghost', source: require('./3dmodels/ship-small-ghost.glb') },
];

export default MODELS;
