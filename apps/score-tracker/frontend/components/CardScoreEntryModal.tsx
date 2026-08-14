import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';

// Same platform split as the score input on the game screen:
// BottomSheetTextInput's blur handler breaks on react-native-web.
const ResolvedManualScoreInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;
import type { CardCategory, CardItem, RuleExpr } from '../helpers/GameRules';
import { evaluateRuleExpr } from '../helpers/GameRules';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';

const CATEGORY_TITLES: Record<CardCategory, string> = {
	number: 'Zahlenkarten',
	modifier: 'Bonuskarten',
	multiplier: 'Multiplikator',
	action: 'Aktionskarten',
};

const CATEGORY_ORDER: CardCategory[] = ['number', 'modifier', 'multiplier', 'action'];

/**
 * Human-readable step-by-step breakdown of the score, assuming the common
 * "sum number cards, optionally multiply, add modifiers, optionally add a
 * threshold bonus" shape (matches Flip Seven and similar card-tally games).
 * `scoreFormula`'s own result via `evaluateRuleExpr` always stays the
 * authoritative score - this is purely a readable explanation of it, most
 * useful for clarifying when a multiplier card is actually being applied.
 */
function buildCalculationSteps(
	selectedItems: CardItem[],
	bonusAtNumberCount: number | undefined,
	bonusPoints: number | undefined,
): string[] {
	if (selectedItems.length === 0) return [];
	const numberItems = selectedItems.filter((item) => item.category === 'number');
	const modifierItems = selectedItems.filter((item) => item.category === 'modifier');
	const multiplierItem = selectedItems.find((item) => item.category === 'multiplier');

	const numberSum = numberItems.reduce((sum, item) => sum + (item.value ?? 0), 0);
	const steps: string[] = [];
	let running = numberSum;
	steps.push(numberItems.length > 0 ? `Zahlenkarten: ${numberItems.map((item) => item.label).join(' + ')} = ${numberSum}` : 'Zahlenkarten: 0');

	if (multiplierItem) {
		const multiplierValue = multiplierItem.value ?? 1;
		running *= multiplierValue;
		steps.push(`× ${multiplierValue} (${multiplierItem.label}) = ${running}`);
	}

	if (modifierItems.length > 0) {
		const modifierSum = modifierItems.reduce((sum, item) => sum + (item.value ?? 0), 0);
		running += modifierSum;
		// Modifier labels already carry their own sign (e.g. "+4"), so joining
		// them directly reads naturally without a redundant leading "+".
		steps.push(`Bonuskarten: ${modifierItems.map((item) => item.label).join(' ')} = ${running}`);
	}

	if (bonusAtNumberCount && bonusPoints && numberItems.length >= bonusAtNumberCount) {
		running += bonusPoints;
		steps.push(`+ ${bonusPoints} (${bonusAtNumberCount}er-Bonus) = ${running}`);
	}

	return steps;
}

/**
 * Generic card-picker score entry: tap the cards a player ended their round
 * with. A plain multi-select toggle - tapping an already-selected card
 * (e.g. a mis-tapped duplicate number) simply deselects it again, nothing is
 * ever locked or auto-removed. Driven entirely by the game type's
 * `GameRules` (see helpers/GameRules.ts).
 */
