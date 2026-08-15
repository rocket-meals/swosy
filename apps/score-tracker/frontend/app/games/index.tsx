import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { DateHelper } from 'repo-depkit-common';
import { useDispatch, useSelector } from 'react-redux';
import { router, useNavigation } from 'expo-router';
import { addGameType, addGameTypeFromPreset } from '../../store/gameTypesSlice';
import { setGamesSortMode, type GamesSortMode } from '../../store/appSettingsSlice';
import { resetScores, setGameType } from '../../store/gameSlice';
import { archiveGame } from '../../store/gameHistorySlice';
import type { AppDispatch, RootState } from '../../store/store';
import { FLIP_SEVEN_PRESET, MANSIONS_OF_MADNESS_PRESET } from '../../helpers/GameRules';
import { buildGamesShareBundle, encodeShareBundle } from '../../helpers/ShareCodec';
import { buildHistoryEntry, hasRecordedResults } from '../../helpers/GameHistoryStorage';
import { generateId } from '../../helpers/RandomHelper';
import { ComponentIds } from '../../constants/ComponentIds';
import GameTypeIcon from '../../components/GameTypeIcon';
import ShareImportContent from '../../components/ShareImportContent';
import ShareExportContent from '../../components/ShareExportContent';
import { countLabel } from '../../helpers/CountLabel';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';

