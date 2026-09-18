import { MINIMUM_SHARPNESS, SHARPNESS_FUNCTION_SOURCE, measureImageSharpness } from '../helper/TextRecognitionShared';

/**
 * The scanner turns away a frame that is too soft to read, so that the user is
 * told instead of watching a silent search — a front camera has a fixed focus
 * and cannot sharpen up at the distance a card is held at.
 *
 * The threshold itself is calibrated against real photos (see the comment on
 * `MINIMUM_SHARPNESS`); what is checked here is that the measure behaves: flat
 * is zero, crisp is high, and blurring the same picture lowers it.
 */
const WIDTH = 60;
const HEIGHT = 40;

/** Builds an RGBA buffer from a grayscale function. */
const buildImage = (valueAt: (x: number, y: number) => number): Uint8ClampedArray => {
	const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			const offset = (y * WIDTH + x) * 4;
			const value = valueAt(x, y);
			pixels[offset] = value;
			pixels[offset + 1] = value;
			pixels[offset + 2] = value;
			pixels[offset + 3] = 255;
		}
	}
	return pixels;
};

/** Averages each pixel with its neighbours — what being out of focus does. */
const blur = (pixels: Uint8ClampedArray): Uint8ClampedArray => {
	const blurred = new Uint8ClampedArray(pixels.length);
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			let sum = 0;
			let count = 0;
			for (let offsetY = -2; offsetY <= 2; offsetY++) {
				for (let offsetX = -2; offsetX <= 2; offsetX++) {
					const neighbourX = x + offsetX;
					const neighbourY = y + offsetY;
					if (neighbourX < 0 || neighbourY < 0 || neighbourX >= WIDTH || neighbourY >= HEIGHT) {
						continue;
					}
					sum += pixels[(neighbourY * WIDTH + neighbourX) * 4];
					count++;
				}
			}
			const offset = (y * WIDTH + x) * 4;
			const value = sum / count;
			blurred[offset] = value;
			blurred[offset + 1] = value;
			blurred[offset + 2] = value;
			blurred[offset + 3] = 255;
		}
	}
	return blurred;
};

describe('measureImageSharpness', () => {
	it('reports nothing for a surface without detail', () => {
		const flat = buildImage(() => 128);
		expect(measureImageSharpness(flat, WIDTH, HEIGHT)).toBe(0);
	});

	it('reports a high value for crisp edges', () => {
		const checkerboard = buildImage((x, y) => ((x >> 1) + (y >> 1)) % 2 === 0 ? 0 : 255);
		expect(measureImageSharpness(checkerboard, WIDTH, HEIGHT)).toBeGreaterThan(MINIMUM_SHARPNESS);
	});

	it('drops markedly when the same picture goes out of focus', () => {
		const checkerboard = buildImage((x, y) => ((x >> 1) + (y >> 1)) % 2 === 0 ? 0 : 255);
		const sharp = measureImageSharpness(checkerboard, WIDTH, HEIGHT);
		const soft = measureImageSharpness(blur(checkerboard), WIDTH, HEIGHT);
		expect(soft).toBeLessThan(sharp / 2);
	});

	it('falls below the threshold for the soft gradients an out-of-focus photo is made of', () => {
		// What a card held in front of a fixed-focus camera actually looks like:
		// no edges left, only a slow drift in brightness.
		const gradient = buildImage((x, y) => 100 + Math.round((x / WIDTH) * 40) + Math.round((y / HEIGHT) * 20));
		expect(measureImageSharpness(gradient, WIDTH, HEIGHT)).toBeLessThan(MINIMUM_SHARPNESS);
	});

	it('survives an image too small to have a neighbourhood', () => {
		expect(measureImageSharpness(new Uint8ClampedArray(4), 1, 1)).toBe(0);
	});

	it('agrees with the copy that ships into the WebView', () => {
		// The native side cannot use this function directly: it runs on Hermes,
		// which does not keep function bodies, so `toString()` would hand the
		// WebView an empty shell. The copy in SHARPNESS_FUNCTION_SOURCE exists for
		// that reason, and has to stay the same computation.
		const fromSource = new Function(`${SHARPNESS_FUNCTION_SOURCE}; return measureImageSharpness;`)() as typeof measureImageSharpness;

		const images = [buildImage(() => 128), buildImage((x, y) => ((x >> 1) + (y >> 1)) % 2 === 0 ? 0 : 255), buildImage((x, y) => 100 + Math.round((x / WIDTH) * 40) + Math.round((y / HEIGHT) * 20)), buildImage((x, y) => (x * 7 + y * 13) % 256)];

		for (const image of images) {
			expect(fromSource(image, WIDTH, HEIGHT)).toBe(measureImageSharpness(image, WIDTH, HEIGHT));
		}
	});
});
