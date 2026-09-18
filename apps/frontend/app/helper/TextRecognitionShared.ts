/**
 * What the two text recognition hooks share.
 *
 * The engine is PaddleOCR (PP-OCRv6 tiny) running on onnxruntime: WebAssembly
 * in the browser, the native runtime on a device. Both read the same models out
 * of `public/paddleocr/`, so nothing is ever fetched from a third party — see
 * the README there.
 */

/** What the experimental screen prints under "Texterkennung". */
export const ENGINE_NAME = 'PaddleOCR PP-OCRv6 tiny (onnxruntime)';

/** The models and the character dictionary, as they are named on disk. */
export const ENGINE_FILE_NAMES = {
	detection: 'PP-OCRv6_tiny_det.ort',
	recognition: 'PP-OCRv6_tiny_rec.ort',
	charactersDictionary: 'ppocrv6_tiny_dict.txt',
} as const;

/**
 * The WebAssembly onnxruntime loads in the browser, and the glue beside it.
 *
 * onnxruntime-web points at a CDN by default. These are the same two files,
 * served from this app instead — see `getEngineDirectoryUrl` in the web hook.
 */
export const ONNXRUNTIME_FILE_NAMES = {
	// The wasm-only build, on purpose: the all-backends bundle reaches for a
	// WebGPU-capable WebAssembly file that is not bundled here, and falls back to
	// the CDN when it cannot find it. See `EXECUTION_PROVIDERS` below.
	library: 'ort.wasm.min.js',
	webAssembly: 'ort-wasm-simd-threaded.wasm',
	webAssemblyLoader: 'ort-wasm-simd-threaded.mjs',
} as const;

/**
 * The one backend the engine is allowed to use.
 *
 * Left to itself the library asks for WebGPU first, which makes onnxruntime
 * load a different, WebGPU-capable WebAssembly file — one this app does not
 * bundle, and which it would therefore fetch from a CDN. Pinning the backend
 * pins the file.
 */
export const WEB_EXECUTION_PROVIDERS = ['wasm'] as const;

/** The directory the engine is served from, below the app's base path. */
export const ENGINE_DIRECTORY_NAME = 'paddleocr';

/**
 * How wide a frame is scaled to before it is read. The models detect text at
 * their own scale anyway, and a full-resolution photo only costs time and
 * memory on the way there.
 */
export const MAX_RECOGNITION_IMAGE_WIDTH = 1600;

/** JPEG quality for that scaled frame. */
export const RECOGNITION_IMAGE_COMPRESSION = 0.8;

/** Sharpness is measured at a fixed width so the number means the same thing. */
export const SHARPNESS_MEASUREMENT_WIDTH = 800;

/**
 * Below this, a frame is soft enough to explain why nothing was read.
 *
 * It is no longer a gate. It used to be one, because the previous engine spent
 * about a second on every frame and said nothing about the ones it could not
 * use. This engine reads a frame in a fraction of that, and reads images well
 * below this threshold — the specimen card in `Test_2` comes back at 9 and is
 * read correctly. Turning that frame away would have been a false rejection, so
 * the measurement now only answers the question afterwards: nothing was read,
 * and the picture was soft, so say so.
 */
export const MINIMUM_SHARPNESS = 12;

/**
 * How sharp an image is, as the variance of its Laplacian — the usual measure.
 *
 * A flat surface has none, an edge has a lot, and a photo out of focus has
 * almost none because its edges have been smeared into gradients. `pixels` is
 * RGBA, four bytes per pixel, as a canvas hands it over.
 */
export const measureImageSharpness = (pixels: Uint8ClampedArray, width: number, height: number): number => {
	const pixelCount = width * height;
	const gray = new Float32Array(pixelCount);
	for (let index = 0; index < pixelCount; index++) {
		const offset = index * 4;
		gray[index] = ((pixels[offset] ?? 0) * 299 + (pixels[offset + 1] ?? 0) * 587 + (pixels[offset + 2] ?? 0) * 114) / 1000;
	}

	let sum = 0;
	let sumOfSquares = 0;
	let count = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const position = y * width + x;
			const laplacian = (gray[position - width] ?? 0) + (gray[position + width] ?? 0) + (gray[position - 1] ?? 0) + (gray[position + 1] ?? 0) - 4 * (gray[position] ?? 0);
			sum += laplacian;
			sumOfSquares += laplacian * laplacian;
			count++;
		}
	}
	if (count === 0) {
		return 0;
	}
	const mean = sum / count;
	return sumOfSquares / count - mean * mean;
};

/** One frame handed to the engine. */
export interface RecognitionImage {
	uri: string;
	/** Known width, so a frame already small enough is not scaled twice. */
	width?: number;
}

/** What one pass over a frame produced. */
export interface RecognitionResult {
	/** The recognized text, line by line, empty lines dropped. */
	lines: string[];
	/**
	 * How sharp the frame was, or `null` where it could not be measured. Only
	 * ever used to explain an empty reading.
	 */
	sharpness: number | null;
	/** Nothing was read and the frame was soft enough for that to be the reason. */
	tooBlurry: boolean;
}

export interface TextRecognitionApi {
	/** Reads one frame: its text line by line, plus how sharp it was. */
	recognizeImage: (image: RecognitionImage) => Promise<RecognitionResult>;
	/** 0…1 while the engine loads, `null` once it is up. */
	progress: number | null;
	/** Set once the engine failed to load or a recognition failed. */
	errorMessage: string | null;
}

/** Splits the engine's raw output into the lines the IBAN search works on. */
export const splitRecognizedText = (text: string): string[] =>
	text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

/**
 * Turns a reading into a {@link RecognitionResult}, deciding on the way whether
 * an empty one is worth blaming on the picture.
 */
export const describeReading = (text: string, sharpness: number | null): RecognitionResult => {
	const lines = splitRecognizedText(text);
	return {
		lines,
		sharpness,
		tooBlurry: lines.length === 0 && sharpness !== null && sharpness < MINIMUM_SHARPNESS,
	};
};
