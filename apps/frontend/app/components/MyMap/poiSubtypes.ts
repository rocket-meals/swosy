import { TranslationKeys } from '@/locales/keys';

export type PoiSubtype = {
    key: string;
    emoji: string;
    labelKey: TranslationKeys;
};

// All icon keys from ICON_EMOJI_MAP that belong to the "barriers" group.
// When the barriers layer-group toggle is turned off, all of these are removed
// from the MapLibre image registry so the emoji markers disappear.
export const BARRIER_ICON_KEYS: string[] = [
    'gate',
    'bollard',
    'cycle_barrier',
    'lift_gate',
    'sally_port',
    'swing_gate',
    'jersey_barrier',
    'debris',
    'kissing_gate',
    'turnstile',
    'full-height_turnstile',
    'stile',
    'cattle_grid',
    'height_restrictor',
    'log',
];

// All icon keys from ICON_EMOJI_MAP that belong to the "parking" group.
// Parking emoji markers are rendered via ICON_EMOJI_MAP just like POI markers,
// so visibility must be controlled through poiIconOverrides (not setLayerGroupVisibility).
export const PARKING_ICON_KEYS: string[] = [
    'bicycle_parking',
    'motorcycle_parking',
    'parking',
    'parking_entrance',
    'parking_space',
    'bicycle_rental',
];

export const POI_SUBTYPES: PoiSubtype[] = [
    { key: 'recycling', emoji: '♻️', labelKey: TranslationKeys.poi_recycling },
    { key: 'waste_basket', emoji: '🗑️', labelKey: TranslationKeys.poi_waste_basket },
    { key: 'waste_disposal', emoji: '🗑️', labelKey: TranslationKeys.poi_waste_disposal },
    { key: 'bench', emoji: '🪑', labelKey: TranslationKeys.poi_bench },
    { key: 'drinking_water', emoji: '🚰', labelKey: TranslationKeys.poi_drinking_water },
    { key: 'toilets', emoji: '🚻', labelKey: TranslationKeys.poi_toilets },
    { key: 'telephone', emoji: '☎️', labelKey: TranslationKeys.poi_telephone },
    { key: 'vending_machine', emoji: '🎰', labelKey: TranslationKeys.poi_vending_machine },
    { key: 'basin', emoji: '🪣', labelKey: TranslationKeys.poi_basin },
    { key: 'chess', emoji: '♟️', labelKey: TranslationKeys.poi_chess },
    { key: 'shelter', emoji: '🏠', labelKey: TranslationKeys.poi_shelter },
    { key: 'fountain', emoji: '⛲', labelKey: TranslationKeys.poi_fountain },
    { key: 'clock', emoji: '🕰️', labelKey: TranslationKeys.poi_clock },
    { key: 'viewpoint', emoji: '👁️', labelKey: TranslationKeys.poi_viewpoint },
    { key: 'information', emoji: 'ℹ️', labelKey: TranslationKeys.information },
];
