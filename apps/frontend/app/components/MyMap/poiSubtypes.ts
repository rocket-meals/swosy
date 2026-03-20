export type PoiSubtype = {
    key: string;
    emoji: string;
    label: string;
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

export const POI_SUBTYPES: PoiSubtype[] = [
    { key: 'recycling', emoji: '♻️', label: 'Recycling' },
    { key: 'waste_basket', emoji: '🗑️', label: 'Mülleimer' },
    { key: 'waste_disposal', emoji: '🗑️', label: 'Müllentsorgung' },
    { key: 'bench', emoji: '🪑', label: 'Bänke' },
    { key: 'drinking_water', emoji: '🚰', label: 'Trinkwasser' },
    { key: 'toilets', emoji: '🚻', label: 'Toiletten' },
    { key: 'telephone', emoji: '☎️', label: 'Telefon' },
    { key: 'vending_machine', emoji: '🎰', label: 'Automaten' },
    { key: 'basin', emoji: '🪣', label: 'Becken' },
    { key: 'chess', emoji: '♟️', label: 'Schach' },
    { key: 'shelter', emoji: '🏠', label: 'Unterstand' },
    { key: 'fountain', emoji: '⛲', label: 'Brunnen' },
    { key: 'clock', emoji: '🕰️', label: 'Uhren' },
    { key: 'viewpoint', emoji: '👁️', label: 'Aussichtspunkte' },
    { key: 'information', emoji: 'ℹ️', label: 'Information' },
];
