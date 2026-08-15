import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { loadMatch, resetScores, setGameType } from '../store/gameSlice';
import { archiveGame } from '../store/gameHistorySlice';
import type { AppDispatch, RootState } from '../store/store';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import { buildHistoryEntry, hasRecordedResults } from '../helpers/GameHistoryStorage';
import { generateId } from '../helpers/RandomHelper';
import { ComponentIds } from '../constants/ComponentIds';
import GameTypeIcon from '../components/GameTypeIcon';
import ShareImportContent from '../components/ShareImportContent';
import { countLabel } from '../helpers/CountLabel';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';
const TOOLS_COLOR = '#f59e0b';

// ─── Time-of-day greeting ─────────────────────────────────────────────────────
//
// The hero message changes with the time of day, and each slot has a couple of
// variants rotated by the day of the year - so it varies from day to day but
// stays stable while the screen is open.

type Greeting = { title: string; subtitle: string };

const GREETINGS: ReadonlyArray<{ fromHour: number; variants: Greeting[] }> = [
	{
		// 00:00–04:59 - the late-night slot wraps around midnight.
		fromHour: 0,
		variants: [
			{ title: 'Noch wach? 🦉', subtitle: 'Die besten Partien entstehen nach Mitternacht.' },
			{ title: 'Nachtschicht! 🌌', subtitle: 'Eine letzte Runde geht immer.' },
		],
	},
	{
		fromHour: 5,
		variants: [
			{ title: 'Guten Morgen! ☀️', subtitle: 'Frisch gewürfelt ist halb gewonnen - bereit für eine neue Partie?' },
			{ title: 'Früh übt sich! 🌅', subtitle: 'Wer zuerst spielt, punktet zuerst.' },
		],
	},
	{
		fromHour: 11,
		variants: [
			{ title: 'Mahlzeit! 🎲', subtitle: 'Zeit für eine schnelle Runde zwischendurch?' },
			{ title: 'Halbzeit! ⏱️', subtitle: 'Eine Partie passt immer in die Pause.' },
		],
	},
	{
		fromHour: 14,
		variants: [
			{ title: 'Hallo! 👋', subtitle: 'Der perfekte Nachmittag für eine neue Partie.' },
			{ title: 'Spielst du mit? 🃏', subtitle: 'Karten gemischt, Würfel bereit - es kann losgehen.' },
		],
	},
	{
		fromHour: 18,
		variants: [
			{ title: 'Guten Abend! 🌙', subtitle: 'Die beste Zeit für einen Spieleabend!' },
			{ title: 'Spieleabend? 🏆', subtitle: 'Trommel alle zusammen - heute wird gepunktet.' },
		],
	},
	{
		fromHour: 23,
		variants: [
			{ title: 'Noch wach? 🦉', subtitle: 'Die besten Partien entstehen nach Mitternacht.' },
			{ title: 'Nachtschicht! 🌌', subtitle: 'Eine letzte Runde geht immer.' },
		],
	},
];

/** Days since epoch, so the variant rotates once per day (stable within a day). */
function dayNumber(now: Date): number {
	return Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
}

export function getGreeting(now: Date): Greeting {
	const hour = now.getHours();
	// The slots are sorted by fromHour - the last one that already began wins.
	let slot = GREETINGS[0];
	for (const candidate of GREETINGS) {
		if (hour >= candidate.fromHour) slot = candidate;
	}
	return slot.variants[dayNumber(now) % slot.variants.length];
}

/** Day a match ended, matching the Partien list format. */
function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatTile({ value, label, color }: Readonly<{ value: number; label: string; color: string }>) {
	const { theme } = useTheme();
	return (
		<View style={[styles.statTile, { backgroundColor: theme.screen.iconBg }]}>
			<Text style={[styles.statValue, { color }]}>{value}</Text>
			<Text style={[styles.statLabel, { color: theme.screen.placeholder }]}>{label}</Text>
		</View>
	);
}

// ─── Start screen ─────────────────────────────────────────────────────────────

