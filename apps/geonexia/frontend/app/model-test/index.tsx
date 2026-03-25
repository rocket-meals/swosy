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
type ModelEntry = { key: string; label: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_MODELS: ModelEntry[] = MODEL_GROUPS.flatMap((g) => g.models);
const PRIMARY_COLOR = '#2563eb';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadModelAsBase64(moduleId: number): Promise<string | null> {
	try {
		const asset = Asset.fromModule(moduleId);
		await asset.downloadAsync();
		if (Platform.OS === 'web') return asset.uri;
		if (!asset.localUri) return null;
		const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
			encoding: FileSystem.EncodingType.Base64,
		});
		return `data:model/gltf-binary;base64,${base64}`;
	} catch {
		return null;
	}
}

// ── Model Viewer Screen ───────────────────────────────────────────────────────

export default function ModelTestScreen() {
	const { theme } = useTheme();
	const webViewRef = useRef<WebView>(null);

	const [html, setHtml] = useState<string | null>(null);
	const [viewerReady, setViewerReady] = useState(false);
	const [status, setStatus] = useState<ViewerStatus>({ type: 'idle', message: 'Loading viewer…' });
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [showModelList, setShowModelList] = useState(false);
	const [showGrid, setShowGrid] = useState(true);
	const htmlReadyRef = useRef(false);
	const pendingModelKeyRef = useRef<string | null>(null);

	// Load viewer HTML from expo asset
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const htmlAsset = Asset.fromModule(require('../../assets/modelViewer.html'));
				await htmlAsset.downloadAsync();
				const content = await FileSystem.readAsStringAsync(htmlAsset.localUri!);
				if (mounted) setHtml(content);
			} catch (e) {
				if (mounted) setStatus({ type: 'error', message: `Failed to load viewer: ${e}` });
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

		const url = await loadModelAsBase64(moduleId);
		if (!url) {
			setStatus({ type: 'error', message: `Failed to read model file for: ${key}` });
			return;
		}

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
				setStatus({ type: 'ready', message: 'Viewer ready – select a model below' });
				if (pendingModelKeyRef.current) {
					const key = pendingModelKeyRef.current;
					pendingModelKeyRef.current = null;
					loadModel(key);
				}
			} else if (data.tag === 'modelLoaded') {
				setStatus({ type: 'ready', message: `✓ ${data.message || selectedKey}` });
			} else if (data.tag === 'status') {
				setStatus((prev) => ({ ...prev, message: data.message ?? '' }));
			} else if (data.tag === 'error') {
				setStatus({ type: 'error', message: data.message ?? 'Unknown error' });
			}
		} catch {
			// ignore
		}
	}, [selectedKey, loadModel]);

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
				{html ? (
					<WebView
						ref={webViewRef}
						style={styles.webView}
						source={{ html }}
						javaScriptEnabled
						domStorageEnabled
						originWhitelist={['*']}
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
