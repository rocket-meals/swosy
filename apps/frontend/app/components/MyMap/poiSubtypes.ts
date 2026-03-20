export type PoiSubtype = {
    key: string;
    emoji: string;
    label: string;
};

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