export default function StartScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const activeGame = useSelector((state: RootState) => state.game);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const historyEntries = useSelector((state: RootState) => state.gameHistory.entries);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const { show: showImportModal, close: closeImportModal } = useMyScrollViewModal();

	const greeting = getGreeting(new Date());

	// A match that is actually being played right now (setup-phase leftovers and
	// view-only loaded archives don't count as "aktiv").
	const hasRunningMatch = activeGame.status === 'active' && activeGame.players.length > 0;

	// Most recently finished match, for the "zuletzt gespielte Partie" entry
	// when nothing is running.
	const latestEntry = useMemo<GameHistoryEntry | null>(() => {
		let latest: GameHistoryEntry | null = null;
		for (const entry of historyEntries) {
			if (!latest || entry.endedAt > latest.endedAt) latest = entry;
		}
		return latest;
	}, [historyEntries]);

	// The game to offer "Neue Partie starten" for: the one being played right
	// now, otherwise the one of the most recent archived match.
	const lastPlayedGameType = useMemo(() => {
		const lastPlayedId = hasRunningMatch ? activeGame.gameTypeId : latestEntry?.gameTypeId;
		return lastPlayedId ? gameTypes.find((gameType) => gameType.id === lastPlayedId) : undefined;
	}, [hasRunningMatch, activeGame.gameTypeId, latestEntry, gameTypes]);

	/**
	 * Archive whatever is currently being played so it isn't lost when the game
	 * state is replaced - same guard as the games screens: a match nothing was
	 * recorded in yet is dropped instead of archived.
	 */
	const archiveRunningMatch = useCallback(() => {
		if (!hasRunningMatch || !hasRecordedResults(activeGame)) return;
		dispatch(
			archiveGame(buildHistoryEntry(activeGame, { id: activeGame.matchId ?? generateId(), endedAt: activeGame.endedAt ?? Date.now() })),
		);
	}, [hasRunningMatch, activeGame, dispatch]);

	// Start a new match of the last played game (mirrors the game detail's
	// "Neue Partie starten"): empty seats, the game preselected.
	const handleStartNewMatch = useCallback(() => {
		if (!lastPlayedGameType) return;
		archiveRunningMatch();
		dispatch(resetScores({ clearPlayers: true }));
		dispatch(setGameType(lastPlayedGameType.id));
		router.push('/match');
	}, [lastPlayedGameType, archiveRunningMatch, dispatch]);

	// Jump back into the running match, or open the most recent archived one
	// view-only (same as tapping it in its game's Partien list).
	const handleOpenLastMatch = useCallback(() => {
		if (!hasRunningMatch && latestEntry) {
			dispatch(loadMatch(latestEntry));
		}
		router.push('/match');
	}, [hasRunningMatch, latestEntry, dispatch]);

	// "Schnelles Spiel": fresh match without picking a game first - only the
	// players are left to add (same as the games screen's quick match row).
	const handleQuickMatch = useCallback(() => {
		archiveRunningMatch();
		dispatch(resetScores({ clearPlayers: true }));
		dispatch(setGameType(undefined));
		router.push('/match');
	}, [archiveRunningMatch, dispatch]);

	// Import a shared export (a Partie with its Spiel and Freunden, or plain
	// Spiele/Freunde) from the clipboard - see components/ShareImportContent.
	const handleOpenImportModal = useCallback(() => {
		showImportModal({
			title: 'Partie importieren',
			children: <ShareImportContent mode="all" onClose={closeImportModal} />,
		});
	}, [showImportModal, closeImportModal]);

	const matchRowCount = (lastPlayedGameType ? 1 : 0) + (hasRunningMatch || latestEntry ? 1 : 0);
	const showLastMatchRow = hasRunningMatch || latestEntry != null;

	let lastMatchRowLabel = 'Letzte Partie ansehen';
	let lastMatchRowValue = latestEntry
		? `${formatDate(latestEntry.endedAt)} · ${countLabel(latestEntry.players.length, 'Spieler', 'Spieler')}`
		: '';
	if (hasRunningMatch) {
		lastMatchRowLabel = 'Aktive Partie fortsetzen';
		lastMatchRowValue = `${lastPlayedGameType ? lastPlayedGameType.name : 'Partie'} läuft · ${
			activeGame.players.length === 1 ? '1 Spieler' : `${activeGame.players.length} Spieler`
		}`;
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}>
				<View nativeID={ComponentIds.START_SCREEN_GREETING} style={styles.greetingWrap}>
					<Text style={[styles.greetingTitle, { color: theme.screen.text }]}>{greeting.title}</Text>
					<Text style={[styles.greetingSubtitle, { color: theme.screen.placeholder }]}>{greeting.subtitle}</Text>
				</View>

				{matchRowCount > 0 && (
					<>
						<SettingsListGroupTitle title="Weiter geht's" />
						{lastPlayedGameType && (
							<SettingsList
								nativeID={ComponentIds.START_SCREEN_NEW_MATCH_ROW}
								label="Neue Partie starten"
								value={lastPlayedGameType.name}
								stackedValue
								leftIconComponent={
									<View style={styles.gameIconWrapper}>
										<GameTypeIcon icon={lastPlayedGameType.icon} imageUrl={lastPlayedGameType.imageUrl} size={40} />
									</View>
								}
								rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
								handleFunction={handleStartNewMatch}
								groupPosition={matchRowCount === 1 ? 'single' : 'top'}
							/>
						)}
						{showLastMatchRow && (
							<SettingsList
								nativeID={ComponentIds.START_SCREEN_LAST_MATCH_ROW}
								label={lastMatchRowLabel}
								value={lastMatchRowValue}
								stackedValue
								leftIcon={<Ionicons name={hasRunningMatch ? 'play-circle-outline' : 'time-outline'} size={20} color="#ffffff" />}
								iconBgColor={hasRunningMatch ? SUCCESS_COLOR : PRIMARY_COLOR}
								rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
								handleFunction={handleOpenLastMatch}
								groupPosition={matchRowCount === 1 ? 'single' : 'bottom'}
							/>
						)}
					</>
				)}

				<SettingsListGroupTitle title="Spielen" />
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_QUICK_MATCH_ROW}
					label="Schnelles Spiel"
					value="Partie ohne bestimmtes Spiel starten - nur noch Spieler hinzufügen"
					stackedValue
					leftIcon={<Ionicons name="flash-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					handleFunction={handleQuickMatch}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_MY_GAMES_ROW}
					label="Meine Spiele"
					value={gameTypes.length === 1 ? '1 Spiel' : `${gameTypes.length} Spiele`}
					leftIcon={<Ionicons name="dice-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/games')}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_IMPORT_ROW}
					label="Partie importieren"
					value="Export eines anderen Spielers aus der Zwischenablage einfügen"
					stackedValue
					leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenImportModal}
					groupPosition="bottom"
				/>

				<SettingsListGroupTitle title="Für den Spieleabend" />
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_FRIENDS_ROW}
					label="Freunde"
					value={friends.length === 1 ? '1 Freund gespeichert' : `${friends.length} Freunde gespeichert`}
					leftIcon={<Ionicons name="people-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/players')}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_TIMER_ROW}
					label="Timer"
					value="Stoppuhr und Countdown"
					leftIcon={<Ionicons name="stopwatch-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/timer')}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_DICE_ROW}
					label="Würfel"
					value="Digitale Würfel, falls mal einer fehlt"
					leftIcon={<Ionicons name="dice-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/dice')}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.START_SCREEN_STATS_ROW}
					label="Statistik"
					value="Spielzeit, Serien und Rekorde"
					leftIcon={<Ionicons name="stats-chart-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/stats')}
					groupPosition="bottom"
				/>

				<View nativeID={ComponentIds.START_SCREEN_STATS} style={styles.statsRow}>
					<StatTile value={gameTypes.length} label={gameTypes.length === 1 ? 'Spiel' : 'Spiele'} color={PRIMARY_COLOR} />
					<StatTile value={historyEntries.length} label={historyEntries.length === 1 ? 'Partie' : 'Partien'} color={SUCCESS_COLOR} />
					<StatTile value={friends.length} label={friends.length === 1 ? 'Freund' : 'Freunde'} color={TOOLS_COLOR} />
				</View>
			</ScrollView>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		padding: 12,
	},
	greetingWrap: {
		paddingHorizontal: 4,
		paddingTop: 16,
		paddingBottom: 8,
		gap: 6,
	},
	greetingTitle: {
		fontSize: 28,
		fontWeight: '800',
	},
	greetingSubtitle: {
		fontSize: 16,
		lineHeight: 23,
	},
	gameIconWrapper: {
		marginRight: 12,
	},
	statsRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 20,
	},
	statTile: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
		gap: 2,
	},
	statValue: {
		fontSize: 24,
		fontWeight: '800',
	},
	statLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
});
