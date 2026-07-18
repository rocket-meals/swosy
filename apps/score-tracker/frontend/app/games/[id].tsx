import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListTextInput,
	SettingsListNumberInput,
	SettingsListSelectOptionSingle,
	MyAvatar,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
	renameGameType,
	setGameTypeIcon,
	setGameTypeScoringMode,
	setGameTypeMaxRounds,
	setGameTypeMaxScore,
	removeGameType,
} from '../../store/gameTypesSlice';
import { resetScores, setGameType } from '../../store/gameSlice';
import { archiveGame } from '../../store/gameHistorySlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { GameHistoryEntry, GameHistoryPlayerEntry } from '../../helpers/GameHistoryStorage';
import { GAME_TYPE_ICONS } from '../../helpers/GameTypesStorage';
import type { ScoringMode } from '../../helpers/GameTypesStorage';
import { ComponentIds } from '../../constants/ComponentIds';
import GameTypeIcon from '../../components/GameTypeIcon';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const DEBUG_COLOR = '#7c3aed';

function generateHistoryId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Icon picker modal content ────────────────────────────────────────────────

function IconPickerContent({ selectedIcon, onSelect }: { selectedIcon: string; onSelect: (icon: string) => void }) {
	const { theme } = useTheme();
	return (
		<View style={styles.iconGrid}>
			{GAME_TYPE_ICONS.map((icon) => {
				const isSelected = icon === selectedIcon;
				return (
					<TouchableOpacity
						key={icon}
						style={[
							styles.iconGridItem,
							{ borderColor: isSelected ? PRIMARY_COLOR : theme.screen.border, backgroundColor: isSelected ? PRIMARY_COLOR + '20' : 'transparent' },
						]}
						onPress={() => onSelect(icon)}
						activeOpacity={0.7}
					>
						<Text style={styles.iconGridEmoji}>{icon}</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

// ─── Scoring mode modal content (live-updating, subscribes to the store) ─────

function ScoringModeSection({ gameTypeId }: { gameTypeId: string }) {
	const dispatch = useDispatch<AppDispatch>();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId));
	if (!gameType) return null;

	const options: { mode: ScoringMode; label: string; icon: React.ReactNode }[] = [
		{ mode: 'highWins', label: 'Viele Punkte gewinnen', icon: <Ionicons name="trending-up-outline" size={20} color="#ffffff" /> },
		{ mode: 'lowWins', label: 'Wenige Punkte gewinnen', icon: <Ionicons name="trending-down-outline" size={20} color="#ffffff" /> },
	];

	return (
		<View style={styles.modalContent}>
			{options.map((option, index) => (
				<SettingsListSelectOptionSingle
					key={option.mode}
					label={option.label}
					leftIcon={option.icon}
					iconBgColor={PRIMARY_COLOR}
					isSelected={gameType.scoringMode === option.mode}
					onPress={() => dispatch(setGameTypeScoringMode({ gameTypeId, scoringMode: option.mode }))}
					groupPosition={index === 0 ? 'top' : 'bottom'}
				/>
			))}
		</View>
	);
}

// ─── Match row (one archived game of this game type) ─────────────────────────

const MATCH_AVATAR_SIZE = 28;
const MAX_MATCH_AVATARS = 5;

function MatchParticipants({ players }: { players: GameHistoryPlayerEntry[] }) {
	const shown = players.slice(0, MAX_MATCH_AVATARS);
	const extra = players.length - shown.length;
	return (
		<View style={styles.matchAvatarsRow}>
			{shown.map((player, index) => (
				<View
					key={player.playerId}
					style={[
						styles.matchAvatarWrapper,
						{ marginLeft: index === 0 ? 0 : -MATCH_AVATAR_SIZE * 0.35, zIndex: shown.length - index },
					]}
				>
					<MyAvatar
						style={player.avatarConfig?.style}
						options={player.avatarConfig?.options}
						size={MATCH_AVATAR_SIZE}
						rounded
						backgroundColor={player.color || '#ffffff'}
					/>
				</View>
			))}
			{extra > 0 && <Text style={styles.matchAvatarsExtra}>+{extra}</Text>}
		</View>
	);
}

// ─── Game detail screen ───────────────────────────────────────────────────────

export default function GameTypeDetailScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const navigation = useNavigation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === id));
	const historyEntries = useSelector((state: RootState) => state.gameHistory.entries);
	const activeGame = useSelector((state: RootState) => state.game);
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	// Header: back arrow to the games list (drawer navigators have no reliable
	// push history, so navigate explicitly - same reasoning as the old friend
	// detail screen).
	useLayoutEffect(() => {
		navigation.setOptions({
			title: gameType ? `${gameType.icon} ${gameType.name}` : 'Spiel',
			headerLeft: () => (
				<TouchableOpacity
					nativeID={ComponentIds.GAME_DETAIL_BACK_BUTTON}
					onPress={() => router.replace('/games')}
					style={styles.headerBackButton}
				>
					<Ionicons name="arrow-back" size={24} color={theme.header.text} />
				</TouchableOpacity>
			),
		});
	}, [navigation, theme.header.text, gameType]);

	const matches = useMemo(() => {
		if (!gameType) return [];
		return historyEntries
			.filter((entry) => entry.gameTypeId === gameType.id)
			.map((entry) => {
				const ranked = [...entry.players].sort((a, b) => {
					const scoreA = entry.finalScores[a.playerId] ?? 0;
					const scoreB = entry.finalScores[b.playerId] ?? 0;
					return gameType.scoringMode === 'lowWins' ? scoreA - scoreB : scoreB - scoreA;
				});
				const winner = ranked[0];
				return {
					id: entry.id,
					endedAt: entry.endedAt,
					roundsCount: entry.roundsCount,
					players: entry.players,
					winnerName: winner ? winner.name : undefined,
					winnerScore: winner ? entry.finalScores[winner.playerId] ?? 0 : 0,
				};
			})
			.sort((a, b) => b.endedAt - a.endedAt);
	}, [historyEntries, gameType]);

	const handleOpenIconModal = useCallback(() => {
		if (!gameType) return;
		showModal({
			title: 'Bild wählen',
			children: (
				<IconPickerContent
					selectedIcon={gameType.icon}
					onSelect={(icon) => {
						dispatch(setGameTypeIcon({ gameTypeId: gameType.id, icon }));
						closeModal();
					}}
				/>
			),
		});
	}, [showModal, closeModal, gameType, dispatch]);

	const handleOpenScoringModal = useCallback(() => {
		if (!gameType) return;
		showModal({
			title: 'Wertung',
			children: <ScoringModeSection gameTypeId={gameType.id} />,
		});
	}, [showModal, gameType]);

	const handleDelete = useCallback(() => {
		if (!gameType) return;
		dispatch(removeGameType(gameType.id));
		router.replace('/games');
	}, [gameType, dispatch]);

	// Start a new match of this game: archive a still-running match first (it
	// keeps its own game type), then reuse the current player list in the setup
	// phase with this game type preselected.
	const handleStartMatch = useCallback(() => {
		if (!gameType) return;
		if (activeGame.status === 'active' && activeGame.players.length > 0) {
			const totals: Record<string, number> = {};
			for (const player of activeGame.players) {
				let total = 0;
				for (const round of activeGame.rounds) {
					const score = round.scores[player.id];
					if (score != null) total += score;
				}
				totals[player.id] = total;
			}
			const entry: GameHistoryEntry = {
				id: generateHistoryId(),
				endedAt: Date.now(),
				roundsCount: activeGame.rounds.length,
				players: activeGame.players.map((p) => ({
					playerId: p.id,
					friendId: p.friendId,
					name: p.name,
					color: p.color,
					avatarConfig: p.avatarConfig,
				})),
				finalScores: totals,
				gameTypeId: activeGame.gameTypeId,
			};
			dispatch(archiveGame(entry));
		}
		dispatch(resetScores());
		dispatch(setGameType(gameType.id));
		router.push('/');
	}, [gameType, activeGame, dispatch]);

	const handleCopyId = useCallback(async () => {
		if (!gameType) return;
		await Clipboard.setStringAsync(gameType.id);
	}, [gameType]);

	if (!gameType) {
		return (
			<View style={[styles.emptyContainer, { backgroundColor: theme.screen.background }]}>
				<Text style={{ color: theme.screen.text }}>Spiel nicht gefunden.</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				contentContainerStyle={[
					styles.listContent,
					{ paddingBottom: insets.bottom + 32, paddingLeft: insets.left, paddingRight: insets.right },
				]}
			>
				<SettingsList
					label="Bild"
					leftIconComponent={
						<View style={styles.gameIconWrapper}>
							<GameTypeIcon icon={gameType.icon} size={48} />
						</View>
					}
					rightIcon={<MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />}
					handleFunction={handleOpenIconModal}
					groupPosition="top"
				/>
				<SettingsListTextInput
					label="Name"
					placeholder="Name eingeben"
					initialValue={gameType.name}
					value={gameType.name}
					onSave={(name) => {
						dispatch(renameGameType({ gameTypeId: gameType.id, name }));
					}}
					groupPosition="middle"
				/>
				<SettingsList
					label="Wertung"
					value={gameType.scoringMode === 'lowWins' ? 'Wenige Punkte gewinnen' : 'Viele Punkte gewinnen'}
					leftIcon={
						<Ionicons
							name={gameType.scoringMode === 'lowWins' ? 'trending-down-outline' : 'trending-up-outline'}
							size={20}
							color="#ffffff"
						/>
					}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenScoringModal}
					groupPosition="middle"
				/>
				<SettingsListNumberInput
					label="Max. Runden pro Partie"
					value={gameType.maxRounds ? String(gameType.maxRounds) : 'Unbegrenzt'}
					leftIcon={<Ionicons name="repeat-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					modalTitle="Max. Runden pro Partie"
					placeholder="z.B. 10"
					initialValue={gameType.maxRounds ?? undefined}
					min={1}
					max={99}
					onSave={(value) => {
						dispatch(setGameTypeMaxRounds({ gameTypeId: gameType.id, maxRounds: value }));
					}}
					allowDisable
					disableLabel="Unbegrenzt"
					onDisable={() => {
						dispatch(setGameTypeMaxRounds({ gameTypeId: gameType.id, maxRounds: null }));
					}}
					groupPosition="middle"
				/>
				<SettingsListNumberInput
					label="Maximale Punktzahl"
					value={gameType.maxScore ? String(gameType.maxScore) : 'Unbegrenzt'}
					leftIcon={<Ionicons name="flag-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					modalTitle="Maximale Punktzahl"
					placeholder="z.B. 100"
					initialValue={gameType.maxScore ?? undefined}
					min={1}
					max={999999}
					onSave={(value) => {
						dispatch(setGameTypeMaxScore({ gameTypeId: gameType.id, maxScore: value }));
					}}
					allowDisable
					disableLabel="Unbegrenzt"
					onDisable={() => {
						dispatch(setGameTypeMaxScore({ gameTypeId: gameType.id, maxScore: null }));
					}}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.GAME_DETAIL_DELETE_BUTTON}
					label="Spiel löschen"
					leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
					iconBgColor={DANGER_COLOR}
					handleFunction={handleDelete}
					groupPosition="bottom"
				/>

				{debugMode && (
					<>
						<SettingsListGroupTitle title="Debug" />
						<SettingsList
							nativeID={ComponentIds.GAME_DETAIL_ID_ROW}
							label="ID"
							value={gameType.id}
							leftIcon={<MaterialCommunityIcons name="identifier" size={20} color="#ffffff" />}
							iconBgColor={DEBUG_COLOR}
							rightIcon={<MaterialCommunityIcons name="content-copy" size={18} color="#9ca3af" />}
							handleFunction={handleCopyId}
							groupPosition="single"
						/>
					</>
				)}

				<SettingsListGroupTitle title={`Partien (${matches.length})`} />
				<SettingsList
					nativeID={ComponentIds.GAME_DETAIL_START_MATCH_BUTTON}
					label="Neue Partie starten"
					leftIcon={<Ionicons name="play-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleStartMatch}
					groupPosition="single"
				/>
				{matches.length === 0 ? (
					<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
						Noch keine Partien gespielt.
					</Text>
				) : (
					matches.map((match, index) => (
						<SettingsList
							key={match.id}
							nativeID={`${ComponentIds.GAME_DETAIL_MATCH_ROW_PREFIX}${match.id}`}
							label={formatDate(match.endedAt)}
							value={
								match.winnerName
									? `🏆 ${match.winnerName} (${match.winnerScore} Punkte) · ${match.roundsCount} Runden`
									: `${match.roundsCount} Runden`
							}
							stackedValue
							leftIcon={<Ionicons name="calendar-outline" size={20} color="#ffffff" />}
							iconBgColor={PRIMARY_COLOR}
							rightElement={<MatchParticipants players={match.players} />}
							groupPosition={index === 0 ? 'top' : index === matches.length - 1 ? 'bottom' : 'middle'}
						/>
					))
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerBackButton: {
		padding: 4,
		marginLeft: 8,
		marginRight: 8,
	},
	listContent: {
		padding: 12,
	},
	gameIconWrapper: {
		marginRight: 12,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyHint: {
		fontSize: 13,
		textAlign: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	modalContent: {
		padding: 10,
	},
	iconGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		padding: 10,
		justifyContent: 'center',
	},
	iconGridItem: {
		width: 56,
		height: 56,
		borderRadius: 12,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconGridEmoji: {
		fontSize: 28,
	},
	matchAvatarsRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	matchAvatarWrapper: {
		borderRadius: MATCH_AVATAR_SIZE / 2,
	},
	matchAvatarsExtra: {
		marginLeft: 4,
		fontSize: 12,
		fontWeight: '600',
		color: '#9ca3af',
	},
});
