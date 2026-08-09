import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme, type Theme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../../constants/ComponentIds';
import { computeRoll, type DieResult, type DieRollPair, type PoolDie, type RollMode, type RollResult } from '../../helpers/DiceRollHelper';
import {
	appendDiceHistoryEntry,
	buildDiceHistoryEntry,
	collectHistorySides,
	computeDiceHistoryStats,
	filterHistoryEntries,
	loadDiceHistory,
	saveDiceHistory,
	type DiceHistoryEntry,
} from '../../helpers/DiceHistoryStorage';
import { generateId } from '../../helpers/RandomHelper';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PRIMARY_COLOR = '#2563eb';

const MAX_POOL_SIZE = 12;
const MIN_CUSTOM_SIDES = 2;
const MAX_CUSTOM_SIDES = 1000;
const ROLL_ANIMATION_MS = 600;
const ROLL_ANIMATION_STEP_MS = 75;

const DICE_PRESETS = [4, 6, 8, 10, 12, 20] as const;

const DICE_TYPE_ICON: Record<number, MCIName> = {
	4: 'dice-d4',
	6: 'dice-d6',
	8: 'dice-d8',
	10: 'dice-d10',
	12: 'dice-d12',
	20: 'dice-d20',
};
const CUSTOM_ICON: MCIName = 'shape-polygon-plus';
const FALLBACK_ICON: MCIName = 'dice-multiple-outline';

function diceIconForSides(sides: number): MCIName {
	return DICE_TYPE_ICON[sides] ?? FALLBACK_ICON;
}

const ROLL_MODES: { key: RollMode; label: string; icon: MCIName }[] = [
	{ key: 'sum', label: 'Summe', icon: 'sigma' },
	{ key: 'advantage', label: 'Vorteil', icon: 'arrow-up-bold-circle-outline' },
	{ key: 'disadvantage', label: 'Nachteil', icon: 'arrow-down-bold-circle-outline' },
];

/** How many history rows are rendered - the stats always cover the full history. */
const MAX_HISTORY_ROWS = 50;

function modeLabel(mode: RollMode): string {
	return ROLL_MODES.find((entry) => entry.key === mode)?.label ?? mode;
}

function formatRolledAt(timestamp: number): string {
	const date = new Date(timestamp);
	const day = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	return `${day} ${time}`;
}

function formatAverage(average: number | null): string {
	if (average === null) return '-';
	return average.toFixed(1).replace('.', ',');
}

function DiceValueRow({ dice, theme }: Readonly<{ dice: DieResult[]; theme: Theme }>) {
	return (
		<View style={styles.resultsRow}>
			{dice.map((die) => (
				<View key={die.id} style={[styles.resultBadge, { backgroundColor: theme.screen.iconBg }]}>
					<Text style={[styles.resultBadgeSides, { color: theme.screen.placeholder }]}>W{die.sides}</Text>
					<Text style={[styles.resultBadgeValue, { color: theme.screen.text }]}>{die.value}</Text>
				</View>
			))}
		</View>
	);
}

