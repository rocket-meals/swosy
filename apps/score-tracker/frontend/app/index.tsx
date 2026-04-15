import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListTextInput,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';
import {
	addPlayer,
	renamePlayer,
	removePlayer,
	setScore,
	addRound,
	resetScores,
	resetAll,
} from '../store/gameSlice';
import type { AppDispatch, RootState } from '../store/store';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const CELL_MIN_WIDTH = 80;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 44;

// ─── Score Cell ───────────────────────────────────────────────────────────────

function ScoreCell({
	value,
	onPress,
	isTotal,
}: {
	value: number | null;
	onPress?: () => void;
	isTotal?: boolean;
}) {
	const { theme } = useTheme();
	return (
		<TouchableOpacity
			style={[
				styles.cell,
				{
					backgroundColor: isTotal ? theme.header.background : theme.screen.background,
					borderColor: theme.screen.border,
				},
			]}
			onPress={onPress}
			disabled={!onPress}
			activeOpacity={onPress ? 0.6 : 1}
		>
			<Text
				style={[
					styles.cellText,
					{
						color: theme.screen.text,
						fontWeight: isTotal ? '700' : '400',
					},
				]}
			>
				{value != null ? String(value) : '–'}
			</Text>
		</TouchableOpacity>
	);
}

// ─── Score Input Modal Content ────────────────────────────────────────────────

