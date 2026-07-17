/**
 * Minimal type declarations for pbf and @mapbox/vector-tile.
 *
 * These are kept local to the geonexia workspace instead of using
 * @types/pbf and @types/mapbox__vector-tile in devDependencies,
 * because Yarn workspaces hoists @types/* packages to the root
 * node_modules which breaks the backend TypeScript build.
 */

declare module 'pbf' {
	class Pbf {
		constructor(buffer?: Uint8Array | ArrayBuffer);
	}
	export = Pbf;
}

declare module '@mapbox/vector-tile' {
	import type Pbf from 'pbf';

	type VectorTileGeoJSONGeometry =
		| { type: 'Point'; coordinates: [number, number] }
		| { type: 'MultiPoint'; coordinates: [number, number][] }
		| { type: 'LineString'; coordinates: [number, number][] }
		| { type: 'MultiLineString'; coordinates: [number, number][][] }
		| { type: 'Polygon'; coordinates: [number, number][][] }
		| { type: 'MultiPolygon'; coordinates: [number, number][][][] };

	export class VectorTileFeature {
		properties: Record<string, number | string | boolean>;
		extent: number;
		type: 0 | 1 | 2 | 3;
		id: number | undefined;
		/** Return the bounding box of the feature geometry in tile coordinates [x1, y1, x2, y2]. */
		bbox(): [number, number, number, number];
		/** Convert the feature geometry to GeoJSON lng/lat coordinates, given its tile's x/y/z. */
		toGeoJSON(x: number, y: number, z: number): {
			type: 'Feature';
			geometry: VectorTileGeoJSONGeometry;
			properties: Record<string, number | string | boolean>;
		};
	}

	export class VectorTileLayer {
		version: number;
		name: string;
		extent: number;
		length: number;
		feature(i: number): VectorTileFeature;
	}

	export class VectorTile {
		constructor(pbf: Pbf, end?: number);
		layers: Record<string, VectorTileLayer>;
	}
}
