import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';

import { OBJECT_SPRITES } from '../../assets/objects/objectSprites';
import { setHexTileCustomization } from '../../store/hexTileSlice';
import type { RootState, AppDispatch } from '../../store/store';

const PRIMARY_COLOR = '#2563eb';
const ANCHOR_STEP = 0.05;
const ANCHOR_PRECISION = 100; // 2 decimal places

/** Parse a billboard key of the form "objects:N" into the corresponding sprite. */
function parseBillboardKey(billboard: string) {
	const colonIdx = billboard.indexOf(':');
	if (colonIdx < 0 || billboard.slice(0, colonIdx) !== 'objects') return null;
	const idx = parseInt(billboard.slice(colonIdx + 1), 10);
	const sprite = OBJECT_SPRITES[idx];
	if (!sprite) return null;
	return { sprite, idx };
}

type BillboardEntry = {
	h3Index: string;
	billboardKey: string;
	spriteName: string;
	anchorY: number;
};

export default function BillboardConfigScreen() {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const records = useSelector((state: RootState) => state.hexTiles.records);

	// Collect all hex tiles that have a billboard assigned
	const entries: BillboardEntry[] = useMemo(() => {
		const result: BillboardEntry[] = [];
		for (const [h3Index, record] of Object.entries(records)) {
			if (!record.billboard) continue;
			const parsed = parseBillboardKey(record.billboard);
			if (!parsed) continue;
			result.push({
				h3Index,
				billboardKey: record.billboard,
				spriteName: parsed.sprite.name,
				anchorY: parsed.sprite.anchorY,
			});
		}
		// Sort by sprite name, then h3Index for consistency
		result.sort((a, b) => a.spriteName.localeCompare(b.spriteName) || a.h3Index.localeCompare(b.h3Index));
		return result;
	}, [records]);

	// Local override state for anchorY values (h3Index → anchorY)
	const [anchorOverrides, setAnchorOverrides] = useState<Record<string, number>>({});

	const getAnchorY = useCallback((entry: BillboardEntry) => {
		return anchorOverrides[entry.h3Index] ?? entry.anchorY;
	}, [anchorOverrides]);

	const adjustAnchor = useCallback((h3Index: string, currentAnchor: number, delta: number) => {
		const next = Math.max(0, Math.min(1, Math.round((currentAnchor + delta) * ANCHOR_PRECISION) / ANCHOR_PRECISION));
		setAnchorOverrides(prev => ({ ...prev, [h3Index]: next }));
	}, []);

	// Build config JSON for all billboard anchor points
	const buildConfigJson = useCallback(() => {
		const config: Record<string, { billboard: string; anchorY: number }> = {};
		for (const entry of entries) {
			const anchor = getAnchorY(entry);
			config[entry.h3Index] = {
				billboard: entry.billboardKey,
				anchorY: anchor,
			};
		}
		return JSON.stringify(config, null, 2);
	}, [entries, getAnchorY]);

	const handleCopyConfig = useCallback(async () => {
		const json = buildConfigJson();
		await Clipboard.setStringAsync(json);
		Alert.alert('Copied', 'Billboard config copied to clipboard.');
	}, [buildConfigJson]);

	// Build OBJECT_SPRITES override snippet with per-sprite anchorY values
	const buildSpritesOverrideJson = useCallback(() => {
		// Collect the latest anchorY per sprite index (last wins if multiple tiles have same sprite)
		const spriteAnchors: Record<number, number> = {};
		for (const entry of entries) {
			const parsed = parseBillboardKey(entry.billboardKey);
			if (!parsed) continue;
			spriteAnchors[parsed.idx] = getAnchorY(entry);
		}
		const overrides = OBJECT_SPRITES.map((sprite, idx) => ({
			name: sprite.name,
			anchorY: spriteAnchors[idx] !== undefined ? spriteAnchors[idx] : sprite.anchorY,
		}));
		return JSON.stringify(overrides, null, 2);
	}, [entries, getAnchorY]);

	const handleCopySpritesConfig = useCallback(async () => {
		const json = buildSpritesOverrideJson();
		await Clipboard.setStringAsync(json);
		Alert.alert('Copied', 'Sprites anchorY config copied to clipboard.');
	}, [buildSpritesOverrideJson]);

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.content}>
			<SettingsListGroupTitle title="Placed Billboards" />

			{entries.length === 0 && (
				<Text style={[styles.emptyText, { color: theme.screen.text + '80' }]}>
					No billboards placed yet. Place billboards on hex tiles in the Record screen first.
				</Text>
			)}

			{entries.map((entry) => {
				const anchor = getAnchorY(entry);
				return (
					<View
						key={entry.h3Index}
						style={[styles.entryRow, { borderBottomColor: theme.screen.text + '18' }]}
					>
						<View style={styles.entryInfo}>
							<Text style={[styles.entryName, { color: theme.screen.text }]}>{entry.spriteName}</Text>
							<Text style={[styles.entryH3, { color: theme.screen.text + '80' }]} numberOfLines={1}>
								{entry.h3Index}
							</Text>
						</View>
						<View style={styles.anchorControl}>
							<Text style={[styles.anchorLabel, { color: theme.screen.icon }]}>anchorY</Text>
							<View style={styles.anchorStepper}>
								<TouchableOpacity
									style={[styles.stepButton, { opacity: anchor <= 0 ? 0.4 : 1 }]}
									onPress={() => adjustAnchor(entry.h3Index, anchor, -ANCHOR_STEP)}
									disabled={anchor <= 0}
								>
									<Text style={styles.stepButtonText}>−</Text>
								</TouchableOpacity>
								<Text style={[styles.anchorValue, { color: theme.screen.text }]}>
									{anchor.toFixed(2)}
								</Text>
								<TouchableOpacity
									style={[styles.stepButton, { opacity: anchor >= 1 ? 0.4 : 1 }]}
									onPress={() => adjustAnchor(entry.h3Index, anchor, ANCHOR_STEP)}
									disabled={anchor >= 1}
								>
									<Text style={styles.stepButtonText}>+</Text>
								</TouchableOpacity>
							</View>
							<View style={styles.anchorPresets}>
								<TouchableOpacity
									style={[styles.presetButton, anchor === 0 && { backgroundColor: PRIMARY_COLOR }]}
									onPress={() => setAnchorOverrides(prev => ({ ...prev, [entry.h3Index]: 0 }))}
								>
									<Text style={[styles.presetText, anchor === 0 && { color: '#fff' }]}>Top</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.presetButton, anchor === 0.5 && { backgroundColor: PRIMARY_COLOR }]}
									onPress={() => setAnchorOverrides(prev => ({ ...prev, [entry.h3Index]: 0.5 }))}
								>
									<Text style={[styles.presetText, anchor === 0.5 && { color: '#fff' }]}>Center</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.presetButton, anchor === 1 && { backgroundColor: PRIMARY_COLOR }]}
									onPress={() => setAnchorOverrides(prev => ({ ...prev, [entry.h3Index]: 1 }))}
								>
									<Text style={[styles.presetText, anchor === 1 && { color: '#fff' }]}>Bottom</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				);
			})}

			{entries.length > 0 && (
				<>
					<SettingsListGroupTitle title="Actions" />

					<TouchableOpacity
						style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
						onPress={handleCopyConfig}
					>
						<Ionicons name="copy-outline" size={18} color="#ffffff" />
						<Text style={styles.actionButtonText}>Copy Billboard Config (JSON)</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.actionButton, { backgroundColor: '#16a34a', marginTop: 8 }]}
						onPress={handleCopySpritesConfig}
					>
						<Ionicons name="code-slash-outline" size={18} color="#ffffff" />
						<Text style={styles.actionButtonText}>Copy Sprites AnchorY Config</Text>
					</TouchableOpacity>
				</>
			)}

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
	emptyText: {
		fontSize: 14,
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	entryRow: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	entryInfo: {
		marginBottom: 8,
	},
	entryName: {
		fontSize: 15,
		fontWeight: '600',
	},
	entryH3: {
		fontSize: 11,
		fontFamily: 'monospace',
		marginTop: 2,
	},
	anchorControl: {
		gap: 6,
	},
	anchorLabel: {
		fontSize: 12,
		fontWeight: '500',
	},
	anchorStepper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	stepButton: {
		width: 32,
		height: 32,
		borderRadius: 6,
		backgroundColor: '#e5e7eb',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepButtonText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#374151',
	},
	anchorValue: {
		fontSize: 15,
		fontWeight: '600',
		fontFamily: 'monospace',
		minWidth: 44,
		textAlign: 'center',
	},
	anchorPresets: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 4,
	},
	presetButton: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 4,
		backgroundColor: '#e5e7eb',
	},
	presetText: {
		fontSize: 12,
		fontWeight: '500',
		color: '#374151',
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginHorizontal: 16,
		marginTop: 12,
		paddingVertical: 12,
		borderRadius: 8,
	},
	actionButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	bottomSpacer: {
		height: 40,
	},
});
