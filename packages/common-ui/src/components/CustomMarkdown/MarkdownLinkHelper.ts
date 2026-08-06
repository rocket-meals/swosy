// Bounded coordinate pattern: `-?\d+(?:\.\d+)?` cannot backtrack pathologically.
const COORDINATE_PATTERN = /-?\d+(?:\.\d+)?/g;

export enum UriScheme {
	HTTP = 'http:',
	HTTPS = 'https:',
	TEL = 'tel:',
	MAILTO = 'mailto:',
	GEO = 'geo:',
	MAPS = 'maps:',
}

export type ResolvedLocationHref = {
	resolvedHref?: string;
	scheme: UriScheme | null;
	coordinates: { latitude: number; longitude: number } | null;
};

function getGoogleMapsUrl(latitude: number, longitude: number): string {
	return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function parseCoordinatesFromUri(uri: string, scheme: UriScheme): { latitude: number; longitude: number } | null {
	if (!uri) {
		return null;
	}

	const trimmedUri = uri.trim();
	if (!trimmedUri.toLowerCase().startsWith(scheme)) {
		return null;
	}

	const coordinateString = trimmedUri.slice(scheme.length);
	const matches = coordinateString.match(COORDINATE_PATTERN);

	if (!matches || matches.length < 2) {
		return null;
	}

	const [latitudeRaw, longitudeRaw] = matches;
	const latitude = Number.parseFloat(latitudeRaw);
	const longitude = Number.parseFloat(longitudeRaw);

	if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
		return null;
	}

	return { latitude, longitude };
}

export function resolveLocationHref(href: string | null | undefined): ResolvedLocationHref {
	if (!href) {
		return { resolvedHref: undefined, scheme: null, coordinates: null };
	}

	const trimmedHref = href.trim();
	if (!trimmedHref) {
		return { resolvedHref: undefined, scheme: null, coordinates: null };
	}

	const normalizedHref = trimmedHref.toLowerCase();
	const isGeoLink = normalizedHref.startsWith(UriScheme.GEO);
	const isMapsLink = normalizedHref.startsWith(UriScheme.MAPS);

	let scheme: UriScheme | null = null;
	if (isGeoLink) {
		scheme = UriScheme.GEO;
	} else if (isMapsLink) {
		scheme = UriScheme.MAPS;
	}

	if (!scheme) {
		return { resolvedHref: trimmedHref, scheme: null, coordinates: null };
	}

	const coordinatePayload = trimmedHref.slice(scheme.length).trim();
	const coordinates = parseCoordinatesFromUri(trimmedHref, scheme);
	if (coordinates) {
		return { resolvedHref: getGoogleMapsUrl(coordinates.latitude, coordinates.longitude), scheme, coordinates };
	}

	if (coordinatePayload) {
		const fallbackQuery = coordinatePayload.replace(/^[,\s]+|[,\s]+$/g, '');
		if (fallbackQuery) {
			return {
				resolvedHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`,
				scheme,
				coordinates: null,
			};
		}
	}

	return { resolvedHref: trimmedHref, scheme, coordinates: null };
}
