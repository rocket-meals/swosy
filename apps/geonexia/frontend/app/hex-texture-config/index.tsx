import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListGroupTitle, SettingsListSelectOption, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';

import { TERRAIN_ASSETS, TERRAIN_CATEGORIES } from '../../assets/terrainAssets';
import type { TerrainAssetEntry } from '../../assets/terrainAssets';
import { setTextureSpriteAnchor, setTextureSpriteScale, resetTextureSpriteAnchor } from '../../store/hexTextureConfigSlice';
import type { RootState, AppDispatch } from '../../store/store';
import type { HexTileRecord } from '../../helpers/HexTileStorage';
import SettingsListHexTile from '../../components/SettingsListHexTile';

const PRIMARY_COLOR = '#7c3aed';
const ANCHOR_STEP = 0.05;
const ANCHOR_PRECISION = 100; // 2 decimal places
const SCALE_STEP = 0.1;
const SCALE_MIN = 0.1;
const SCALE_MAX = 5.0;
const SCALE_PRECISION = 10; // 1 decimal place
const SCALE_DEFAULT = 1.0;
const ANCHOR_DEFAULT = 0.5;

const PREVIEW_HEIGHT = 160;
const ANCHOR_DOT_SIZE = 12;
const MODAL_THUMB_SIZE = 32;
const NONE_OPTION_ID = '';

/** All terrain asset entries flattened in category order. */
const ALL_TERRAIN_ENTRIES: TerrainAssetEntry[] = TERRAIN_CATEGORIES.flatMap(
	(cat) => TERRAIN_ASSETS[cat],
);

/** Clamp a value between 0 and 1, rounded to 2 decimal places. */
function clampAnchor(value: number): number {
	return Math.max(0, Math.min(1, Math.round(value * ANCHOR_PRECISION) / ANCHOR_PRECISION));
}

/** Compute the actual rendered image bounds inside a contain-mode container. */
function getContainBounds(
	naturalWidth: number,
	naturalHeight: number,
	containerWidth: number,
	containerHeight: number,
): { displayW: number; displayH: number; offsetX: number; offsetY: number } {
	const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
	const displayW = naturalWidth * scale;
	const displayH = naturalHeight * scale;
	const offsetX = (containerWidth - displayW) / 2;
	const offsetY = (containerHeight - displayH) / 2;
	return { displayW, displayH, offsetX, offsetY };
}

/** Count of hex tiles using each terrain key (from tileImage field). */
function buildPlacedCountMap(records: Record<string, HexTileRecord>): Map<string, number> {
	const countMap = new Map<string, number>();
	for (const record of Object.values(records)) {
		if (!record.tileImage) continue;
		countMap.set(record.tileImage, (countMap.get(record.tileImage) ?? 0) + 1);
	}
	return countMap;
}

/** Small thumbnail used as an icon inside the selection modal. */
function TerrainThumbnailIcon({ terrainEntry }: { terrainEntry: TerrainAssetEntry }) {
	const [imgUri, setImgUri] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const asset = Asset.fromModule(terrainEntry.source as number);
				await asset.downloadAsync();
				if (cancelled) return;
				let uri: string;
				if (Platform.OS === 'web') {
					uri = asset.uri;
				} else {
					if (!asset.localUri) return;
					const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
						encoding: FileSystem.EncodingType.Base64,
					});
					if (cancelled) return;
					uri = `data:${terrainEntry.mimeType ?? 'image/svg+xml'};base64,${base64}`;
				}
				setImgUri(uri);
			} catch {
				// ignore load failures
			}
		})();
		return () => { cancelled = true; };
	}, [terrainEntry]);

	if (!imgUri) {
		return <View style={modalStyles.thumbPlaceholder} />;
	}

	return (
		<WebView
			source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}html,body{width:${MODAL_THUMB_SIZE}px;height:${MODAL_THUMB_SIZE}px;overflow:hidden;background:transparent}img{width:100%;height:100%;object-fit:cover}</style></head><body><img src="${imgUri.replace(/"/g, '&quot;')}"/></body></html>` }}
			style={modalStyles.thumb}
			originWhitelist={['*']}
			scrollEnabled={false}
			javaScriptEnabled={false}
			pointerEvents="none"
		/>
	);
}

const modalStyles = StyleSheet.create({
	thumb: {
		width: MODAL_THUMB_SIZE,
		height: MODAL_THUMB_SIZE,
		backgroundColor: 'transparent',
	},
	thumbPlaceholder: {
		width: MODAL_THUMB_SIZE,
		height: MODAL_THUMB_SIZE,
	},
});

