import { PageEnginePayload, buildInitScript } from './protocol';

/**
 * The one HTML document the WebView loads: the page bundle, then the call that
 * starts the engine with everything it needs already inside the document.
 *
 * Inlining is the point. A page loaded from `file://` cannot reliably fetch
 * its neighbours — Chrome's WebView and WebKit each have their own rules for
 * that, and they differ — so the page is given no neighbours. The WebAssembly
 * and the models travel base64-encoded inside the document, which makes it
 * about 28 MB; it is written to the cache once and reused (see
 * `preparePageFile.ts`).
 */
export const buildPageHtml = (bundleSource: string, payload: PageEnginePayload): string => {
	// A `</script>` inside an inline script ends it early. The bundle is ours
	// and does not contain one, but the check costs nothing.
	if (bundleSource.includes('</script')) {
		throw new Error('the page bundle contains a closing script tag');
	}
	return [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head>',
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		'<title>Text recognition</title>',
		'</head>',
		'<body>',
		`<script>${bundleSource}</script>`,
		`<script>${buildInitScript(payload)}</script>`,
		'</body>',
		'</html>',
	].join('\n');
};
