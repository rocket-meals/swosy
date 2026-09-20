/**
 * `onnxruntime-web`, as the page already loaded it.
 *
 * Metro resolves `onnxruntime-web` to this file for the web platform (see
 * `metro.config.js`). It has to, because the library's published bundles call
 * `import(someVariable)` to pull in their WebAssembly loader, and Metro refuses
 * a dynamic import it cannot follow — it fails the whole web build on it.
 *
 * So the runtime is not bundled at all. It is served from `public/paddleocr/`
 * as a plain script, exactly like the models beside it, and the web hook loads
 * that script before it imports anything that needs the runtime. By the time
 * this module is evaluated the global is there.
 */
const runtime = globalThis.ort;

if (!runtime) {
	throw new Error('the text recognition runtime was used before its script was loaded');
}

module.exports = runtime;
