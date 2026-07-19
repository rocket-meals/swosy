import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';
import type { CardCategory, CardItem, RuleExpr } from '../helpers/GameRules';
import { evaluateRuleExpr } from '../helpers/GameRules';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const SUCCESS_COLOR = '#16a34a';

const CATEGORY_TITLES: Record<CardCategory, string> = {
	number: 'Zahlenkarten',
	modifier: 'Bonuskarten',
	multiplier: 'Multiplikator',
	action: 'Aktionskarten',
};

const CATEGORY_ORDER: CardCategory[] = ['number', 'modifier', 'multiplier', 'action'];

type Phase = 'active' | 'busted' | 'frozen';

/**
 * How many more cards must still be added before the player is allowed to
 * stop voluntarily (Flip Three forces three more reveals). Derived purely
 * from the ordered selection so undoing a pick (see `handleTapCard`) always
 * keeps this in sync without any separate bookkeeping.
 */
function computePendingForcedDraws(selectedIds: string[], itemsById: Map<string, CardItem>): number {
	let pending = 0;
	for (const id of selectedIds) {
		pending = Math.max(0, pending - 1);
		if (itemsById.get(id)?.effect === 'flipThree') pending += 3;
	}
	return pending;
}

/**
 * Generic card-picker score entry: tap the cards a player ended their turn
 * with. Driven entirely by the game type's `GameRules` (see
 * helpers/GameRules.ts) - the push-your-luck bust/freeze/flip-three/second-
 * chance behavior below only activates for card items tagged accordingly, so
 * this same component serves both a plain "pick your cards" game and a full
 * Flip Seven-style round.
 */
