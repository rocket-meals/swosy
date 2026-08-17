import { parseCoordinatesFromUri, resolveLocationHref, UriScheme } from '../components/CustomMarkdown/MarkdownLinkHelper';

describe('parseCoordinatesFromUri', () => {
	it('parses a plain geo: URI', () => {
		expect(parseCoordinatesFromUri('geo:52.2799,8.0472', UriScheme.GEO)).toEqual({
			latitude: 52.2799,
			longitude: 8.0472,
		});
	});

	it('parses negative coordinates', () => {
		expect(parseCoordinatesFromUri('geo:-33.8688,-151.2093', UriScheme.GEO)).toEqual({
			latitude: -33.8688,
			longitude: -151.2093,
		});
	});

	it('parses integer coordinates', () => {
		expect(parseCoordinatesFromUri('maps:52,8', UriScheme.MAPS)).toEqual({ latitude: 52, longitude: 8 });
	});

	it('is case insensitive about the scheme and tolerates surrounding whitespace', () => {
		expect(parseCoordinatesFromUri('  GEO:52.1,8.2  ', UriScheme.GEO)).toEqual({ latitude: 52.1, longitude: 8.2 });
	});

	it('returns null when the scheme does not match', () => {
		expect(parseCoordinatesFromUri('geo:52.1,8.2', UriScheme.MAPS)).toBeNull();
	});

	it('returns null when fewer than two numbers are present', () => {
		expect(parseCoordinatesFromUri('geo:52.1', UriScheme.GEO)).toBeNull();
		expect(parseCoordinatesFromUri('geo:Osnabrück', UriScheme.GEO)).toBeNull();
	});

	it('returns null for empty input', () => {
		expect(parseCoordinatesFromUri('', UriScheme.GEO)).toBeNull();
	});

	it('stays fast for a long non-matching payload (regex backtracking guard)', () => {
		const pathological = `geo:${'a'.repeat(200_000)}`;
		const start = Date.now();
		expect(parseCoordinatesFromUri(pathological, UriScheme.GEO)).toBeNull();
		expect(Date.now() - start).toBeLessThan(500);
	});
});

describe('resolveLocationHref', () => {
	it('turns a geo: URI into a Google Maps link', () => {
		const resolved = resolveLocationHref('geo:52.2799,8.0472');
		expect(resolved.scheme).toBe(UriScheme.GEO);
		expect(resolved.coordinates).toEqual({ latitude: 52.2799, longitude: 8.0472 });
		expect(resolved.resolvedHref).toBe('https://www.google.com/maps?q=52.2799,8.0472');
	});

	it('turns a maps: URI with a place name into a Maps search link', () => {
		const resolved = resolveLocationHref('maps:Mensa Westerberg');
		expect(resolved.scheme).toBe(UriScheme.MAPS);
		expect(resolved.coordinates).toBeNull();
		expect(resolved.resolvedHref).toBe(
			'https://www.google.com/maps/search/?api=1&query=Mensa%20Westerberg',
		);
	});

	it('trims stray commas from a place-name payload', () => {
		expect(resolveLocationHref('maps:,,Mensa,,').resolvedHref).toBe(
			'https://www.google.com/maps/search/?api=1&query=Mensa',
		);
	});

	it('passes ordinary links through untouched', () => {
		const resolved = resolveLocationHref('https://rocket-meals.de');
		expect(resolved).toEqual({ resolvedHref: 'https://rocket-meals.de', scheme: null, coordinates: null });
	});

	it('trims whitespace around an ordinary link', () => {
		expect(resolveLocationHref('  https://rocket-meals.de  ').resolvedHref).toBe('https://rocket-meals.de');
	});

	it('returns nothing resolvable for empty input', () => {
		for (const href of ['', '   ', null, undefined]) {
			expect(resolveLocationHref(href)).toEqual({ resolvedHref: undefined, scheme: null, coordinates: null });
		}
	});

	it('keeps a geo: URI without any payload as-is', () => {
		expect(resolveLocationHref('geo:')).toEqual({ resolvedHref: 'geo:', scheme: UriScheme.GEO, coordinates: null });
	});
});