export default function CardScoreEntryModal({
	items,
	scoreFormula,
	bonusAtNumberCount,
	bonusPoints,
	initialSelection,
	initialScore,
	onSave,
}: Readonly<{
	items: CardItem[];
	scoreFormula: RuleExpr;
	bonusAtNumberCount?: number;
	bonusPoints?: number;
	initialSelection: string[];
	/** The round's already-stored score, if any - re-shown as a manual override when it doesn't match the card calculation. */
	initialScore?: number | null;
	onSave: (cardIds: string[], score: number) => void;
}>) {
	const { theme } = useTheme();
	const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
	const [selectedIds, setSelectedIds] = useState<string[]>(() => initialSelection.filter((id) => itemsById.has(id)));
	// The computed score can be overridden by typing into the score field
	// (null = follow the card calculation). Tapping any card hands control
	// back to the calculation. A stored score that deviates from what the
	// stored cards compute to was overridden earlier - start in that state.
	const [manualScoreText, setManualScoreText] = useState<string | null>(() => {
		if (initialScore == null) return null;
		const initialItems = initialSelection
			.map((id) => items.find((item) => item.id === id))
			.filter((item): item is CardItem => !!item);
		const computed = evaluateRuleExpr(scoreFormula, { selectedItems: initialItems });
		return initialScore === computed ? null : String(initialScore);
	});

	const grouped = useMemo(() => {
		const byCategory = new Map<CardCategory, CardItem[]>();
		for (const item of items) {
			const list = byCategory.get(item.category) ?? [];
			list.push(item);
			byCategory.set(item.category, list);
		}
		return CATEGORY_ORDER.map((category) => ({ category, items: byCategory.get(category) ?? [] })).filter(
			(group) => group.items.length > 0,
		);
	}, [items]);

	const selectedItems = useMemo(() => selectedIds.map((id) => itemsById.get(id)).filter((item): item is CardItem => !!item), [
		selectedIds,
		itemsById,
	]);

	const previewScore = evaluateRuleExpr(scoreFormula, { selectedItems });

	const bonusActive = useMemo(() => {
		if (!bonusAtNumberCount) return false;
		return selectedItems.filter((item) => item.category === 'number').length >= bonusAtNumberCount;
	}, [selectedItems, bonusAtNumberCount]);

	const calculationSteps = useMemo(
		() => buildCalculationSteps(selectedItems, bonusAtNumberCount, bonusPoints),
		[selectedItems, bonusAtNumberCount, bonusPoints],
	);

	// Manually typed score, or null while empty/invalid (then the calculation stays authoritative).
	const manualScore = useMemo(() => {
		if (manualScoreText == null) return null;
		const trimmed = manualScoreText.trim();
		if (trimmed === '' || trimmed === '-') return null;
		const parsed = Number.parseInt(trimmed, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}, [manualScoreText]);

	const effectiveScore = manualScore ?? previewScore;

	const handleTapCard = useCallback((item: CardItem) => {
		setManualScoreText(null);
		setSelectedIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
	}, []);

	const handleSave = useCallback(() => {
		onSave(selectedIds, effectiveScore);
	}, [onSave, selectedIds, effectiveScore]);

	return (
		<View style={styles.container}>
			<View style={styles.scoreRow}>
				<Text style={[styles.scoreLabel, { color: theme.screen.placeholder }]}>Rundenpunktzahl</Text>
				{/* Editable (but never auto-focused): typing here overrides the card
				    calculation, tapping a card below switches back to it. */}
				<ResolvedManualScoreInput
					nativeID={ComponentIds.GAME_CARD_SCORE_MANUAL_INPUT}
					style={[
						styles.scoreInput,
						{ color: theme.screen.text, borderColor: manualScoreText != null ? PRIMARY_COLOR : theme.screen.border },
					]}
					value={manualScoreText ?? String(previewScore)}
					onChangeText={(text: string) => setManualScoreText(text.replace(/[^0-9-]/g, ''))}
					keyboardType="number-pad"
					returnKeyType="done"
					textAlign="center"
					selectTextOnFocus
				/>
				{manualScoreText != null && (
					<Text style={[styles.manualHint, { color: theme.screen.placeholder }]}>
						Manuell eingetragen - Tippen auf eine Karte rechnet wieder automatisch
					</Text>
				)}
			</View>

			{grouped.map(({ category, items: groupItems }) => (
				<View key={category} style={styles.group}>
					<Text style={[styles.groupTitle, { color: theme.screen.placeholder }]}>{CATEGORY_TITLES[category]}</Text>
					<View style={styles.cardRow}>
						{groupItems.map((item) => {
							const selected = selectedIds.includes(item.id);
							return (
								<TouchableOpacity
									key={item.id}
									id={`${ComponentIds.GAME_CARD_SCORE_CARD_PREFIX}${item.id}`}
									style={[
										styles.card,
										{ borderColor: PRIMARY_COLOR, backgroundColor: selected ? PRIMARY_COLOR : 'transparent' },
									]}
									onPress={() => handleTapCard(item)}
									activeOpacity={0.7}
								>
									<Text style={[styles.cardText, { color: selected ? '#ffffff' : PRIMARY_COLOR }]}>{item.label}</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			))}

			{!!bonusAtNumberCount && (
				<View
					nativeID={ComponentIds.GAME_CARD_SCORE_BONUS_BADGE}
					style={[
						styles.bonusBadge,
						{ borderColor: SUCCESS_COLOR, backgroundColor: bonusActive ? SUCCESS_COLOR : 'transparent' },
					]}
				>
					<Ionicons name="trophy-outline" size={18} color={bonusActive ? '#ffffff' : SUCCESS_COLOR} />
					<Text style={[styles.bonusBadgeText, { color: bonusActive ? '#ffffff' : SUCCESS_COLOR }]}>
						{bonusPoints ? `+${bonusPoints}` : ''} Bonus ab {bonusAtNumberCount} Zahlenkarten
					</Text>
				</View>
			)}

			<TouchableOpacity
				id={ComponentIds.GAME_CARD_SCORE_SAVE_BUTTON}
				style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleSave}
				activeOpacity={0.8}
			>
				<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
				<Text style={styles.saveButtonText}>Fertig - {effectiveScore} Punkte speichern</Text>
			</TouchableOpacity>

			{calculationSteps.length > 0 && (
				<View style={[styles.calculationBox, { borderColor: theme.screen.border }]}>
					<Text style={[styles.calculationTitle, { color: theme.screen.placeholder }]}>Rechnung</Text>
					{calculationSteps.map((step, index) => (
						// eslint-disable-next-line react/no-array-index-key
						<Text key={index} style={[styles.calculationStep, { color: theme.screen.text }]}>
							{step}
						</Text>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
	},
	scoreRow: {
		alignItems: 'center',
		marginBottom: 12,
	},
	scoreLabel: {
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	scoreInput: {
		fontSize: 40,
		fontWeight: '700',
		minWidth: 110,
		paddingVertical: 2,
		paddingHorizontal: 16,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		borderRadius: 12,
	},
	manualHint: {
		fontSize: 11,
		marginTop: 4,
		textAlign: 'center',
	},
	group: {
		marginBottom: 14,
	},
	groupTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 6,
	},
	cardRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	card: {
		minWidth: 52,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 1.5,
		borderRadius: 10,
		alignItems: 'center',
	},
	cardText: {
		fontSize: 14,
		fontWeight: '700',
	},
	bonusBadge: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		height: 48,
		borderWidth: 1.5,
		borderRadius: 12,
		marginTop: 8,
	},
	bonusBadgeText: {
		fontSize: 14,
		fontWeight: '600',
	},
	saveButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		height: 52,
		borderRadius: 12,
		marginTop: 12,
	},
	saveButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	calculationBox: {
		marginTop: 16,
		padding: 12,
		borderWidth: 1,
		borderRadius: 10,
		gap: 4,
	},
	calculationTitle: {
		fontSize: 11,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 2,
	},
	calculationStep: {
		fontSize: 13,
		fontVariant: ['tabular-nums'],
	},
});
