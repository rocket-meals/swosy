/**
 * OpenMapTiles vector-tile schema – layer IDs, class / subclass enums,
 * and feature-filter presets.
 *
 * Based on the official specification at https://openmaptiles.org/schema/
 * and the YAML layer definitions in the openmaptiles/openmaptiles repository.
 */

// ─── Layer IDs ──────────────────────────────────────────────────────────────

/** All standard OpenMapTiles layer identifiers. */
export enum OpenMapTilesLayerId {
	AERODROME_LABEL = 'aerodrome_label',
	AEROWAY = 'aeroway',
	BOUNDARY = 'boundary',
	BUILDING = 'building',
	HOUSENUMBER = 'housenumber',
	LANDCOVER = 'landcover',
	LANDUSE = 'landuse',
	MOUNTAIN_PEAK = 'mountain_peak',
	PARK = 'park',
	PLACE = 'place',
	POI = 'poi',
	TRANSPORTATION = 'transportation',
	TRANSPORTATION_NAME = 'transportation_name',
	WATER = 'water',
	WATER_NAME = 'water_name',
	WATERWAY = 'waterway',
}

// ─── Landcover ──────────────────────────────────────────────────────────────

export enum LandcoverClass {
	FARMLAND = 'farmland',
	GRASS = 'grass',
	ICE = 'ice',
	ROCK = 'rock',
	SAND = 'sand',
	WETLAND = 'wetland',
	WOOD = 'wood',
}

export enum LandcoverSubclass {
	ALLOTMENTS = 'allotments',
	BOG = 'bog',
	FEN = 'fen',
	FIELD = 'field',
	FOREST = 'forest',
	GLACIER = 'glacier',
	HEATH = 'heath',
	MARSH = 'marsh',
	MEADOW = 'meadow',
	ORCHARD = 'orchard',
	REEDBED = 'reedbed',
	SCRUB = 'scrub',
	SWAMP = 'swamp',
	VINEYARD = 'vineyard',
}

// ─── Landuse ────────────────────────────────────────────────────────────────

export enum LanduseClass {
	BUS_STATION = 'bus_station',
	CEMETERY = 'cemetery',
	COMMERCIAL = 'commercial',
	DAM = 'dam',
	GARAGES = 'garages',
	HOSPITAL = 'hospital',
	INDUSTRIAL = 'industrial',
	MILITARY = 'military',
	PITCH = 'pitch',
	PLAYGROUND = 'playground',
	QUARRY = 'quarry',
	RAILWAY = 'railway',
	RESIDENTIAL = 'residential',
	RETAIL = 'retail',
	SCHOOL = 'school',
	STADIUM = 'stadium',
	THEME_PARK = 'theme_park',
	UNIVERSITY = 'university',
	ZOO = 'zoo',
}

// ─── Transportation ─────────────────────────────────────────────────────────

export enum TransportationClass {
	BUSWAY = 'busway',
	CYCLEWAY = 'cycleway',
	FERRY = 'ferry',
	MINOR = 'minor',
	MOTORWAY = 'motorway',
	PATH = 'path',
	PRIMARY = 'primary',
	RACEWAY = 'raceway',
	RAIL = 'rail',
	SECONDARY = 'secondary',
	SERVICE = 'service',
	TERTIARY = 'tertiary',
	TRACK = 'track',
	TRANSIT = 'transit',
	TRUNK = 'trunk',
}

// ─── Water ──────────────────────────────────────────────────────────────────

export enum WaterClass {
	DOCK = 'dock',
	LAKE = 'lake',
	OCEAN = 'ocean',
	POND = 'pond',
	RIVER = 'river',
	SWIMMING_POOL = 'swimming_pool',
}

// ─── Waterway ───────────────────────────────────────────────────────────────

export enum WaterwayClass {
	CANAL = 'canal',
	DITCH = 'ditch',
	DRAIN = 'drain',
	RIVER = 'river',
	STREAM = 'stream',
}

// ─── Park ───────────────────────────────────────────────────────────────────

export enum ParkClass {
	FOREST = 'forest',
	NATIONAL_PARK = 'national_park',
	NATURE_RESERVE = 'nature_reserve',
	PROTECTED_AREA = 'protected_area',
}

// ─── Place ──────────────────────────────────────────────────────────────────

export enum PlaceClass {
	CITY = 'city',
	COUNTRY = 'country',
	COUNTY = 'county',
	DISTRICT = 'district',
	HAMLET = 'hamlet',
	ISLAND = 'island',
	ISOLATED_DWELLING = 'isolated_dwelling',
	MUNICIPALITY = 'municipality',
	NEIGHBOURHOOD = 'neighbourhood',
	PROVINCE = 'province',
	QUARTER = 'quarter',
	REGION = 'region',
	STATE = 'state',
	SUBURB = 'suburb',
	TOWN = 'town',
	VILLAGE = 'village',
}

// ─── Aeroway ────────────────────────────────────────────────────────────────

export enum AerowayClass {
	AERODROME = 'aerodrome',
	APRON = 'apron',
	GATE = 'gate',
	HELIPAD = 'helipad',
	HELIPORT = 'heliport',
	RUNWAY = 'runway',
	TAXIWAY = 'taxiway',
}

// ─── Boundary ───────────────────────────────────────────────────────────────

export enum BoundaryClass {
	ABORIGINAL_LANDS = 'aboriginal_lands',
	ADMINISTRATIVE = 'administrative',
}

// ─── Feature filter ─────────────────────────────────────────────────────────

/**
 * Options to control which features with `name === null` are included or
 * excluded from query results.
 *
 * When this options object is **not provided** to a query method, no
 * name-based filtering is applied (all features are returned for backward
 * compatibility).
 */
export type MapFeatureFilterOptions = {
	/**
	 * When `true`, include **all** features regardless of whether `name` is null.
	 * When `false` or omitted, features whose `name` is null are filtered out
	 * unless their `layerId` is listed in {@link nameNullAllowList}.
	 *
	 * @default false
	 */
	includeNameNull?: boolean;

	/**
	 * Set of layer IDs for which features with `name === null` should be kept
	 * even when `includeNameNull` is `false`.
	 *
	 * Use one of the provided presets (e.g. {@link ROUTE_NAME_LANDMARK_NAME_NULL_ALLOW})
	 * or supply a custom set.
	 */
	nameNullAllowList?: ReadonlySet<string>;
};

// ─── Filter presets ─────────────────────────────────────────────────────────

/**
 * Layers whose features are relevant for hex-tile-based route name generation
 * **even without** an explicit feature name.
 *
 * Contains natural landmarks such as forests, water bodies, parks, and peaks –
 * but **not** residential, commercial, building, or street features.
 */
export const ROUTE_NAME_LANDMARK_NAME_NULL_ALLOW: ReadonlySet<string> = new Set([
	OpenMapTilesLayerId.LANDCOVER,
	OpenMapTilesLayerId.WATER,
	OpenMapTilesLayerId.WATERWAY,
	OpenMapTilesLayerId.WATER_NAME,
	OpenMapTilesLayerId.PARK,
	OpenMapTilesLayerId.MOUNTAIN_PEAK,
]);
