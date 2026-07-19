import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';
import type { CardCategory, CardItem, RuleExpr } from '../helpers/GameRules';
import { evaluateRuleExpr } from '../helpers/GameRules';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';

const CATEGORY_TITLES: Record<CardCategory, string> = {
	number: 'Zahlenkarten',
	modifier: 'Bonuskarten',
	multiplier: 'Multiplikator',
	action: 'Aktionskarten',
};

const CATEGORY_ORDER: CardCategory[] = ['number', 'modifier', 'multiplier', 'action'];

/**
 * Generic card-picker score entry: tap the cards a player ended their round
 * with (a plain multi-select toggle, nothing is ever locked or auto-removed)
 * and, for games with a bust concept, explicitly mark the round as busted
 * with a dedicated toggle. Driven entirely by the game type's `GameRules`
 * (see helpers/GameRules.ts).
 */
export default function CardScoreEntryModal({
	items,
	scoreFormula,
	bustLabel,
	bonusAtNumberCount,
	initialSelection,
	onSave,
}: {
	items: CardItem[];
	scoreFormula: RuleExpr;
	bustLabel?: string;
	bonusAtNumberCount?: number;
	initialSelection: string[];
	onSave: (cardIds: string[], score: number) => void;
}) {
	const { theme } = useTheme();
	const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
	const [selectedIds, setSelectedIds] = useState<string[]>(() => initialSelection.filter((id) => itemsById.has(id)));
	const [busted, setBusted] = useState(false);

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

	const previewScore = busted ? 0 : evaluateRuleExpr(scoreFormula, { selectedItems });

	const bonusReached = useMemo(() => {
		if (!bonusAtNumberCount) return false;
		return selectedItems.filter((item) => item.category === 'number').length >= bonusAtNumberCount;
	}, [selectedItems, bonusAtNumberCount]);

	const handleTapCard = useCallback((item: CardItem) => {
		setSelectedIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
	}, []);

	const handleToggleBust = useCallback(() => {
		setBusted((prev) => !prev);
	}, []);

	const handleSave = useCallback(() => {
		onSave(selectedIds, previewScore);
	}, [onSave, selectedIds, previewScore]);

	const statusColor = busted ? DANGER_COLOR : theme.screen.text;

	return (
		<View style={styles.container}>
			<View style={styles.scoreRow}>
				<Text style={[styles.scoreLabel, { color: theme.screen.placeholder }]}>Rundenpunktzahl</Text>
				<Text style={[styles.scoreValue, { color: statusColor }]}>{previewScore}</Text>
			</View>

			{(busted || bonusReached) && (
				<View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
					<Text style={[styles.statusBannerText, { color: statusColor }]}>
						{busted ? `${bustLabel} - aktiv` : `🎉 ${bonusAtNumberCount} einzigartige Zahlenkarten - Bonus!`}
					</Text>
				</View>
			)}

			{grouped.map(({ category, items: groupItems }) => (
				<View key={category} style={styles.group}>
					<Text style={[styles.groupTitle, { color: theme.screen.placeholder }]}>{CATEGORY_TITLES[category]}</Text>
					<View style={styles.cardRow}>
						{groupItems.map((item) => {
							const selected = selectedIds.includes(item.id);
							return (
								<TouchableOpacity
									key={item.id}
									nativeID={`${ComponentIds.GAME_CARD_SCORE_CARD_PREFIX}${item.id}`}
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

			{bustLabel && (
				<TouchableOpacity
					nativeID={ComponentIds.GAME_CARD_SCORE_BUST_TOGGLE}
					style={[styles.bustToggle, { borderColor: DANGER_COLOR, backgroundColor: busted ? DANGER_COLOR : 'transparent' }]}
					onPress={handleToggleBust}
					activeOpacity={0.7}
				>
					<MaterialCommunityIcons name="skull-outline" size={18} color={busted ? '#ffffff' : DANGER_COLOR} />
					<Text style={[styles.bustToggleText, { color: busted ? '#ffffff' : DANGER_COLOR }]}>{bustLabel}</Text>
				</TouchableOpacity>
			)}

			<TouchableOpacity
				nativeID={ComponentIds.GAME_CARD_SCORE_SAVE_BUTTON}
				style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleSave}
				activeOpacity={0.8}
			>
				<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
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
	bustToggle: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		height: 48,
		borderWidth: 1.5,
		borderRadius: 12,
		marginTop: 8,
	},
	bustToggleText: {
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
});
