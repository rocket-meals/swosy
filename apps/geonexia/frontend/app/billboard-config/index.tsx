import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useDispatch, useSelector } from 'react-redux';

import { OBJECT_SPRITES, ObjectSprite } from '../../assets/objects/objectSprites';
import { setSpriteAnchor, resetSpriteAnchor } from '../../store/billboardConfigSlice';
import type { RootState, AppDispatch } from '../../store/store';
import type { HexTileRecord } from '../../helpers/HexTileStorage';

const PRIMARY_COLOR = '#2563eb';
const ANCHOR_STEP = 0.05;
const ANCHOR_PRECISION = 100; // 2 decimal places

const PREVIEW_SIZE = 140;
const ANCHOR_DOT_SIZE = 12;

/** Clamp a value between 0 and 1, rounded to 2 decimal places. */
function clampAnchor(value: number): number {
	return Math.max(0, Math.min(1, Math.round(value * ANCHOR_PRECISION) / ANCHOR_PRECISION));
}

/** Unique sprite types that are currently placed on the map. */
type PlacedSpriteType = {
	spriteIndex: number;
	sprite: ObjectSprite;
	/** Number of hex tiles using this billboard type. */
	count: number;
};

export default function BillboardConfigScreen() {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const records = useSelector((state: RootState) => state.hexTiles.records);
	const spriteAnchors = useSelector((state: RootState) => state.billboardConfig.spriteAnchors);

	// Collect unique sprite types that are placed on the map.
	const placedTypes: PlacedSpriteType[] = useMemo(() => {
		const countMap = new Map<number, number>();
		for (const record of Object.values(records) as HexTileRecord[]) {
			if (!record.billboard) continue;
			const colonIdx = record.billboard.indexOf(':');
			if (colonIdx < 0 || record.billboard.slice(0, colonIdx) !== 'objects') continue;
			const idx = parseInt(record.billboard.slice(colonIdx + 1), 10);
			if (!OBJECT_SPRITES[idx]) continue;
			countMap.set(idx, (countMap.get(idx) ?? 0) + 1);
		}
		const result: PlacedSpriteType[] = [];
		for (const [spriteIndex, count] of countMap.entries()) {
			result.push({ spriteIndex, sprite: OBJECT_SPRITES[spriteIndex], count });
		}
		result.sort((a, b) => a.sprite.name.localeCompare(b.sprite.name));
		return result;
	}, [records]);

	// SVG data URI cache for preview images.
	const [svgUris, setSvgUris] = useState<Record<number, string>>({});

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const uris: Record<number, string> = {};
			for (const { spriteIndex, sprite } of placedTypes) {
				try {
					const asset = Asset.fromModule(sprite.source as number);
					await asset.downloadAsync();
					if (cancelled) return;
					if (Platform.OS === 'web') {
						uris[spriteIndex] = asset.uri;
					} else {
						if (!asset.localUri) continue;
						const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
							encoding: FileSystem.EncodingType.Base64,
						});
						if (cancelled) return;
						uris[spriteIndex] = `data:image/svg+xml;base64,${base64}`;
					}
				} catch {
					// Ignore load failures for individual sprites.
				}
			}
			if (!cancelled) setSvgUris(uris);
		})();
		return () => { cancelled = true; };
	}, [placedTypes]);

	const getAnchorX = useCallback((spriteIndex: number) => {
		return spriteAnchors[spriteIndex]?.anchorX ?? OBJECT_SPRITES[spriteIndex].anchorX;
	}, [spriteAnchors]);

	const getAnchorY = useCallback((spriteIndex: number) => {
		return spriteAnchors[spriteIndex]?.anchorY ?? OBJECT_SPRITES[spriteIndex].anchorY;
	}, [spriteAnchors]);

	const adjustAnchor = useCallback((spriteIndex: number, deltaX: number, deltaY: number) => {
		const currentX = getAnchorX(spriteIndex);
		const currentY = getAnchorY(spriteIndex);
		dispatch(setSpriteAnchor({
			spriteIndex,
			anchorX: clampAnchor(currentX + deltaX),
			anchorY: clampAnchor(currentY + deltaY),
		}));
	}, [dispatch, getAnchorX, getAnchorY]);

	const handleReset = useCallback((spriteIndex: number) => {
		dispatch(resetSpriteAnchor({ spriteIndex }));
	}, [dispatch]);

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.content}>
			<SettingsListGroupTitle title="Billboard Anchor Points" />

			<Text style={[styles.description, { color: theme.screen.text + '99' }]}>
				Adjust the anchor point for each billboard type. The red dot shows where the billboard attaches to the map. Changes apply to all billboards of that type.
			</Text>

			{placedTypes.length === 0 && (
				<Text style={[styles.emptyText, { color: theme.screen.text + '80' }]}>
					No billboards placed yet. Place billboards on hex tiles in the Record screen first.
				</Text>
			)}

			{placedTypes.map(({ spriteIndex, sprite, count }) => {
				const anchorX = getAnchorX(spriteIndex);
				const anchorY = getAnchorY(spriteIndex);
				const svgUri = svgUris[spriteIndex];
				const isDefault = !spriteAnchors[spriteIndex];

				return (
					<View
						key={spriteIndex}
						style={[styles.typeCard, { borderColor: theme.screen.text + '18' }]}
					>
						{/* Header */}
						<View style={styles.cardHeader}>
							<Text style={[styles.spriteName, { color: theme.screen.text }]}>{sprite.name}</Text>
							<Text style={[styles.spriteCount, { color: theme.screen.text + '80' }]}>
								{count} placed
							</Text>
						</View>

						{/* Preview + Controls row */}
						<View style={styles.previewRow}>
							{/* SVG Preview with anchor dot */}
							<View style={[styles.previewContainer, { backgroundColor: theme.screen.text + '08' }]}>
								{svgUri ? (
									<Image
										source={{ uri: svgUri }}
										style={styles.previewImage}
										resizeMode="contain"
									/>
								) : (
									<View style={styles.previewPlaceholder}>
										<Ionicons name="image-outline" size={40} color={theme.screen.text + '40'} />
									</View>
								)}
								{/* Anchor point indicator (red dot) */}
								<View
									style={[
										styles.anchorDot,
										{
											left: anchorX * PREVIEW_SIZE - ANCHOR_DOT_SIZE / 2,
											top: anchorY * PREVIEW_SIZE - ANCHOR_DOT_SIZE / 2,
										},
									]}
								/>
								{/* Crosshair lines */}
								<View
									style={[
										styles.crosshairH,
										{ top: anchorY * PREVIEW_SIZE - 0.5 },
									]}
								/>
								<View
									style={[
										styles.crosshairV,
										{ left: anchorX * PREVIEW_SIZE - 0.5 },
									]}
								/>
							</View>

							{/* Directional buttons */}
							<View style={styles.controlsColumn}>
								{/* Up */}
								<View style={styles.dpadRow}>
									<TouchableOpacity
										style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustAnchor(spriteIndex, 0, -ANCHOR_STEP)}
										disabled={anchorY <= 0}
									>
										<Ionicons name="arrow-up" size={20} color={anchorY <= 0 ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
								</View>
								{/* Left / Reset / Right */}
								<View style={styles.dpadRow}>
									<TouchableOpacity
										style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustAnchor(spriteIndex, -ANCHOR_STEP, 0)}
										disabled={anchorX <= 0}
									>
										<Ionicons name="arrow-back" size={20} color={anchorX <= 0 ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.dpadCenter,
											{ backgroundColor: isDefault ? theme.screen.text + '12' : PRIMARY_COLOR + '20' },
										]}
										onPress={() => handleReset(spriteIndex)}
									>
										<Ionicons name="refresh" size={16} color={isDefault ? theme.screen.text + '40' : PRIMARY_COLOR} />
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustAnchor(spriteIndex, ANCHOR_STEP, 0)}
										disabled={anchorX >= 1}
									>
										<Ionicons name="arrow-forward" size={20} color={anchorX >= 1 ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
								</View>
								{/* Down */}
								<View style={styles.dpadRow}>
									<TouchableOpacity
										style={[styles.dpadButton, { backgroundColor: theme.screen.text + '12' }]}
										onPress={() => adjustAnchor(spriteIndex, 0, ANCHOR_STEP)}
										disabled={anchorY >= 1}
									>
										<Ionicons name="arrow-down" size={20} color={anchorY >= 1 ? theme.screen.text + '30' : theme.screen.text} />
									</TouchableOpacity>
								</View>

								{/* Values */}
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
					</View>
				);
			})}

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
	emptyText: {
		fontSize: 14,
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	typeCard: {
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
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
		borderRadius: 8,
		overflow: 'hidden',
		position: 'relative',
	},
	previewImage: {
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
	},
	previewPlaceholder: {
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
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
});
