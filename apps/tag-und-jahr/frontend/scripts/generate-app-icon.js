// Generates assets/icons/app_icon_source.png (1024x1024) without any native
// image tooling: the year clock is rasterized per pixel and written as PNG via
// node's built-in zlib. Re-run with `node scripts/generate-app-icon.js` after
// changing the colors in helpers/clockDesign.ts (kept in sync by hand).
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

const SIZE = 1024;
const CENTER = SIZE / 2;

// Same palette as helpers/clockDesign.ts
const BACKGROUND = [0x5d, 0x6b, 0x85];
const YEAR_DISC = [0xe6, 0xa8, 0x3c];
const DAY_DISC = [0x6b, 0x4a, 0x2c];
const YEAR_MARK = [0xc1, 0x27, 0x1c];
const DAY_DOT = [0x2f, 0xa6, 0xa0];
const DAY_DOT_RING = [0xd8, 0xdd, 0xe4];

// Proportions relative to the clock diameter (see components/YearClock.tsx)
const CLOCK_DIAMETER = 0.92 * SIZE;
const YEAR_RADIUS = CLOCK_DIAMETER / 2;
const DAY_RADIUS = 0.32 * CLOCK_DIAMETER;
const MARK_WIDTH = 0.035 * CLOCK_DIAMETER;
const MARK_HEIGHT = 0.1 * CLOCK_DIAMETER;
const MARK_CENTER_RADIUS = 0.41 * CLOCK_DIAMETER;
const DOT_RADIUS = 0.028 * CLOCK_DIAMETER;
const DOT_RING_RADIUS = 0.036 * CLOCK_DIAMETER;
const DOT_CENTER_RADIUS = 0.2 * CLOCK_DIAMETER;
// The icon shows the dot at a fixed, friendly position (about 07:30 of the day)
const DOT_ANGLE_DEG = 217;

function smoothstep(edge0, edge1, x) {
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

// 1 inside the circle, 0 outside, ~1px soft edge
function circleCoverage(px, py, cx, cy, radius) {
	const dist = Math.hypot(px - cx, py - cy);
	return 1 - smoothstep(radius - 1, radius + 1, dist);
}

// Vertical capsule of width w / height h centered at (cx, cy)
function capsuleCoverage(px, py, cx, cy, w, h) {
	const halfCore = (h - w) / 2;
	const clampedY = Math.min(halfCore, Math.max(-halfCore, py - cy));
	const dist = Math.hypot(px - cx, py - cy - clampedY);
	return 1 - smoothstep(w / 2 - 1, w / 2 + 1, dist);
}

function blend(base, color, coverage) {
	return [
		base[0] + (color[0] - base[0]) * coverage,
		base[1] + (color[1] - base[1]) * coverage,
		base[2] + (color[2] - base[2]) * coverage,
	];
}

const markAngle = 0; // the icon shows the year mark at its 21 March zero point
const markCx = CENTER + MARK_CENTER_RADIUS * Math.sin((markAngle * Math.PI) / 180);
const markCy = CENTER - MARK_CENTER_RADIUS * Math.cos((markAngle * Math.PI) / 180);
const dotCx = CENTER + DOT_CENTER_RADIUS * Math.sin((DOT_ANGLE_DEG * Math.PI) / 180);
const dotCy = CENTER - DOT_CENTER_RADIUS * Math.cos((DOT_ANGLE_DEG * Math.PI) / 180);

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
	const rowStart = y * (SIZE * 4 + 1);
	raw[rowStart] = 0; // PNG filter type: None
	for (let x = 0; x < SIZE; x++) {
		let color = BACKGROUND;
		color = blend(color, YEAR_DISC, circleCoverage(x, y, CENTER, CENTER, YEAR_RADIUS));
		color = blend(color, DAY_DISC, circleCoverage(x, y, CENTER, CENTER, DAY_RADIUS));
		color = blend(color, YEAR_MARK, capsuleCoverage(x, y, markCx, markCy, MARK_WIDTH, MARK_HEIGHT));
		color = blend(color, DAY_DOT_RING, circleCoverage(x, y, dotCx, dotCy, DOT_RING_RADIUS));
		color = blend(color, DAY_DOT, circleCoverage(x, y, dotCx, dotCy, DOT_RADIUS));
		const offset = rowStart + 1 + x * 4;
		const [red = 0, green = 0, blue = 0] = color;
		raw[offset] = Math.round(red);
		raw[offset + 1] = Math.round(green);
		raw[offset + 2] = Math.round(blue);
		raw[offset + 3] = 255;
	}
}

function pngChunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(typeAndData));
	return Buffer.concat([length, typeAndData, crc]);
}

let crcTable;
function crc32(buf) {
	if (!crcTable) {
		crcTable = [];
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) {
				c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			}
			crcTable[n] = c >>> 0;
		}
	}
	let crc = 0xffffffff;
	for (const byte of buf) {
		crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); // width
ihdr.writeUInt32BE(SIZE, 4); // height
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
const png = Buffer.concat([
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
	pngChunk('IHDR', ihdr),
	pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
	pngChunk('IEND', Buffer.alloc(0)),
]);

const target = path.resolve(__dirname, '../assets/icons/app_icon_source.png');
fs.writeFileSync(target, png);
console.log(`Wrote ${target} (${png.length} bytes)`);
