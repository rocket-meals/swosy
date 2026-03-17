/** Sentinel value used to represent "no virtual zoom" in the options list. */
export const VIRTUAL_ZOOM_NONE_KEY = 'none';

/** Options for the virtual zoom dropdown: "Kein Virtueller Zoom" followed by zoom levels 20 down to 1. */
export const VIRTUAL_ZOOM_OPTIONS = [
	{ id: VIRTUAL_ZOOM_NONE_KEY, label: 'Kein Virtueller Zoom' },
	...Array.from({ length: 20 }, (_, i) => {
		const zoom = 20 - i;
		return { id: String(zoom), label: String(zoom) };
	}),
];