// Helper to determine groupPosition for list items
function getGroupPosition(index: number, total: number): 'top' | 'middle' | 'bottom' {
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/**
 * Subtitle of one game row: the last-played date when the list is sorted by
 * date, the number of matches otherwise.
 */
function describeGameTypeRow(sortMode: GamesSortMode, lastPlayed: number | undefined, count: number): string {
	if (sortMode !== 'lastPlayed') return countLabel(count, 'Partie', 'Partien');
	if (!lastPlayed) return 'Noch keine Partie';
	return `Zuletzt gespielt: ${DateHelper.getHumanReadableDate(new Date(lastPlayed), false)}`;
}

// All actions on the games list (create, import/export, sorting) live in the
// settings modal - the header only opens it.
function GamesHeaderRight({ color, onOpenSettings }: Readonly<{ color: string; onOpenSettings: () => void }>) {
	return (
		<View style={styles.headerButtons}>
			<TouchableOpacity
				id={ComponentIds.GAMES_SCREEN_SETTINGS_BUTTON}
				onPress={onOpenSettings}
				style={styles.headerButton}
			>
				<Ionicons name="settings-outline" size={22} color={color} />
			</TouchableOpacity>
		</View>
	);
}

function makeGamesHeaderRight(color: string, onOpenSettings: () => void) {
	return () => <GamesHeaderRight color={color} onOpenSettings={onOpenSettings} />;
}

// ─── Sort options (settings modal) ────────────────────────────────────────────
//
// Rendered as its own component so it re-renders from its own `useSelector`
// subscription and the selected option updates live while the modal stays
// open (same pattern as the game screen's ColumnsSettingsSection).

function GamesSortSection() {
	const dispatch = useDispatch<AppDispatch>();
	const gamesSortMode = useSelector((state: RootState) => state.appSettings.gamesSortMode);

	return (
		<>
			<SettingsListGroupTitle title="Sortierung" />
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAMES_SETTINGS_SORT_LAST_PLAYED}
				label="Zuletzt gespielt"
				leftIcon={<Ionicons name="time-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={gamesSortMode === 'lastPlayed'}
				onPress={() => dispatch(setGamesSortMode('lastPlayed'))}
				groupPosition="top"
			/>
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAMES_SETTINGS_SORT_NAME}
				label="Name (A–Z)"
				leftIcon={<Ionicons name="text-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={gamesSortMode === 'name'}
				onPress={() => dispatch(setGamesSortMode('name'))}
				groupPosition="middle"
			/>
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAMES_SETTINGS_SORT_MATCH_COUNT}
				label="Anzahl Partien"
				leftIcon={<Ionicons name="podium-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={gamesSortMode === 'matchCount'}
				onPress={() => dispatch(setGamesSortMode('matchCount'))}
				groupPosition="bottom"
			/>
		</>
	);
}

export default function GamesScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const historyEntries = useSelector((state: RootState) => state.gameHistory.entries);
	const gamesSortMode = useSelector((state: RootState) => state.appSettings.gamesSortMode);
	const activeGame = useSelector((state: RootState) => state.game);
	const navigation = useNavigation();
	const [searchQuery, setSearchQuery] = useState('');
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { show: showNestedModal, close: closeNestedModal } = useMyScrollViewModal();

	// Played matches and most recent match per game type (derived from the
	// archived history). `lastPlayedAt` drives the default sort order.
	const { matchCounts, lastPlayedAt } = useMemo(() => {
		const counts: Record<string, number> = {};
		const lastPlayed: Record<string, number> = {};
		for (const entry of historyEntries) {
			if (entry.gameTypeId) {
				counts[entry.gameTypeId] = (counts[entry.gameTypeId] ?? 0) + 1;
				lastPlayed[entry.gameTypeId] = Math.max(lastPlayed[entry.gameTypeId] ?? 0, entry.endedAt);
			}
		}
		return { matchCounts: counts, lastPlayedAt: lastPlayed };
	}, [historyEntries]);

	const filteredGameTypes = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		const filtered = query ? gameTypes.filter((gameType) => gameType.name.toLowerCase().includes(query)) : [...gameTypes];
		const byName = (a: (typeof filtered)[number], b: (typeof filtered)[number]) => a.name.localeCompare(b.name);
		switch (gamesSortMode) {
			case 'name':
				filtered.sort(byName);
				break;
			case 'matchCount':
				filtered.sort((a, b) => (matchCounts[b.id] ?? 0) - (matchCounts[a.id] ?? 0) || byName(a, b));
				break;
			default:
				// Default: games with the most recent match first; never-played games
				// (no history entry → 0) end up at the bottom, alphabetically.
				filtered.sort((a, b) => (lastPlayedAt[b.id] ?? 0) - (lastPlayedAt[a.id] ?? 0) || byName(a, b));
				break;
		}
		return filtered;
	}, [gameTypes, searchQuery, gamesSortMode, matchCounts, lastPlayedAt]);

	const handleAddGameType = useCallback(() => {
		const gameNumber = gameTypes.length + 1;
		const action = dispatch(addGameType(`Spiel ${gameNumber}`));
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [gameTypes.length, dispatch]);

	// "Schnelles Spiel": jump straight into a fresh match without picking a
	// game - only the players are left to add in the setup phase. A still
	// running match is archived first so it isn't lost (same as the game
	// detail's "Neue Partie starten").
	const handleQuickMatch = useCallback(() => {
		if (activeGame.status === 'active' && activeGame.players.length > 0 && hasRecordedResults(activeGame)) {
			dispatch(
				archiveGame(buildHistoryEntry(activeGame, { id: activeGame.matchId ?? generateId(), endedAt: Date.now() })),
			);
		}
		dispatch(resetScores({ clearPlayers: true }));
		dispatch(setGameType(undefined));
		router.push('/match');
	}, [activeGame, dispatch]);

	const handleAddGameTypeFromModal = useCallback(() => {
		closeModal();
		handleAddGameType();
	}, [closeModal, handleAddGameType]);

	const handleLoadFlipSeven = useCallback(() => {
		const action = dispatch(addGameTypeFromPreset(FLIP_SEVEN_PRESET));
		closeModal();
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [dispatch, closeModal]);

	const handleLoadMansions = useCallback(() => {
		const action = dispatch(addGameTypeFromPreset(MANSIONS_OF_MADNESS_PRESET));
		closeModal();
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [dispatch, closeModal]);

	// Import Spiele from a shared export string. Only the games are consumed -
	// pasting the export of a whole Partie here imports just its Spiel (see
	// components/ShareImportContent).
	const handleOpenImportModal = useCallback(() => {
		showNestedModal({
			title: 'Spiel importieren',
			children: <ShareImportContent mode="games" onClose={closeNestedModal} />,
		});
	}, [showNestedModal, closeNestedModal]);

	// Share all games as templates in the common export format (see helpers/
	// ShareCodec) - offered via the export modal (clipboard or share sheet).
	const handleExportAll = useCallback(() => {
		showNestedModal({
			title: 'Alle Spiele exportieren',
			children: (
				<ShareExportContent
					text={encodeShareBundle(buildGamesShareBundle(gameTypes))}
					info={`Der Export enthält ${countLabel(gameTypes.length, 'Spiel', 'Spiele')} als Vorlagen. Ein anderer Spieler kann sie im Spiele-Bereich über „Spiel importieren“ einfügen.`}
				/>
			),
		});
	}, [gameTypes, showNestedModal]);

	const handleOpenSettingsModal = useCallback(() => {
		showModal({
			title: '⚙️ Optionen',
			children: (
				<View style={styles.modalContent}>
					<SettingsListGroupTitle title="Neu" />
					<SettingsList
						nativeID={ComponentIds.GAMES_SETTINGS_CREATE_GAME_ROW}
						label="Neues Spiel erstellen"
						leftIcon={<Ionicons name="add-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={handleAddGameTypeFromModal}
						groupPosition="single"
					/>
					<SettingsListGroupTitle title="Import / Export" />
					<SettingsList
						nativeID={ComponentIds.GAMES_SETTINGS_EXPORT_ALL_ROW}
						label="Alle Spiele exportieren"
						leftIcon={<Ionicons name="share-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={handleExportAll}
						groupPosition="top"
					/>
					<SettingsList
						nativeID={ComponentIds.GAMES_IMPORT_LOAD_FLIP_SEVEN_ROW}
						label="🃏 Flip Seven laden"
						value="Punktespiel mit Kartenauswahl"
						stackedValue
						leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={handleLoadFlipSeven}
						groupPosition="middle"
					/>
					<SettingsList
						nativeID={ComponentIds.GAMES_IMPORT_LOAD_MANSIONS_ROW}
						label="🏰 Villen des Wahnsinns laden"
						value="Ohne Punkte - mit Start-/Endzeit, Dauer, Karte, Status, Notiz und Wahnsinn je Spieler"
						stackedValue
						leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={handleLoadMansions}
						groupPosition="bottom"
					/>
					<GamesSortSection />
				</View>
			),
		});
	}, [showModal, handleAddGameTypeFromModal, handleExportAll, handleLoadFlipSeven, handleLoadMansions]);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: makeGamesHeaderRight(theme.header.text, handleOpenSettingsModal),
		});
	}, [navigation, theme.header.text, handleOpenSettingsModal]);

	const searchResultsContent =
		filteredGameTypes.length === 0 ? (
			<Text style={[styles.emptySubtext, styles.noResultsText, { color: theme.screen.placeholder }]}>
				Kein Spiel gefunden für „{searchQuery}“.
			</Text>
		) : (
			filteredGameTypes.map((gameType, index) => {
				const count = matchCounts[gameType.id] ?? 0;
				// The row's subtitle mirrors the active sort: last-played date when
				// sorting by date, match count otherwise.
				const lastPlayed = lastPlayedAt[gameType.id];
				const value = describeGameTypeRow(gamesSortMode, lastPlayed, count);
				return (
					<SettingsList
						key={gameType.id}
						nativeID={`${ComponentIds.GAMES_SCREEN_GAME_ROW_PREFIX}${gameType.id}`}
						leftIconComponent={
							<View style={styles.gameIconWrapper}>
								<GameTypeIcon icon={gameType.icon} imageUrl={gameType.imageUrl} size={56} />
							</View>
						}
						label={gameType.name}
						value={value}
						stackedValue
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={() => router.push({ pathname: '/games/[id]', params: { id: gameType.id } })}
						groupPosition={getGroupPosition(index, filteredGameTypes.length)}
					/>
				);
			})
		);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			{gameTypes.length > 0 && (
				<View style={styles.searchBarWrapper}>
					<View style={[styles.searchBar, { backgroundColor: theme.screen.iconBg }]}>
						<Ionicons name="search-outline" size={18} color={theme.screen.icon} />
						<TextInput
							nativeID={ComponentIds.GAMES_SCREEN_SEARCH_INPUT}
							style={[styles.searchInput, { color: theme.screen.text }]}
							placeholder="Spiel suchen"
							placeholderTextColor={theme.screen.placeholder}
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType="search"
							autoCorrect={false}
						/>
						{searchQuery.length > 0 && (
							<TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
								<Ionicons name="close-circle" size={18} color={theme.screen.icon} />
							</TouchableOpacity>
						)}
					</View>
				</View>
			)}
			<ScrollView
				contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
			>
				<View style={styles.createGameRow}>
					<SettingsList
						nativeID={ComponentIds.GAMES_SCREEN_QUICK_MATCH_ROW}
						label="Schnelles Spiel"
						value="Partie ohne bestimmtes Spiel starten - nur noch Spieler hinzufügen"
						stackedValue
						leftIcon={<Ionicons name="flash-outline" size={20} color="#ffffff" />}
						iconBgColor={SUCCESS_COLOR}
						handleFunction={handleQuickMatch}
						groupPosition="top"
					/>
					<SettingsList
						nativeID={ComponentIds.GAMES_SCREEN_CREATE_GAME_ROW}
						label="Spiel anlegen"
						leftIcon={<Ionicons name="add-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={handleAddGameType}
						groupPosition="middle"
					/>
					<SettingsList
						nativeID={ComponentIds.GAMES_SCREEN_IMPORT_ROW}
						label="Spiel importieren"
						leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={handleOpenImportModal}
						groupPosition="bottom"
					/>
				</View>
				{gameTypes.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name="dice-outline" size={64} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.text }]}>Noch keine Spiele</Text>
						<Text style={[styles.emptySubtext, { color: theme.screen.placeholder }]}>
							Lege ein Spiel (z.B. Skat, Phase 10, ...) über „Spiel anlegen“ an
						</Text>
					</View>
				) : (
					searchResultsContent
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerButtons: {
		flexDirection: 'row',
		gap: 12,
		marginRight: 8,
	},
	headerButton: {
		padding: 4,
	},
	modalContent: {
		padding: 10,
	},
	searchBarWrapper: {
		paddingHorizontal: 12,
		paddingTop: 12,
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 40,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		height: '100%',
	},
	listContent: {
		padding: 12,
	},
	createGameRow: {
		marginBottom: 12,
	},
	gameIconWrapper: {
		marginRight: 12,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 96,
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
	noResultsText: {
		marginTop: 32,
		paddingHorizontal: 16,
	},
});
