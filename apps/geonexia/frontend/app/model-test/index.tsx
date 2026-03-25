import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from 'repo-depkit-common-ui';
import { MODEL_GROUPS } from '../../assets/modelList';
import { MODEL_ASSETS } from '../../assets/modelAssets';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewerStatus = { type: 'idle' | 'loading' | 'ready' | 'error'; message: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIMARY_COLOR = '#2563eb';
// Cache directory for the viewer HTML file.  GLB models are no longer copied here;
// they are loaded as base64 data URIs directly from the asset bundle instead.
const MODEL_VIEWER_CACHE_DIR = (FileSystem.cacheDirectory ?? '') + 'model_viewer_v1/';
const MODEL_VIEWER_HTML_PATH = MODEL_VIEWER_CACHE_DIR + 'index.html';

// The shared texture referenced by all GLB files as "Textures/colormap.png".
// It must be pre-loaded as a base64 data URI and sent to the WebView so that
// THREE.js GLTFLoader can resolve it without any XHR / file:// access.
const COLORMAP_ASSET = require('../../assets/models/Textures/colormap.png');
// The key must match the relative URI as written inside the GLB JSON chunk.
const COLORMAP_TEXTURE_KEY = 'Textures/colormap.png';

/** Reads a bundled asset and returns a base64 data URI, or null on failure. */
async function assetToDataUri(moduleId: number, mimeType: string): Promise<string | null> {
	try {
		const asset = Asset.fromModule(moduleId);
		await asset.downloadAsync();
		if (Platform.OS === 'web') return asset.uri;
		if (!asset.localUri) return null;
		const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
			encoding: FileSystem.EncodingType.Base64,
		});
		if (!base64) return null;
		return `data:${mimeType};base64,${base64}`;
	} catch (e) {
		console.error('[ModelTest] assetToDataUri failed:', e);
		return null;
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * On native: reads the GLB asset from disk and returns it as a base64 data URI so the
 * WebView can pass it to loader.parse() without any XHR / file:// access restrictions.
 * On web: returns the bundled asset URI directly (XHR works fine in the browser).
 *
 * Previous approach (file:// URI + copyAsync) failed on Android because the WebView's
 * XHR cannot access file:// URLs from JavaScript, even with allowFileAccess={true}.
 * Three.js GLTFLoader uses XHR internally, which triggered the error:
 *   "Load error: [object XMLHttpRequestProgressEvent]"
 */
async function loadModelToCache(moduleId: number): Promise<string | null> {
	return assetToDataUri(moduleId, 'model/gltf-binary');
}

// ── Model Viewer Screen ───────────────────────────────────────────────────────

export default function ModelTestScreen() {
	const { theme } = useTheme();
	const webViewRef = useRef<WebView>(null);

	// Native uses a file:// URI source; web uses inline HTML.
	const [htmlFileUri, setHtmlFileUri] = useState<string | null>(null);
	const [html, setHtml] = useState<string | null>(null);
	const [viewerReady, setViewerReady] = useState(false);
	const [status, setStatus] = useState<ViewerStatus>({ type: 'idle', message: 'Loading viewer…' });
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [showModelList, setShowModelList] = useState(false);
	const [showGrid, setShowGrid] = useState(true);
	const htmlReadyRef = useRef(false);
	const pendingModelKeyRef = useRef<string | null>(null);
	// Shared colormap texture data URI (loaded once, sent to viewer on ready)
	const colormapDataUriRef = useRef<string | null>(null);

	// Load viewer HTML and the shared colormap texture in parallel
	useEffect(() => {
		let mounted = true;
		(async () => {
			const [htmlResult, colormapUri] = await Promise.all([
				(async () => {
					try {
						const htmlAsset = Asset.fromModule(require('../../assets/modelViewer.html'));
						await htmlAsset.downloadAsync();
						const content = await FileSystem.readAsStringAsync(htmlAsset.localUri!);
						return { content, error: null };
					} catch (e) {
						return { content: null, error: e };
					}
				})(),
				assetToDataUri(COLORMAP_ASSET, 'image/png'),
			]);

			if (!mounted) return;

			if (htmlResult.error || !htmlResult.content) {
				setStatus({ type: 'error', message: `Failed to load viewer: ${htmlResult.error}` });
				return;
			}

			colormapDataUriRef.current = colormapUri;

			if (Platform.OS !== 'web') {
				// Write to a local cache file so the WebView loads from a file:// URI.
				// This gives it a proper file:// origin and lets it fetch sibling GLB assets
				// directly, avoiding "URL is not valid or contains user credentials" errors.
				try {
					await FileSystem.makeDirectoryAsync(MODEL_VIEWER_CACHE_DIR, { intermediates: true });
					await FileSystem.writeAsStringAsync(MODEL_VIEWER_HTML_PATH, htmlResult.content);
					setHtmlFileUri(MODEL_VIEWER_HTML_PATH);
				} catch (e) {
					setStatus({ type: 'error', message: `Failed to write viewer: ${e}` });
				}
			} else {
				setHtml(htmlResult.content);
			}
		})();
		return () => { mounted = false; };
	}, []);

	const sendToViewer = useCallback((data: object) => {
		const json = JSON.stringify(data);
		webViewRef.current?.injectJavaScript(
			`window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`,
		);
	}, []);

	const loadModel = useCallback(async (key: string) => {
		setSelectedKey(key);
		setShowModelList(false);
		setStatus({ type: 'loading', message: `Loading ${key}…` });

		const moduleId = MODEL_ASSETS[key];
		if (moduleId === undefined) {
			setStatus({ type: 'error', message: `No asset found for key: ${key}` });
			return;
		}

		setStatus({ type: 'loading', message: `Loading model ${key}…` });
		const url = await loadModelToCache(moduleId);
		if (!url) {
			setStatus({ type: 'error', message: `Failed to read model file for: ${key}` });
			return;
		}
		setStatus({ type: 'loading', message: `Sending ${key} to viewer…` });

		if (htmlReadyRef.current) {
			sendToViewer({ loadModel: { url, name: key } });
		} else {
			pendingModelKeyRef.current = key;
		}
	}, [sendToViewer]);

	const handleMessage = useCallback((event: WebViewMessageEvent) => {
		try {
			const data = JSON.parse(event.nativeEvent.data) as { tag?: string; message?: string };
			if (data.tag === 'ViewerReady') {
				htmlReadyRef.current = true;
				setViewerReady(true);
				setStatus({ type: 'ready', message: 'Ready – loading first model…' });
				// Send the shared colormap texture so GLTFLoader can resolve it without XHR
				if (colormapDataUriRef.current) {
					sendToViewer({ setTextures: { [COLORMAP_TEXTURE_KEY]: colormapDataUriRef.current } });
				}
				// Auto-load first model or any pending model
				const autoKey = pendingModelKeyRef.current ?? MODEL_GROUPS[0]?.models[0]?.key ?? null;
				pendingModelKeyRef.current = null;
				if (autoKey) {
					loadModel(autoKey);
				}
			} else if (data.tag === 'modelLoaded') {
				setStatus({ type: 'ready', message: `✓ ${data.message || selectedKey}` });
			} else if (data.tag === 'status') {
				setStatus((prev) => ({ ...prev, message: data.message ?? '' }));
			} else if (data.tag === 'error') {
				setStatus({ type: 'error', message: data.message ?? 'Unknown error' });
			} else if (data.tag === 'debug') {
				console.log('[ModelTest WebView]', data.message);
			}
		} catch {
			// JSON.parse may fail for non-JSON messages from the WebView; safely ignore
		}
	}, [selectedKey, loadModel, sendToViewer]);

	const toggleGrid = useCallback(() => {
		const next = !showGrid;
		setShowGrid(next);
		sendToViewer({ toggleGrid: next });
	}, [showGrid, sendToViewer]);

	const resetCamera = useCallback(() => {
		sendToViewer({ resetCamera: true });
	}, [sendToViewer]);

	const nextBackground = useCallback(() => {
		sendToViewer({ nextBackground: true });
	}, [sendToViewer]);

	const statusColor =
		status.type === 'error' ? '#ef4444' :
		status.type === 'loading' ? '#f59e0b' :
		status.type === 'ready' ? '#22c55e' :
		theme.screen.text;

	const isViewerReady = Platform.OS !== 'web' ? htmlFileUri !== null : html !== null;

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			{/* Header */}
			<View style={[styles.header, { backgroundColor: theme.screen.background, borderBottomColor: theme.screen.text + '20' }]}>
				<Text style={[styles.headerTitle, { color: theme.screen.text }]}>🧊 3D Model Test</Text>
				<Text style={[styles.headerStatus, { color: statusColor }]} numberOfLines={1}>
					{status.message}
				</Text>
			</View>

			{/* 3D Viewer */}
			<View style={styles.viewerContainer}>
				{isViewerReady ? (
					<WebView
						ref={webViewRef}
						style={styles.webView}
						source={Platform.OS !== 'web' && htmlFileUri ? { uri: htmlFileUri } : { html: html! }}
						javaScriptEnabled
						domStorageEnabled
						originWhitelist={['*']}
						allowFileAccess={true}
						allowingReadAccessToURL={FileSystem.cacheDirectory ?? ''}
						onMessage={handleMessage}
					/>
				) : (
					<View style={[styles.placeholder, { backgroundColor: '#1a1a2e' }]}>
						<Text style={styles.placeholderText}>Loading viewer…</Text>
					</View>
				)}
			</View>

			{/* Controls */}
			<View style={[styles.controls, { backgroundColor: theme.screen.background, borderTopColor: theme.screen.text + '20' }]}>
				<View style={styles.controlRow}>
					<TouchableOpacity
						style={[styles.controlButton, { backgroundColor: PRIMARY_COLOR }]}
						onPress={() => setShowModelList((v) => !v)}
					>
						<Text style={styles.controlButtonText}>
							{selectedKey ? `📦 ${selectedKey}` : '📦 Select Model'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.controlButton, { backgroundColor: theme.screen.text + '20' }]}
						onPress={resetCamera}
						disabled={!viewerReady}
					>
						<Text style={[styles.controlButtonText, { color: theme.screen.text }]}>🎥 Reset</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.controlButton, { backgroundColor: theme.screen.text + '20' }]}
						onPress={nextBackground}
						disabled={!viewerReady}
					>
						<Text style={[styles.controlButtonText, { color: theme.screen.text }]}>🎨 BG</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.controlButton, { backgroundColor: showGrid ? theme.screen.text + '30' : theme.screen.text + '15' }]}
						onPress={toggleGrid}
						disabled={!viewerReady}
					>
						<Text style={[styles.controlButtonText, { color: theme.screen.text }]}>
							{showGrid ? '▦ Grid' : '□ Grid'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Model list */}
				{showModelList && (
					<ScrollView style={[styles.modelList, { backgroundColor: theme.screen.background }]} keyboardShouldPersistTaps="always">
						{MODEL_GROUPS.map((group) => (
							<View key={group.label}>
								<Text style={[styles.groupLabel, { color: theme.screen.text + '80' }]}>{group.label}</Text>
								{group.models.map((m) => (
									<TouchableOpacity
										key={m.key}
										style={[
											styles.modelItem,
											{ borderBottomColor: theme.screen.text + '15' },
											selectedKey === m.key && { backgroundColor: PRIMARY_COLOR + '20' },
										]}
										onPress={() => loadModel(m.key)}
									>
										<Text style={[styles.modelItemText, { color: theme.screen.text }, selectedKey === m.key && { color: PRIMARY_COLOR, fontWeight: '700' }]}>
											{m.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						))}
					</ScrollView>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderBottomWidth: 1,
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: '700',
	},
	headerStatus: {
		fontSize: 12,
		marginTop: 2,
	},
	viewerContainer: {
		flex: 1,
	},
	webView: {
		flex: 1,
	},
	placeholder: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	placeholderText: {
		color: '#888',
		fontSize: 14,
	},
	controls: {
		borderTopWidth: 1,
		paddingTop: 8,
		paddingBottom: 8,
		maxHeight: 320,
	},
	controlRow: {
		flexDirection: 'row',
		paddingHorizontal: 10,
		gap: 8,
		flexWrap: 'wrap',
	},
	controlButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	controlButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
	},
	modelList: {
		marginTop: 8,
		maxHeight: 240,
	},
	groupLabel: {
		fontSize: 11,
		fontWeight: '600',
		textTransform: 'uppercase',
		paddingHorizontal: 14,
		paddingVertical: 6,
		letterSpacing: 0.5,
	},
	modelItem: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderBottomWidth: 1,
	},
	modelItemText: {
		fontSize: 14,
	},
});