// One die in advantage/disadvantage mode: both of its rolled values side by
// side, with the kept one outlined. `revealed` is false while the roll
// animation is still shuffling so nothing gives away the outcome mid-shuffle.
function DiePairBadge({ die, theme, revealed }: Readonly<{ die: DieRollPair; theme: Theme; revealed: boolean }>) {
	return (
		<View style={[styles.pairBadge, { backgroundColor: theme.screen.iconBg }]}>
			<Text style={[styles.resultBadgeSides, { color: theme.screen.placeholder }]}>W{die.sides}</Text>
			<View style={styles.pairValuesRow}>
				{(['A', 'B'] as const).map((rollKey) => {
					const isKept = revealed && die.kept === rollKey;
					const isDimmed = revealed && die.kept !== rollKey;
					return (
						<View
							key={rollKey}
							style={[
								styles.pairValueBox,
								{
									backgroundColor: theme.screen.background,
									borderColor: isKept ? PRIMARY_COLOR : 'transparent',
									opacity: isDimmed ? 0.45 : 1,
								},
							]}
						>
							<Text style={[styles.resultBadgeValue, { color: theme.screen.text }]}>
								{rollKey === 'A' ? die.valueA : die.valueB}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

// One archived roll: timestamp and mode on the left, the counted value of every
// die in the middle (maximum rolls highlighted - that's what the counter above
// tallies), the roll's total on the right.
function HistoryEntryRow({ entry, theme }: Readonly<{ entry: DiceHistoryEntry; theme: Theme }>) {
	return (
		<View nativeID={`${ComponentIds.DICE_HISTORY_ENTRY_PREFIX}${entry.id}`} style={[styles.historyRow, { backgroundColor: theme.screen.iconBg }]}>
			<View style={styles.historyRowLeft}>
				<Text style={[styles.historyRowTime, { color: theme.screen.placeholder }]}>{formatRolledAt(entry.rolledAt)}</Text>
				<Text style={[styles.historyRowMode, { color: theme.screen.placeholder }]}>{modeLabel(entry.mode)}</Text>
			</View>
			<View style={styles.historyRowDice}>
				{entry.dice.map((die, index) => {
					const isMax = die.value === die.sides;
					return (
						<Text
							key={`${entry.id}-${index}`}
							style={[styles.historyRowDie, { color: isMax ? PRIMARY_COLOR : theme.screen.text, fontWeight: isMax ? '700' : '400' }]}
						>
							W{die.sides}: {die.value}
						</Text>
					);
				})}
			</View>
			<Text style={[styles.historyRowTotal, { color: theme.screen.text }]}>{entry.total}</Text>
		</View>
	);
}

export default function DiceScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const [pool, setPool] = useState<PoolDie[]>([]);
	const [rollMode, setRollMode] = useState<RollMode>('sum');
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customSidesText, setCustomSidesText] = useState('');
	const [results, setResults] = useState<RollResult | null>(null);
	const [isRolling, setIsRolling] = useState(false);
	const [history, setHistory] = useState<DiceHistoryEntry[]>([]);
	/** Active die-type filter for the history section - `null` shows everything. */
	const [historyFilter, setHistoryFilter] = useState<number | null>(null);
	const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const nextIdRef = useRef(0);

	// Guards the save effect below: without it the initial empty state would be
	// written to disk while the load is still in flight and could wipe the
	// stored history.
	const historyLoadedRef = useRef(false);

	useEffect(() => {
		let cancelled = false;
		loadDiceHistory().then((entries) => {
			historyLoadedRef.current = true;
			if (!cancelled) setHistory(entries);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const addDie = useCallback((sides: number) => {
		if (!Number.isFinite(sides) || sides < MIN_CUSTOM_SIDES || pool.length >= MAX_POOL_SIZE) return;
		nextIdRef.current += 1;
		setPool((prev) => [...prev, { id: `die-${nextIdRef.current}`, sides }]);
	}, [pool.length]);

	const removeDie = useCallback((id: string) => {
		setPool((prev) => prev.filter((die) => die.id !== id));
	}, []);

	const clearPool = useCallback(() => {
		setPool([]);
	}, []);

	const handleAddCustom = useCallback(() => {
		if (pool.length >= MAX_POOL_SIZE) return;
		const sides = Number.parseInt(customSidesText, 10);
		if (!Number.isFinite(sides) || sides < MIN_CUSTOM_SIDES || sides > MAX_CUSTOM_SIDES) return;
		addDie(sides);
		setCustomSidesText('');
		setShowCustomInput(false);
	}, [customSidesText, addDie, pool.length]);

	/** Archive a finished roll: prepend to the (capped) history and persist it. */
	const recordRoll = useCallback((roll: RollResult) => {
		const entry = buildDiceHistoryEntry(roll, { id: generateId(), rolledAt: Date.now() });
		setHistory((prev) => appendDiceHistoryEntry(prev, entry));
	}, []);

	// Persisting in an effect (instead of inside recordRoll) keeps the saved
	// state in lockstep with whatever React actually committed.
	useEffect(() => {
		if (!historyLoadedRef.current) return;
		void saveDiceHistory(history);
	}, [history]);

	const clearHistory = useCallback(() => {
		setHistory([]);
		setHistoryFilter(null);
	}, []);

	// Shuffle the faces rapidly for a moment before settling on the final roll -
	// cheap "animation" without needing reanimated. Each tick is already a
	// genuine full roll via computeRoll, so the very last tick before the
	// interval clears simply becomes the final result - only that one is
	// recorded in the history.
	const handleRoll = useCallback(() => {
		if (isRolling || pool.length === 0) return;
		setIsRolling(true);
		const startedAt = Date.now();
		animationRef.current = setInterval(() => {
			const roll = computeRoll(pool, rollMode);
			setResults(roll);
			if (Date.now() - startedAt >= ROLL_ANIMATION_MS && animationRef.current) {
				clearInterval(animationRef.current);
				animationRef.current = null;
				setIsRolling(false);
				recordRoll(roll);
			}
		}, ROLL_ANIMATION_STEP_MS);
	}, [pool, isRolling, rollMode, recordRoll]);

	useEffect(() => {
		return () => {
			if (animationRef.current) clearInterval(animationRef.current);
		};
	}, []);

	let rollButtonLabel = 'Würfeln';
	if (isRolling) {
		rollButtonLabel = 'Würfeln...';
	} else if (pool.length === 0) {
		rollButtonLabel = 'Wähle zuerst Würfel';
	}

	const historySides = collectHistorySides(history);
	// A stale filter (its die type vanished from the history, e.g. after
	// clearing) falls back to "Alle" instead of showing an empty section.
	const effectiveFilter = historyFilter !== null && historySides.includes(historyFilter) ? historyFilter : null;
	const filteredHistory = filterHistoryEntries(history, effectiveFilter);
	const historyStats = computeDiceHistoryStats(history, effectiveFilter);
	const visibleHistory = filteredHistory.slice(0, MAX_HISTORY_ROWS);

	const historyStatItems: { key: string; label: string; value: string }[] = [
		{ key: 'rolls', label: 'Würfe', value: String(historyStats.rollCount) },
		{ key: 'max', label: effectiveFilter !== null ? `Max (${effectiveFilter})` : 'Max', value: `${historyStats.maxCount}×` },
		{ key: 'min', label: 'Einsen', value: `${historyStats.minCount}×` },
		{ key: 'avg', label: 'Ø', value: formatAverage(historyStats.average) },
	];

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView contentContainerStyle={styles.content}>
				<SettingsListGroupTitle title="Würfel auswählen" />
				<View style={styles.typeRow}>
					{DICE_PRESETS.map((sides) => {
						const disabled = isRolling || pool.length >= MAX_POOL_SIZE;
						return (
							<TouchableOpacity
								key={sides}
								nativeID={`${ComponentIds.DICE_TYPE_BUTTON_PREFIX}${sides}`}
								style={[styles.typeChip, { borderColor: PRIMARY_COLOR, opacity: disabled ? 0.4 : 1 }]}
								onPress={() => addDie(sides)}
								disabled={disabled}
								activeOpacity={0.7}
							>
								<MaterialCommunityIcons name={diceIconForSides(sides)} size={26} color={PRIMARY_COLOR} />
								<Text style={[styles.typeChipText, { color: PRIMARY_COLOR }]}>W{sides}</Text>
							</TouchableOpacity>
						);
					})}
					<TouchableOpacity
						nativeID={`${ComponentIds.DICE_TYPE_BUTTON_PREFIX}custom`}
						style={[styles.typeChip, { borderColor: PRIMARY_COLOR, opacity: isRolling || pool.length >= MAX_POOL_SIZE ? 0.4 : 1 }]}
						onPress={() => setShowCustomInput((prev) => !prev)}
						disabled={isRolling || pool.length >= MAX_POOL_SIZE}
						activeOpacity={0.7}
					>
						<MaterialCommunityIcons name={CUSTOM_ICON} size={26} color={PRIMARY_COLOR} />
						<Text style={[styles.typeChipText, { color: PRIMARY_COLOR }]}>Custom</Text>
					</TouchableOpacity>
				</View>

				{showCustomInput && (
					<View style={styles.customRow}>
						<TextInput
							nativeID={ComponentIds.DICE_CUSTOM_INPUT}
							style={[styles.customInput, { color: theme.screen.text, backgroundColor: theme.screen.iconBg }]}
							placeholder={`Seitenzahl (${MIN_CUSTOM_SIDES}-${MAX_CUSTOM_SIDES})`}
							placeholderTextColor={theme.screen.placeholder}
							value={customSidesText}
							onChangeText={setCustomSidesText}
							keyboardType="number-pad"
							returnKeyType="done"
							editable={!isRolling}
							onSubmitEditing={handleAddCustom}
						/>
						<TouchableOpacity
							nativeID={ComponentIds.DICE_CUSTOM_ADD_BUTTON}
							style={[styles.customAddButton, { backgroundColor: PRIMARY_COLOR, opacity: isRolling || pool.length >= MAX_POOL_SIZE ? 0.4 : 1 }]}
							onPress={handleAddCustom}
							disabled={isRolling || pool.length >= MAX_POOL_SIZE}
							activeOpacity={0.8}
						>
							<Text style={styles.customAddButtonText}>Hinzufügen</Text>
						</TouchableOpacity>
					</View>
				)}

				<View style={styles.sectionHeaderRow}>
					<SettingsListGroupTitle title={`Ausgewählte Würfel (${pool.length})`} />
					{pool.length > 0 && (
						<TouchableOpacity
							nativeID={ComponentIds.DICE_POOL_CLEAR_BUTTON}
							onPress={clearPool}
							disabled={isRolling}
							hitSlop={8}
							style={[styles.clearButton, { opacity: isRolling ? 0.4 : 1 }]}
						>
							<Ionicons name="close-circle" size={16} color={theme.screen.placeholder} />
							<Text style={[styles.clearButtonText, { color: theme.screen.placeholder }]}>Leeren</Text>
						</TouchableOpacity>
					)}
				</View>
				{pool.length === 0 ? (
					<Text style={[styles.hintText, { color: theme.screen.placeholder }]}>
						Tippe oben auf einen Würfel, um ihn zur Auswahl hinzuzufügen.
					</Text>
				) : (
					<View style={styles.poolRow}>
						{pool.map((die) => (
							<TouchableOpacity
								key={die.id}
								nativeID={`${ComponentIds.DICE_POOL_ITEM_PREFIX}${die.id}`}
								style={[styles.poolChip, { backgroundColor: PRIMARY_COLOR, opacity: isRolling ? 0.6 : 1 }]}
								onPress={() => removeDie(die.id)}
								disabled={isRolling}
								activeOpacity={0.7}
							>
								<MaterialCommunityIcons name={diceIconForSides(die.sides)} size={20} color="#ffffff" />
								<Text style={styles.poolChipText}>W{die.sides}</Text>
								<Ionicons name="close" size={14} color="#ffffff" />
							</TouchableOpacity>
						))}
					</View>
				)}

				<SettingsListGroupTitle title="Wurf-Modus" />
				<View style={[styles.modeToggle, { backgroundColor: theme.screen.iconBg }]}>
					{ROLL_MODES.map((mode) => (
						<TouchableOpacity
							key={mode.key}
							nativeID={`${ComponentIds.DICE_MODE_BUTTON_PREFIX}${mode.key}`}
							style={[styles.modeButton, rollMode === mode.key && { backgroundColor: PRIMARY_COLOR }, { opacity: isRolling ? 0.6 : 1 }]}
							onPress={() => setRollMode(mode.key)}
							disabled={isRolling}
							activeOpacity={0.7}
						>
							<MaterialCommunityIcons name={mode.icon} size={16} color={rollMode === mode.key ? '#ffffff' : theme.screen.text} />
							<Text style={[styles.modeButtonText, { color: rollMode === mode.key ? '#ffffff' : theme.screen.text }]}>
								{mode.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				{rollMode !== 'sum' && (
					<Text style={[styles.hintText, { color: theme.screen.placeholder }]}>
						{rollMode === 'advantage'
							? 'Jeder Würfel wird zweimal geworfen - pro Würfel zählt der höhere Wert.'
							: 'Jeder Würfel wird zweimal geworfen - pro Würfel zählt der niedrigere Wert.'}
					</Text>
				)}

				{results && (
					<View style={styles.resultsArea}>
						{results.mode === 'sum' ? (
							<>
								<DiceValueRow dice={results.dice} theme={theme} />
								<Text style={[styles.totalText, { color: theme.screen.text }]}>Summe: {results.total}</Text>
							</>
						) : (
							<>
								<View style={styles.resultsRow}>
									{results.dice.map((die) => (
										<DiePairBadge key={die.id} die={die} theme={theme} revealed={!isRolling} />
									))}
								</View>
								<Text style={[styles.totalText, { color: theme.screen.text }]}>Summe: {results.keptTotal}</Text>
							</>
						)}
					</View>
				)}

				{history.length > 0 && (
					<>
						<View style={styles.sectionHeaderRow}>
							<SettingsListGroupTitle title="Historie" />
							<TouchableOpacity
								nativeID={ComponentIds.DICE_HISTORY_CLEAR_BUTTON}
								onPress={clearHistory}
								hitSlop={8}
								style={styles.clearButton}
							>
								<Ionicons name="close-circle" size={16} color={theme.screen.placeholder} />
								<Text style={[styles.clearButtonText, { color: theme.screen.placeholder }]}>Leeren</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.historyFilterRow}>
							<TouchableOpacity
								nativeID={ComponentIds.DICE_HISTORY_FILTER_ALL_BUTTON}
								style={[
									styles.historyFilterChip,
									{ borderColor: PRIMARY_COLOR },
									effectiveFilter === null && { backgroundColor: PRIMARY_COLOR },
								]}
								onPress={() => setHistoryFilter(null)}
								activeOpacity={0.7}
							>
								<Text style={[styles.historyFilterChipText, { color: effectiveFilter === null ? '#ffffff' : PRIMARY_COLOR }]}>
									Alle
								</Text>
							</TouchableOpacity>
							{historySides.map((sides) => {
								const selected = effectiveFilter === sides;
								return (
									<TouchableOpacity
										key={sides}
										nativeID={`${ComponentIds.DICE_HISTORY_FILTER_PREFIX}${sides}`}
										style={[
											styles.historyFilterChip,
											{ borderColor: PRIMARY_COLOR },
											selected && { backgroundColor: PRIMARY_COLOR },
										]}
										onPress={() => setHistoryFilter(selected ? null : sides)}
										activeOpacity={0.7}
									>
										<MaterialCommunityIcons name={diceIconForSides(sides)} size={16} color={selected ? '#ffffff' : PRIMARY_COLOR} />
										<Text style={[styles.historyFilterChipText, { color: selected ? '#ffffff' : PRIMARY_COLOR }]}>W{sides}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View nativeID={ComponentIds.DICE_HISTORY_STATS_ROW} style={styles.historyStatsRow}>
							{historyStatItems.map((item) => (
								<View key={item.key} style={[styles.historyStatBox, { backgroundColor: theme.screen.iconBg }]}>
									<Text style={[styles.historyStatValue, { color: theme.screen.text }]}>{item.value}</Text>
									<Text style={[styles.historyStatLabel, { color: theme.screen.placeholder }]}>{item.label}</Text>
								</View>
							))}
						</View>
						<Text style={[styles.hintText, { color: theme.screen.placeholder }]}>
							{effectiveFilter !== null
								? `Max (${effectiveFilter}) zählt, wie oft die ${effectiveFilter} mit einem W${effectiveFilter} gewürfelt wurde.`
								: 'Max zählt, wie oft ein Würfel seinen höchsten Wert zeigte - z.B. die 20 auf einem W20.'}
						</Text>

						<View style={styles.historyList}>
							{visibleHistory.map((entry) => (
								<HistoryEntryRow key={entry.id} entry={entry} theme={theme} />
							))}
						</View>
						{filteredHistory.length > visibleHistory.length && (
							<Text style={[styles.hintText, { color: theme.screen.placeholder }]}>
								Nur die letzten {MAX_HISTORY_ROWS} Würfe werden angezeigt - die Zähler oben umfassen alle.
							</Text>
						)}
					</>
				)}
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: theme.screen.background, borderTopColor: theme.screen.border }]}>
				<TouchableOpacity
					nativeID={ComponentIds.DICE_ROLL_BUTTON}
					style={[styles.rollButton, { backgroundColor: PRIMARY_COLOR, opacity: isRolling || pool.length === 0 ? 0.5 : 1 }]}
					onPress={handleRoll}
					disabled={isRolling || pool.length === 0}
					activeOpacity={0.8}
				>
					<MaterialCommunityIcons name={FALLBACK_ICON} size={24} color="#ffffff" />
					<Text style={styles.rollButtonText}>
						{rollButtonLabel}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
		paddingBottom: 32,
	},
	typeRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	typeChip: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
		width: 76,
		paddingVertical: 10,
		borderWidth: 1.5,
		borderRadius: 10,
	},
	typeChipText: {
		fontSize: 13,
		fontWeight: '700',
	},
	customRow: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 10,
		paddingHorizontal: 2,
	},
	customInput: {
		flex: 1,
		height: 40,
		borderRadius: 10,
		paddingHorizontal: 12,
		fontSize: 15,
	},
	customAddButton: {
		justifyContent: 'center',
		paddingHorizontal: 16,
		borderRadius: 10,
	},
	customAddButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	clearButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingRight: 16,
	},
	clearButtonText: {
		fontSize: 13,
		fontWeight: '600',
	},
	hintText: {
		fontSize: 14,
		paddingHorizontal: 16,
		paddingTop: 4,
	},
	poolRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingHorizontal: 16,
	},
	poolChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	poolChipText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '700',
	},
	modeToggle: {
		flexDirection: 'row',
		marginHorizontal: 16,
		borderRadius: 12,
		padding: 4,
		gap: 4,
	},
	modeButton: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 10,
		borderRadius: 9,
	},
	modeButtonText: {
		fontSize: 13,
		fontWeight: '600',
	},
	resultsArea: {
		alignItems: 'center',
		paddingTop: 32,
		paddingHorizontal: 16,
	},
	resultsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 10,
	},
	resultBadge: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 64,
		height: 64,
		borderRadius: 14,
	},
	resultBadgeSides: {
		fontSize: 11,
		fontWeight: '600',
	},
	resultBadgeValue: {
		fontSize: 24,
		fontWeight: '700',
	},
	pairBadge: {
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 8,
		borderRadius: 14,
	},
	pairValuesRow: {
		flexDirection: 'row',
		gap: 6,
	},
	pairValueBox: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 48,
		height: 48,
		borderRadius: 12,
		borderWidth: 2,
	},
	totalText: {
		fontSize: 22,
		fontWeight: '700',
		marginTop: 16,
	},
	historyFilterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingHorizontal: 16,
	},
	historyFilterChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderWidth: 1.5,
		borderRadius: 16,
	},
	historyFilterChipText: {
		fontSize: 13,
		fontWeight: '700',
	},
	historyStatsRow: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 16,
		marginTop: 12,
	},
	historyStatBox: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 10,
	},
	historyStatValue: {
		fontSize: 17,
		fontWeight: '700',
	},
	historyStatLabel: {
		fontSize: 11,
		fontWeight: '600',
		marginTop: 2,
	},
	historyList: {
		gap: 6,
		paddingHorizontal: 16,
		marginTop: 12,
	},
	historyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 10,
	},
	historyRowLeft: {
		width: 78,
	},
	historyRowTime: {
		fontSize: 12,
		fontWeight: '600',
	},
	historyRowMode: {
		fontSize: 11,
	},
	historyRowDice: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		columnGap: 8,
	},
	historyRowDie: {
		fontSize: 13,
	},
	historyRowTotal: {
		fontSize: 16,
		fontWeight: '700',
	},
	footer: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	rollButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
		height: 52,
		borderRadius: 12,
	},
	rollButtonText: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: '600',
	},
});