export default function CardScoreEntryModal({
	items,
	scoreFormula,
	enableBustOnDuplicateNumber,
	bonusAtNumberCount,
	initialSelection,
	onSave,
}: {
	items: CardItem[];
	scoreFormula: RuleExpr;
	enableBustOnDuplicateNumber?: boolean;
	bonusAtNumberCount?: number;
	initialSelection: string[];
	onSave: (cardIds: string[], score: number) => void;
}) {
	const { theme } = useTheme();
	const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
	const [selectedIds, setSelectedIds] = useState<string[]>(() => initialSelection.filter((id) => itemsById.has(id)));
	const [phase, setPhase] = useState<Phase>('active');
	const [lastEvent, setLastEvent] = useState<string | null>(null);
	const pendingForcedDraws = useMemo(() => computePendingForcedDraws(selectedIds, itemsById), [selectedIds, itemsById]);

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

	const previewScore = phase === 'busted' ? 0 : evaluateRuleExpr(scoreFormula, { selectedItems });

	const handleTapCard = useCallback(
		(item: CardItem) => {
			if (phase !== 'active') return;
			const alreadySelected = selectedIds.includes(item.id);
			const isLastPick = selectedIds.length > 0 && selectedIds[selectedIds.length - 1] === item.id;

			if (alreadySelected) {
				if (isLastPick) {
					// Tapping the card you just picked again undoes that one pick -
					// corrects a mis-tap (including an accidental bonus-triggering
					// card) instead of it being treated as a duplicate draw.
					setSelectedIds((prev) => prev.slice(0, -1));
					setLastEvent(null);
					return;
				}
				if (item.category === 'number' && enableBustOnDuplicateNumber) {
					const secondChance = items.find((i) => i.effect === 'secondChance');
					if (secondChance && selectedIds.includes(secondChance.id)) {
						setSelectedIds((prev) => prev.filter((id) => id !== secondChance.id));
						setLastEvent(`Second Chance eingesetzt - doppelte ${item.label} verworfen.`);
					} else {
						setPhase('busted');
						setLastEvent(`Bust! Doppelte ${item.label} - 0 Punkte für diese Runde.`);
					}
					return;
				}
				// Plain multi-select games (no bust rule): tapping again deselects.
				setSelectedIds((prev) => prev.filter((id) => id !== item.id));
				return;
			}

			const next = [...selectedIds, item.id];
			setSelectedIds(next);
			setLastEvent(null);

			if (item.effect === 'freeze') {
				setPhase('frozen');
				setLastEvent('Freeze - Runde für diesen Spieler beendet.');
				return;
			}

			if (enableBustOnDuplicateNumber && bonusAtNumberCount) {
				const numberCount = next.filter((id) => itemsById.get(id)?.category === 'number').length;
				if (numberCount >= bonusAtNumberCount) {
					setLastEvent(
						`🎉 ${bonusAtNumberCount} einzigartige Zahlenkarten - Bonus! Nochmal antippen macht die letzte Karte rückgängig, „Fertig“ speichert.`,
					);
				}
			}
		},
		[phase, selectedIds, items, itemsById, enableBustOnDuplicateNumber, bonusAtNumberCount],
	);

	const canSave = pendingForcedDraws === 0;

	const handleSave = useCallback(() => {
		if (!canSave) return;
		onSave(selectedIds, previewScore);
	}, [canSave, onSave, selectedIds, previewScore]);

	const statusColor = phase === 'busted' ? DANGER_COLOR : phase === 'frozen' ? SUCCESS_COLOR : theme.screen.text;

	return (
		<View style={styles.container}>
			<View style={styles.scoreRow}>
				<Text style={[styles.scoreLabel, { color: theme.screen.placeholder }]}>Rundenpunktzahl</Text>
				<Text style={[styles.scoreValue, { color: statusColor }]}>{previewScore}</Text>
			</View>

			{(lastEvent || phase !== 'active' || pendingForcedDraws > 0) && (
				<View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
					<Text style={[styles.statusBannerText, { color: statusColor }]}>
						{lastEvent ?? (pendingForcedDraws > 0 ? `Flip Three - noch ${pendingForcedDraws} Pflicht-Karten` : '')}
					</Text>
				</View>
			)}

			{grouped.map(({ category, items: groupItems }) => (
				<View key={category} style={styles.group}>
					<Text style={[styles.groupTitle, { color: theme.screen.placeholder }]}>{CATEGORY_TITLES[category]}</Text>
					<View style={styles.cardRow}>
						{groupItems.map((item) => {
							const selected = selectedIds.includes(item.id);
							const locked = phase !== 'active';
							return (
								<TouchableOpacity
									key={item.id}
									nativeID={`${ComponentIds.GAME_CARD_SCORE_CARD_PREFIX}${item.id}`}
									style={[
										styles.card,
										{
											borderColor: PRIMARY_COLOR,
											backgroundColor: selected ? PRIMARY_COLOR : 'transparent',
											opacity: locked && !selected ? 0.4 : 1,
										},
									]}
									onPress={() => handleTapCard(item)}
									disabled={locked}
									activeOpacity={0.7}
								>
									<Text style={[styles.cardText, { color: selected ? '#ffffff' : PRIMARY_COLOR }]}>{item.label}</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			))}

			<TouchableOpacity
				nativeID={ComponentIds.GAME_CARD_SCORE_SAVE_BUTTON}
				style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR, opacity: canSave ? 1 : 0.5 }]}
				onPress={handleSave}
				disabled={!canSave}
				activeOpacity={0.8}
			>
				{phase === 'busted' ? (
					<MaterialCommunityIcons name="skull-outline" size={20} color="#ffffff" />
				) : (
					<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
				)}
				<Text style={styles.saveButtonText}>Fertig - {previewScore} Punkte speichern</Text>
			</TouchableOpacity>
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
	scoreValue: {
		fontSize: 40,
		fontWeight: '700',
	},
	statusBanner: {
		borderRadius: 10,
		paddingVertical: 8,
		paddingHorizontal: 12,
		marginBottom: 12,
	},
	statusBannerText: {
		fontSize: 13,
		fontWeight: '600',
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
	saveButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		height: 52,
		borderRadius: 12,
		marginTop: 8,
	},
	saveButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});