function ScoreInputContent({
	initialValue,
	signMode,
	onSave,
}: {
	initialValue: number | null;
	signMode: 'plus' | 'minus';
	onSave: (value: number | null) => void;
}) {
	const { theme } = useTheme();
	const [text, setText] = useState(initialValue != null ? String(Math.abs(initialValue)) : '');

	const handleSave = useCallback(() => {
		if (text.trim() === '') {
			onSave(null);
			return;
		}
		const num = parseInt(text, 10);
		if (isNaN(num)) {
			onSave(null);
			return;
		}
		onSave(signMode === 'minus' ? -Math.abs(num) : Math.abs(num));
	}, [text, signMode, onSave]);

	return (
		<View style={styles.scoreInputContainer}>
			<View style={[styles.scoreInputField, { backgroundColor: theme.screen.background, borderColor: theme.screen.border }]}>
				<Text style={[styles.scoreInputSign, { color: signMode === 'minus' ? DANGER_COLOR : PRIMARY_COLOR }]}>
					{signMode === 'minus' ? '−' : '+'}
				</Text>
				<View style={styles.scoreInputTextWrapper}>
					<ScoreTextInput value={text} onChangeText={setText} onSubmit={handleSave} />
				</View>
			</View>
			<TouchableOpacity
				style={[styles.scoreInputSaveButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleSave}
				activeOpacity={0.8}
			>
				<Text style={styles.scoreInputSaveText}>Save</Text>
			</TouchableOpacity>
		</View>
	);
}

function ScoreTextInput({
	value,
	onChangeText,
	onSubmit,
}: {
	value: string;
	onChangeText: (v: string) => void;
	onSubmit: () => void;
}) {
	const { theme } = useTheme();
	// Use a regular TextInput import from react-native for this modal content.
	// The BottomSheetTextInput is only needed inside bottom sheets.
	const RNTextInput = require('react-native').TextInput;
	return (
		<RNTextInput
			style={[styles.scoreInputNative, { color: theme.screen.text }]}
			value={value}
			onChangeText={onChangeText}
			keyboardType="phone-pad"
			autoFocus
			placeholder="0"
			placeholderTextColor={theme.screen.border}
			returnKeyType="done"
			onSubmitEditing={onSubmit}
		/>
	);
}

// ─── Game Screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const players = useSelector((state: RootState) => state.game.players);
	const rounds = useSelector((state: RootState) => state.game.rounds);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { show: showDeleteModal, close: closeDeleteModal } = useMyScrollViewModal();
	const { show: showScoreModal, close: closeScoreModal } = useMyScrollViewModal();
	const [signMode, setSignMode] = useState<'plus' | 'minus'>('plus');

	const navigation = useNavigation();

	// Compute totals per player
	const totals = useMemo(() => {
		const result: Record<string, number> = {};
		for (const player of players) {
			let total = 0;
			for (const round of rounds) {
				const score = round.scores[player.id];
				if (score != null) total += score;
			}
			result[player.id] = total;
		}
		return result;
	}, [players, rounds]);

	// Rounds reversed (newest first)
	const reversedRounds = useMemo(() => [...rounds].reverse(), [rounds]);

	// ─── Header buttons ───────────────────────────────────────────────────────

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={styles.headerButtons}>
					<TouchableOpacity onPress={handleOpenDeleteModal} style={styles.headerButton}>
						<Ionicons name="trash-outline" size={22} color={theme.header.text} />
					</TouchableOpacity>
					<TouchableOpacity onPress={handleAddPlayer} style={styles.headerButton}>
						<Ionicons name="person-add-outline" size={22} color={theme.header.text} />
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, theme.header.text]);

	// ─── Handlers ─────────────────────────────────────────────────────────────

	const handleAddPlayer = useCallback(() => {
		dispatch(addPlayer());
	}, [dispatch]);

	const handleOpenPlayerModal = useCallback(
		(playerId: string, playerName: string) => {
			showModal({
				title: playerName,
				children: (
					<View style={styles.modalContent}>
						<SettingsListTextInput
							label="Name ändern"
							placeholder="Name eingeben"
							initialValue={playerName}
							onSave={(newName) => {
								dispatch(renamePlayer({ playerId, name: newName }));
								closeModal();
							}}
							groupPosition="top"
						/>
						<SettingsList
							label="Spieler löschen"
							leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
							iconBgColor={DANGER_COLOR}
							handleFunction={() => {
								dispatch(removePlayer(playerId));
								closeModal();
							}}
							groupPosition="bottom"
						/>
					</View>
				),
			});
		},
		[showModal, closeModal, dispatch],
	);

	const handleOpenDeleteModal = useCallback(() => {
		showDeleteModal({
			title: '🗑️ Daten verwalten',
			children: (
				<View style={styles.modalContent}>
					<SettingsList
						label="Alle Punkte zurücksetzen"
						leftIcon={<Ionicons name="refresh-outline" size={20} color="#ffffff" />}
						iconBgColor="#f59e0b"
						handleFunction={() => {
							dispatch(resetScores());
							closeDeleteModal();
						}}
						groupPosition="top"
					/>
					<SettingsList
						label="Alle Spieler & Punkte löschen"
						leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
						iconBgColor={DANGER_COLOR}
						handleFunction={() => {
							dispatch(resetAll());
							closeDeleteModal();
						}}
						groupPosition="bottom"
					/>
				</View>
			),
		});
	}, [showDeleteModal, closeDeleteModal, dispatch]);

	const handleOpenScoreInput = useCallback(
		(roundId: string, playerId: string, currentScore: number | null) => {
			showScoreModal({
				title: 'Punkte eingeben',
				children: (
					<ScoreInputContent
						initialValue={currentScore}
						signMode={signMode}
						onSave={(value) => {
							dispatch(setScore({ roundId, playerId, score: value }));
							closeScoreModal();
						}}
					/>
				),
			});
		},
		[showScoreModal, closeScoreModal, dispatch, signMode],
	);

	const handleAddRound = useCallback(() => {
		dispatch(addRound());
	}, [dispatch]);

	// ─── Empty state ──────────────────────────────────────────────────────────

	if (players.length === 0) {
		return (
			<View style={[styles.emptyContainer, { backgroundColor: theme.screen.background }]}>
				<Ionicons name="people-outline" size={64} color={theme.screen.border} />
				<Text style={[styles.emptyText, { color: theme.screen.text }]}>
					Noch keine Spieler
				</Text>
				<Text style={[styles.emptySubtext, { color: theme.screen.border }]}>
					Füge einen Spieler über den + Button im Header hinzu
				</Text>
			</View>
		);
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	const labelWidth = 80;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			{/* Horizontally scrollable table */}
			<View style={styles.tableWrapper}>
				{/* Row label column (fixed) */}
				<View style={styles.labelColumn}>
					<View style={[styles.labelCell, styles.headerLabelCell, { borderColor: theme.screen.border }]}>
						<Text style={[styles.labelText, { color: theme.screen.text }]}> </Text>
					</View>
					<View style={[styles.labelCell, { borderColor: theme.screen.border, backgroundColor: theme.header.background }]}>
						<Text style={[styles.labelText, { color: theme.screen.text, fontWeight: '700' }]}>Gesamt</Text>
					</View>
					{reversedRounds.map((round, index) => (
						<View key={round.id} style={[styles.labelCell, { borderColor: theme.screen.border }]}>
							<Text style={[styles.labelText, { color: theme.screen.text }]}>
								R{rounds.length - index}
							</Text>
						</View>
					))}
				</View>

				{/* Scrollable data columns */}
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dataScrollH}>
					<View>
						{/* Player name header row */}
						<View style={styles.dataRow}>
							{players.map((player) => (
								<TouchableOpacity
									key={player.id}
									style={[styles.cell, styles.headerCell, { borderColor: theme.screen.border, backgroundColor: theme.header.background }]}
									onPress={() => handleOpenPlayerModal(player.id, player.name)}
									activeOpacity={0.7}
								>
									<Text style={[styles.cellText, { color: theme.header.text, fontWeight: '600' }]} numberOfLines={1}>
										{player.name}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Totals row */}
						<View style={styles.dataRow}>
							{players.map((player) => (
								<ScoreCell key={player.id} value={totals[player.id] ?? 0} isTotal />
							))}
						</View>

						{/* Round rows in a vertical scroll */}
						<ScrollView style={styles.roundsScroll} showsVerticalScrollIndicator>
							{reversedRounds.map((round) => (
								<View key={round.id} style={styles.dataRow}>
									{players.map((player) => (
										<ScoreCell
											key={`${round.id}-${player.id}`}
											value={round.scores[player.id] ?? null}
											onPress={() =>
												handleOpenScoreInput(round.id, player.id, round.scores[player.id] ?? null)
											}
										/>
									))}
								</View>
							))}
						</ScrollView>
					</View>
				</ScrollView>
			</View>

			{/* Bottom bar: +/- toggle and "Nächste Runde" button */}
			<View style={[styles.bottomBar, { borderTopColor: theme.screen.border }]}>
				<View style={styles.signToggle}>
					<TouchableOpacity
						style={[
							styles.signButton,
							{
								backgroundColor: signMode === 'plus' ? PRIMARY_COLOR : theme.screen.background,
								borderColor: PRIMARY_COLOR,
							},
						]}
						onPress={() => setSignMode('plus')}
						activeOpacity={0.7}
					>
						<Text style={[styles.signButtonText, { color: signMode === 'plus' ? '#ffffff' : PRIMARY_COLOR }]}>+</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.signButton,
							{
								backgroundColor: signMode === 'minus' ? DANGER_COLOR : theme.screen.background,
								borderColor: DANGER_COLOR,
							},
						]}
						onPress={() => setSignMode('minus')}
						activeOpacity={0.7}
					>
						<Text style={[styles.signButtonText, { color: signMode === 'minus' ? '#ffffff' : DANGER_COLOR }]}>−</Text>
					</TouchableOpacity>
				</View>
				<TouchableOpacity
					style={[styles.nextRoundButton, { backgroundColor: PRIMARY_COLOR }]}
					onPress={handleAddRound}
					activeOpacity={0.8}
				>
					<Text style={styles.nextRoundText}>Nächste Runde</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
	},
	headerButtons: {
		flexDirection: 'row',
		gap: 12,
		marginRight: 8,
	},
	headerButton: {
		padding: 4,
	},
	tableWrapper: {
		flex: 1,
		flexDirection: 'row',
	},
	labelColumn: {
		width: 80,
	},
	labelCell: {
		height: ROW_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 0.5,
	},
	headerLabelCell: {
		height: HEADER_HEIGHT,
	},
	labelText: {
		fontSize: 12,
		fontWeight: '500',
	},
	dataScrollH: {
		flex: 1,
	},
	dataRow: {
		flexDirection: 'row',
	},
	cell: {
		minWidth: CELL_MIN_WIDTH,
		height: ROW_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 0.5,
		paddingHorizontal: 8,
	},
	headerCell: {
		height: HEADER_HEIGHT,
	},
	cellText: {
		fontSize: 14,
	},
	roundsScroll: {
		flex: 1,
	},
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		gap: 12,
	},
	signToggle: {
		flexDirection: 'row',
		gap: 4,
	},
	signButton: {
		width: 44,
		height: 44,
		borderRadius: 8,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	signButtonText: {
		fontSize: 22,
		fontWeight: '700',
	},
	nextRoundButton: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	nextRoundText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	modalContent: {
		padding: 10,
	},
	scoreInputContainer: {
		padding: 16,
		gap: 12,
	},
	scoreInputField: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 8,
		height: 56,
		paddingHorizontal: 16,
	},
	scoreInputSign: {
		fontSize: 24,
		fontWeight: '700',
		marginRight: 8,
	},
	scoreInputTextWrapper: {
		flex: 1,
	},
	scoreInputNative: {
		fontSize: 18,
		height: 48,
	},
	scoreInputSaveButton: {
		height: 48,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scoreInputSaveText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});
