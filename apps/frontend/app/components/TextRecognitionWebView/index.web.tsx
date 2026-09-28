/**
 * In the browser the engine runs on the page itself (`useTextRecognition.web.tsx`),
 * so there is no WebView to host. Nothing to render, and — since this file is
 * what Metro picks for the web — nothing from `react-native-webview` to bundle.
 */
export const TextRecognitionWebViewHost = () => null;

export default TextRecognitionWebViewHost;