// ─── Hex Field Preview ────────────────────────────────────────────────────────

const HEX_FIELD_PREVIEW_HEIGHT = 240;

// Ratio of texture size to hex vertex-to-vertex diameter at the reference zoom.
const TEXTURE_PREVIEW_K = 1.0;

/**
 * Preview that renders a field of hex tiles (3×3 grid) with the terrain texture
 * placed flat on each hex, sized and positioned according to the configured
 * anchor and scale — approximating how the terrain texture will look on the map.
 */
function HexFieldPreview({
	imgUri,
	terrainKey,
	perSpriteScale,
	anchorX,
	anchorY,
}: {
	imgUri: string;
	terrainKey: string;
	perSpriteScale: number;
	anchorX: number;
	anchorY: number;
}) {
	const textureFraction = TEXTURE_PREVIEW_K / perSpriteScale;
	const escapedSrc = JSON.stringify(imgUri);

	const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#1e293b;overflow:hidden}
    canvas{display:block}
  </style>
</head>
<body>
<canvas id="c"></canvas>
<script>
var canvas=document.getElementById('c');
var ctx=canvas.getContext('2d');
var W=window.innerWidth;
var H=window.innerHeight;
canvas.width=W;
canvas.height=H;

// Flat-top hex geometry: radius such that a 3-column grid fits comfortably
var hexR=Math.min(W,H)*0.17;
// Flat-top hex column/row offsets
var hexW=hexR*2;          // vertex-to-vertex width
var hexH=hexR*Math.sqrt(3); // flat-top height (edge-to-edge)
var colStep=hexW*0.75;    // horizontal distance between hex centers in adjacent columns
var rowStep=hexH;          // vertical distance between hex centers in same column

// Center the grid in the canvas
var cols=3;
var rows=3;
var gridW=(cols-1)*colStep+hexW;
var gridH=(rows-1)*rowStep+hexH;
var startX=(W-gridW)/2+hexR;
var startY=(H-gridH)/2+hexR;

function hexCenters(){
  var centers=[];
  for(var col=0;col<cols;col++){
    for(var row=0;row<rows;row++){
      var cx=startX+col*colStep;
      var cy=startY+row*rowStep+(col%2===1?rowStep/2:0);
      centers.push([cx,cy]);
    }
  }
  return centers;
}

// Draw a flat-top regular hexagon
function drawHex(cx,cy,r){
  ctx.beginPath();
  for(var i=0;i<6;i++){
    var a=Math.PI/3*i;
    var x=cx+r*Math.cos(a);
    var y=cy+r*Math.sin(a);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

// Background
ctx.fillStyle='#1e293b';
ctx.fillRect(0,0,W,H);

// Subtle grid
ctx.strokeStyle='rgba(255,255,255,0.04)';
ctx.lineWidth=1;
for(var gx=0;gx<W;gx+=20){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
for(var gy=0;gy<H;gy+=20){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

var centers=hexCenters();

// Hex fills and strokes
for(var i=0;i<centers.length;i++){
  var isCenter=(i===4); // middle hex of 3×3 grid
  drawHex(centers[i][0],centers[i][1],hexR);
  ctx.fillStyle=isCenter?'rgba(124,58,237,0.22)':'rgba(34,197,94,0.12)';
  ctx.fill();
  ctx.strokeStyle=isCenter?'rgba(124,58,237,0.9)':'rgba(34,197,94,0.5)';
  ctx.lineWidth=isCenter?2:1;
  ctx.stroke();
}

// Texture proportions (relative to hex vertex-to-vertex diameter)
var texFraction=${textureFraction.toFixed(4)};
var texW=hexR*2*texFraction;
var texH=texW;
var anchorX=${anchorX.toFixed(4)};
var anchorY=${anchorY.toFixed(4)};

// Load and draw the terrain texture on every hex, clipped to the hex boundary
var img=new Image();
img.onload=function(){
  for(var i=0;i<centers.length;i++){
    var cx=centers[i][0];
    var cy=centers[i][1];
    // Clip to hex shape
    ctx.save();
    drawHex(cx,cy,hexR-0.5);
    ctx.clip();
    var bX=cx-anchorX*texW;
    var bY=cy-anchorY*texH;
    ctx.drawImage(img,bX,bY,texW,texH);
    ctx.restore();
  }
  // Anchor point indicator on center hex only
  var cc=centers[4];
  ctx.beginPath();
  ctx.arc(cc[0],cc[1],5,0,Math.PI*2);
  ctx.fillStyle='#ef4444';
  ctx.fill();
  ctx.strokeStyle='#ffffff';
  ctx.lineWidth=2;
  ctx.stroke();
};
img.src=${escapedSrc};
</script>
</body>
</html>`;

	return (
		<WebView
			key={`hex-field-${terrainKey}-${anchorX.toFixed(2)}-${anchorY.toFixed(2)}-${perSpriteScale.toFixed(2)}`}
			source={{ html }}
			style={previewStyles.canvas}
			originWhitelist={['*']}
			scrollEnabled={false}
			javaScriptEnabled={true}
			pointerEvents="none"
		/>
	);
}

const previewStyles = StyleSheet.create({
	canvas: {
		width: '100%',
		height: HEX_FIELD_PREVIEW_HEIGHT,
		backgroundColor: '#1e293b',
		borderRadius: 12,
	},
});


export default function HexTextureConfigScreen() {
	const { theme } = useTheme();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const dispatch = useDispatch<AppDispatch>();
	const records = useSelector((state: RootState) => state.hexTiles.records);
	const spriteAnchors = useSelector((state: RootState) => state.hexTextureConfig.spriteAnchors);

	// Count placed terrain textures per terrain key.
	const placedCountMap = useMemo(() => buildPlacedCountMap(records), [records]);

	// Currently selected terrain key; empty string = "Keines" (none selected).
	const [selectedTerrainKey, setSelectedTerrainKey] = useState<string | null>(null);

	// Image data URI cache per terrain key (loaded on demand for selected entry only).
	const [imgUris, setImgUris] = useState<Record<string, string>>({});

	// Natural image dimensions per terrain key (for correct anchor overlay positioning).
	const [imageDims, setImageDims] = useState<Record<string, { width: number; height: number }>>({});

	// Load image for the currently selected terrain entry.
	useEffect(() => {
		if (!selectedTerrainKey) return;
		const entry = ALL_TERRAIN_ENTRIES.find((e) => e.key === selectedTerrainKey);
		if (!entry) return;
		const key = selectedTerrainKey;
		let cancelled = false;
		(async () => {
			try {
				const asset = Asset.fromModule(entry.source as number);
				await asset.downloadAsync();
				if (cancelled) return;
				let uri: string;
				if (Platform.OS === 'web') {
					uri = asset.uri;
				} else {
					if (!asset.localUri) return;
					const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
						encoding: FileSystem.EncodingType.Base64,
					});
					if (cancelled) return;
					uri = `data:${entry.mimeType ?? 'image/svg+xml'};base64,${base64}`;
				}
				setImgUris((prev) => (prev[key] ? prev : { ...prev, [key]: uri }));
			} catch {
				// Ignore load failures.
			}
		})();
		return () => { cancelled = true; };
	}, [selectedTerrainKey]);

	const getAnchorX = useCallback((terrainKey: string) => {
		return spriteAnchors[terrainKey]?.anchorX ?? ANCHOR_DEFAULT;
	}, [spriteAnchors]);

	const getAnchorY = useCallback((terrainKey: string) => {
		return spriteAnchors[terrainKey]?.anchorY ?? ANCHOR_DEFAULT;
	}, [spriteAnchors]);

	const getScale = useCallback((terrainKey: string) => {
		return spriteAnchors[terrainKey]?.scaleMultiplier ?? SCALE_DEFAULT;
	}, [spriteAnchors]);

	const adjustAnchor = useCallback((terrainKey: string, deltaX: number, deltaY: number) => {
		const currentX = getAnchorX(terrainKey);
		const currentY = getAnchorY(terrainKey);
		dispatch(setTextureSpriteAnchor({
			terrainKey,
			anchorX: clampAnchor(currentX + deltaX),
			anchorY: clampAnchor(currentY + deltaY),
		}));
	}, [dispatch, getAnchorX, getAnchorY]);

	const adjustScale = useCallback((terrainKey: string, delta: number) => {
		const current = getScale(terrainKey);
		const next = Math.max(SCALE_MIN, Math.min(SCALE_MAX,
			Math.round((current + delta) * SCALE_PRECISION) / SCALE_PRECISION,
		));
		dispatch(setTextureSpriteScale({ terrainKey, scaleMultiplier: next }));
	}, [dispatch, getScale]);

	const handleReset = useCallback((terrainKey: string) => {
		dispatch(resetTextureSpriteAnchor({ terrainKey }));
	}, [dispatch]);

	const handleCopyConfig = useCallback(async () => {
		const json = JSON.stringify(spriteAnchors, null, 2);
		await Clipboard.setStringAsync(json);
		Alert.alert('Copied', 'Hex texture config copied to clipboard.');
	}, [spriteAnchors]);

	const selectionOptions = useMemo(() => {
		const none = { id: NONE_OPTION_ID, label: 'Keines' };
		const entries = ALL_TERRAIN_ENTRIES.map((entry) => {
			const count = placedCountMap.get(entry.key) ?? 0;
			const label = count > 0 ? `${entry.key} (${count})` : entry.key;
			return {
				id: entry.key,
				label,
				icon: <TerrainThumbnailIcon terrainEntry={entry} />,
			};
		});
		return [none, ...entries];
	}, [placedCountMap]);

	const openTerrainSelection = useCallback(() => {
		const currentId = selectedTerrainKey ?? NONE_OPTION_ID;
		showModal({
			title: '🌍 Hex Textur auswählen',
			onClose: closeModal,
			children: (
				<SettingsListSelectOption
					options={selectionOptions}
					selectedOption={currentId}
					onSelect={(option) => {
						setSelectedTerrainKey(option.id === NONE_OPTION_ID ? null : option.id as string);
						closeModal();
					}}
				/>
			),
		});
	}, [showModal, closeModal, selectedTerrainKey, selectionOptions]);

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.content}>
			<SettingsListGroupTitle title="Hex Texture Ankerpunkte" />

			<Text style={[styles.description, { color: theme.screen.text + '99' }]}>
				Ankerpunkt und Skalierung für jede Hex-Terrain-Textur anpassen. Änderungen gelten unabhängig von den Billboard-Einstellungen.
			</Text>

			{/* Terrain selector row */}
			<SettingsListHexTile
				tileImageKey={selectedTerrainKey}
				title="Hex Textur"
				onPress={openTerrainSelection}
				groupPosition="single"
			/>

			{/* Copy config button */}
			<TouchableOpacity
				style={[styles.copyButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleCopyConfig}
			>
				<Ionicons name="copy-outline" size={18} color="#fff" />
				<Text style={styles.copyButtonText}>Config JSON kopieren</Text>
			</TouchableOpacity>

			{/* Settings for selected terrain type */}
			{selectedTerrainKey !== null && (() => {
				const terrainKey = selectedTerrainKey;
				const entry = ALL_TERRAIN_ENTRIES.find((e) => e.key === terrainKey);
				if (!entry) return null;
				const anchorX = getAnchorX(terrainKey);
				const anchorY = getAnchorY(terrainKey);
				const scale = getScale(terrainKey);
				const imgUri = imgUris[terrainKey];
				const isDefault = !spriteAnchors[terrainKey];
				const dims = imageDims[terrainKey];
				const count = placedCountMap.get(terrainKey) ?? 0;
				// Compute actual image bounds within the square preview container for overlay positioning.
				const bounds = dims
					? getContainBounds(dims.width, dims.height, PREVIEW_HEIGHT, PREVIEW_HEIGHT)
					: null;
				const dotLeft = bounds
					? bounds.offsetX + anchorX * bounds.displayW - ANCHOR_DOT_SIZE / 2
					: anchorX * PREVIEW_HEIGHT - ANCHOR_DOT_SIZE / 2;
				const dotTop = bounds
					? bounds.offsetY + anchorY * bounds.displayH - ANCHOR_DOT_SIZE / 2
					: anchorY * PREVIEW_HEIGHT - ANCHOR_DOT_SIZE / 2;
				const crosshairLeft = bounds
					? bounds.offsetX + anchorX * bounds.displayW
					: anchorX * PREVIEW_HEIGHT;
				const crosshairTop = bounds
					? bounds.offsetY + anchorY * bounds.displayH
					: anchorY * PREVIEW_HEIGHT;

				return (
					<>
						<View style={[styles.typeCard, { borderColor: theme.screen.text + '18' }]}>
							{/* Header */}
							<View style={styles.cardHeader}>
								<Text style={[styles.spriteName, { color: theme.screen.text }]}>{terrainKey}</Text>
								{count > 0 && (
									<Text style={[styles.spriteCount, { color: theme.screen.text + '80' }]}>
										{count} platziert
									</Text>
								)}
							</View>

							{/* Preview + Controls row */}
							<View style={styles.previewRow}>
								{/* Image Preview with anchor dot overlay */}
								<View style={[styles.previewContainer, { backgroundColor: theme.screen.text + '08' }]}>
									{imgUri ? (
										<WebView
											source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}html,body{width:${PREVIEW_HEIGHT}px;height:${PREVIEW_HEIGHT}px;overflow:hidden;background:transparent}img{width:100%;height:100%;object-fit:contain}</style></head><body><img src="${imgUri.replace(/"/g, '&quot;')}" onload="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(this.naturalWidth+','+this.naturalHeight)"/></body></html>` }}
											style={[styles.previewImage, { backgroundColor: 'transparent' }]}
											originWhitelist={['*']}
											scrollEnabled={false}
											javaScriptEnabled={true}
											pointerEvents="none"
											onMessage={(event) => {
												const parts = event.nativeEvent.data.split(',');
												const w = parseInt(parts[0], 10);
												const h = parseInt(parts[1], 10);
												if (w > 0 && h > 0) {
													setImageDims((prev) => ({ ...prev, [terrainKey]: { width: w, height: h } }));
												}
											}}
										/>
									) : (
										<View style={styles.previewPlaceholder}>
											<Ionicons name="image-outline" size={40} color={theme.screen.text + '40'} />
										</View>
									)}
									{/* Crosshair lines */}
									<View style={[styles.crosshairH, { top: crosshairTop - 0.5 }]} />
									<View style={[styles.crosshairV, { left: crosshairLeft - 0.5 }]} />
									{/* Anchor point indicator (red dot) */}
									<View
										style={[
											styles.anchorDot,
											{ left: dotLeft, top: dotTop },
										]}
									/>
								</View>

								{/* Directional buttons */}
								<View style={styles.controlsColumn}>
									{/* Up */}
									<View style={styles.dpadRow}>
										<TouchableOpacity
											style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
											onPress={() => adjustAnchor(terrainKey, 0, -ANCHOR_STEP)}
											disabled={anchorY <= 0}
										>
											<Ionicons name="arrow-up" size={20} color={anchorY <= 0 ? theme.screen.text + '30' : theme.screen.text} />
										</TouchableOpacity>
									</View>
									{/* Left / Reset / Right */}
									<View style={styles.dpadRow}>
										<TouchableOpacity
											style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
											onPress={() => adjustAnchor(terrainKey, -ANCHOR_STEP, 0)}
											disabled={anchorX <= 0}
										>
											<Ionicons name="arrow-back" size={20} color={anchorX <= 0 ? theme.screen.text + '30' : theme.screen.text} />
										</TouchableOpacity>
										<TouchableOpacity
											style={[
												styles.dpadCenter,
												{ backgroundColor: isDefault ? theme.screen.text + '12' : PRIMARY_COLOR + '20' },
											]}
											onPress={() => handleReset(terrainKey)}
										>
											<Ionicons name="refresh" size={16} color={isDefault ? theme.screen.text + '40' : PRIMARY_COLOR} />
										</TouchableOpacity>
										<TouchableOpacity
											style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
											onPress={() => adjustAnchor(terrainKey, ANCHOR_STEP, 0)}
											disabled={anchorX >= 1}
										>
											<Ionicons name="arrow-forward" size={20} color={anchorX >= 1 ? theme.screen.text + '30' : theme.screen.text} />
										</TouchableOpacity>
									</View>
									{/* Down */}
									<View style={styles.dpadRow}>
										<TouchableOpacity
											style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
											onPress={() => adjustAnchor(terrainKey, 0, ANCHOR_STEP)}
											disabled={anchorY >= 1}
										>
											<Ionicons name="arrow-down" size={20} color={anchorY >= 1 ? theme.screen.text + '30' : theme.screen.text} />
										</TouchableOpacity>
									</View>

									{/* Anchor values */}
									<View style={styles.valuesRow}>
										<Text style={[styles.valueLabel, { color: theme.screen.text + '80' }]}>
											X: {anchorX.toFixed(2)}
										</Text>
										<Text style={[styles.valueLabel, { color: theme.screen.text + '80' }]}>
											Y: {anchorY.toFixed(2)}
										</Text>
									</View>
								</View>
							</View>

							{/* Scale stepper row */}
							<View style={[styles.scaleSeparator, { borderColor: theme.screen.text + '12' }]} />
							<View style={styles.scaleRow}>
								<Text style={[styles.scaleLabel, { color: theme.screen.text + '80' }]}>Skalierung</Text>
								<View style={styles.scaleControls}>
									<TouchableOpacity
										style={[styles.scaleButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustScale(terrainKey, -SCALE_STEP)}
										disabled={scale <= SCALE_MIN}
									>
										<Ionicons name="remove" size={18} color={scale <= SCALE_MIN ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
									<Text style={[styles.scaleValue, { color: scale === SCALE_DEFAULT ? theme.screen.text + '80' : PRIMARY_COLOR }]}>
										{scale.toFixed(1)}×
									</Text>
									<TouchableOpacity
										style={[styles.scaleButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustScale(terrainKey, SCALE_STEP)}
										disabled={scale >= SCALE_MAX}
									>
										<Ionicons name="add" size={18} color={scale >= SCALE_MAX ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
								</View>
							</View>
						</View>

						{/* Hex field preview */}
						{imgUri && (
							<>
								<SettingsListGroupTitle title="Hex Feld Vorschau" />
								<Text style={[styles.description, { color: theme.screen.text + '99' }]}>
									Ungefähre Darstellung der Textur auf dem Hex-Feld. Der rote Punkt markiert den Ankerpunkt.
								</Text>
								<View style={[styles.hexPreviewWrapper, { borderColor: theme.screen.text + '18' }]}>
									<HexFieldPreview
										imgUri={imgUri}
										terrainKey={terrainKey}
										perSpriteScale={scale}
										anchorX={anchorX}
										anchorY={anchorY}
									/>
								</View>
							</>
						)}
					</>
				);
			})()}

			<View style={styles.bottomSpacer} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingBottom: 40,
	},
	description: {
		fontSize: 13,
		paddingHorizontal: 16,
		paddingBottom: 12,
		lineHeight: 18,
	},
	typeCard: {
		marginTop: 12,
		marginHorizontal: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderRadius: 12,
		padding: 12,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	spriteName: {
		fontSize: 16,
		fontWeight: '700',
	},
	spriteCount: {
		fontSize: 12,
	},
	previewRow: {
		flexDirection: 'row',
		gap: 16,
		alignItems: 'center',
	},
	previewContainer: {
		width: PREVIEW_HEIGHT,
		height: PREVIEW_HEIGHT,
		borderRadius: 8,
		overflow: 'hidden',
		position: 'relative',
	},
	previewImage: {
		width: PREVIEW_HEIGHT,
		height: PREVIEW_HEIGHT,
	},
	previewPlaceholder: {
		width: PREVIEW_HEIGHT,
		height: PREVIEW_HEIGHT,
		alignItems: 'center',
		justifyContent: 'center',
	},
	anchorDot: {
		position: 'absolute',
		width: ANCHOR_DOT_SIZE,
		height: ANCHOR_DOT_SIZE,
		borderRadius: ANCHOR_DOT_SIZE / 2,
		backgroundColor: '#ef4444',
		borderWidth: 2,
		borderColor: '#ffffff',
	},
	crosshairH: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 1,
		backgroundColor: '#ef444480',
	},
	crosshairV: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		width: 1,
		backgroundColor: '#ef444480',
	},
	controlsColumn: {
		flex: 1,
		alignItems: 'center',
		gap: 4,
	},
	dpadRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 4,
	},
	dpadButton: {
		width: 40,
		height: 40,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dpadCenter: {
		width: 36,
		height: 40,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	valuesRow: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	valueLabel: {
		fontSize: 12,
		fontFamily: 'monospace',
		fontWeight: '500',
	},
	bottomSpacer: {
		height: 40,
	},
	copyButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginHorizontal: 12,
		marginTop: 12,
		paddingVertical: 12,
		borderRadius: 10,
	},
	copyButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	scaleSeparator: {
		borderTopWidth: 1,
		marginTop: 12,
		marginBottom: 10,
	},
	scaleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	scaleLabel: {
		fontSize: 14,
		fontWeight: '600',
	},
	scaleControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	scaleButton: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	scaleValue: {
		fontSize: 15,
		fontFamily: 'monospace',
		fontWeight: '700',
		minWidth: 44,
		textAlign: 'center',
	},
	hexPreviewWrapper: {
		marginHorizontal: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderRadius: 12,
		overflow: 'hidden',
	},
});

