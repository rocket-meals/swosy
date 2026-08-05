import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoxplot,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { computeBoxplotStats } from 'repo-depkit-common';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import type { GameHistoryEntry } from '../../helpers/GameHistoryStorage';
import { formatDuration } from '../../helpers/GameCategories';
import {
	WEEKDAY_NAMES,
	buildYearActivityGrid,
	busiestDay,
	computeStreaks,
	entriesWithFriend,
	formatDayIndex,
	friendMatchCounts,
	friendWinCounts,
	gameMatchCounts,
	largestMatch,
	longestMatch,
	matchDurations,
	mostRoundsMatch,
	playCountsByDayIndex,
	totalPlayedMinutes,
	weekdayCounts,
} from '../../helpers/StatsHelper';
import { ComponentIds } from '../../constants/ComponentIds';
import GameTypeIcon from '../../components/GameTypeIcon';
import YearActivityGrid, { YearActivityGridWeekdayHeader } from '../../components/YearActivityGrid';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';
const TOOLS_COLOR = '#f59e0b';
const CHEVRON = <Ionicons name="chevron-forward" size={20} color="#9ca3af" />;

function getGroupPosition(index: number, length: number): 'single' | 'top' | 'bottom' | 'middle' {
	if (length === 1) return 'single';
	if (index === 0) return 'top';
	if (index === length - 1) return 'bottom';
	return 'middle';
}

/** `5 Partien` / `1 Partie`, used all over the ranking lists. */
function formatMatchCount(count: number): string {
	return count === 1 ? '1 Partie' : `${count} Partien`;
}

// ─── Overview tiles ───────────────────────────────────────────────────────────

function StatTile({ value, label, color }: Readonly<{ value: string; label: string; color: string }>) {
	const { theme } = useTheme();
	return (
		<View style={[styles.statTile, { backgroundColor: theme.screen.iconBg }]}>
			<Text style={[styles.statValue, { color }]}>{value}</Text>
			<Text style={[styles.statLabel, { color: theme.screen.placeholder }]}>{label}</Text>
		</View>
	);
}

// ─── Modal contents ───────────────────────────────────────────────────────────
//
// Each modal reads its data from the store itself, so an open modal stays live
// when the state changes instead of showing the snapshot from when it was
// opened (same pattern as the friend edit modal on the players screen).

/** GitHub-like "was played on this day" calendar of the last 12 months. */
function YearOverviewContent() {
	const entries = useSelector((state: RootState) => state.gameHistory.entries);
	const grid = useMemo(() => buildYearActivityGrid(entries, new Date()), [entries]);
	// No extra horizontal padding: the grid columns must line up with the
	// weekday labels in the modal's sticky header, which only get the scroll
	// content's own padding.
	return (
		<View style={styles.yearModalContent}>
			<Text style={styles.modalIntro}>
				{grid.activeDayCount === 1
					? 'An 1 Tag in den letzten 12 Monaten gespielt.'
					: `An ${grid.activeDayCount} Tagen in den letzten 12 Monaten gespielt.`}
			</Text>
			<YearActivityGrid grid={grid} nativeID={ComponentIds.STATS_YEAR_GRID} />
		</View>
	);
}

/** Horizontal bars: how many matches ended on each weekday. */
function WeekdayContent() {
	const { theme } = useTheme();
	const entries = useSelector((state: RootState) => state.gameHistory.entries);
	const counts = useMemo(() => weekdayCounts(entries), [entries]);
	const max = Math.max(...counts, 1);
	return (
		<View style={styles.modalContent}>
			<Text style={styles.modalIntro}>An welchen Wochentagen gespielt wird:</Text>
			{WEEKDAY_NAMES.map((name, index) => (
				<View key={name} style={styles.weekdayRow}>
					<Text style={[styles.weekdayName, { color: theme.screen.text }]}>{name}</Text>
					<View style={[styles.weekdayBarTrack, { backgroundColor: theme.screen.iconBg }]}>
						<View
							style={[
								styles.weekdayBarFill,
								{ backgroundColor: PRIMARY_COLOR, width: `${(counts[index] / max) * 100}%` as `${number}%` },
							]}
						/>
					</View>
					<Text style={[styles.weekdayCount, { color: theme.screen.placeholder }]}>{counts[index]}</Text>
				</View>
			))}
		</View>
	);
}

/** Games ranked by how often they were played, with their share of the play time. */
function TopGamesContent() {
	const entries = useSelector((state: RootState) => state.gameHistory.entries);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const ranking = useMemo(() => {
		const counts = gameMatchCounts(entries);
		const rows = gameTypes
			.map((gameType) => ({
				gameType,
				count: counts.get(gameType.id) ?? 0,
				minutes: totalPlayedMinutes(entries.filter((entry) => entry.gameTypeId === gameType.id)),
			}))
			.filter((row) => row.count > 0)
			.sort((a, b) => b.count - a.count);
		const withoutGame = counts.get(null) ?? 0;
		return { rows, withoutGame };
	}, [entries, gameTypes]);
	const totalRows = ranking.rows.length + (ranking.withoutGame > 0 ? 1 : 0);
	return (
		<View style={styles.modalContent}>
			{ranking.rows.map((row, index) => (
				<SettingsList
					key={row.gameType.id}
					label={`${index + 1}. ${row.gameType.name}`}
					value={`${formatMatchCount(row.count)}${row.minutes > 0 ? ` · ${formatDuration(row.minutes)}` : ''}`}
					stackedValue
					leftIconComponent={
						<View style={styles.gameIconWrapper}>
							<GameTypeIcon icon={row.gameType.icon} imageUrl={row.gameType.imageUrl} size={40} />
						</View>
					}
					groupPosition={getGroupPosition(index, totalRows)}
				/>
			))}
			{ranking.withoutGame > 0 && (
				<SettingsList
					label="Ohne bestimmtes Spiel"
					value={formatMatchCount(ranking.withoutGame)}
					leftIcon={<Ionicons name="flash-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					groupPosition={getGroupPosition(totalRows - 1, totalRows)}
				/>
			)}
		</View>
	);
}

/** Friends ranked by matches played together - and, separately, by wins. */
function FriendRankingContent({ mode }: Readonly<{ mode: 'matches' | 'wins' }>) {
	const entries = useSelector((state: RootState) => state.gameHistory.entries);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const rows = useMemo(() => {
		const counts = mode === 'matches' ? friendMatchCounts(entries) : friendWinCounts(entries, gameTypes);
		return friends
			.map((friend) => ({ friend, count: counts.get(friend.id) ?? 0 }))
			.filter((row) => row.count > 0)
			.sort((a, b) => b.count - a.count);
	}, [mode, entries, gameTypes, friends]);
	if (rows.length === 0) {
		return (
			<View style={styles.modalContent}>
				<Text style={styles.modalIntro}>
					{mode === 'matches'
						? 'Noch keine Partien mit gespeicherten Freunden.'
						: 'Noch keine gewonnenen Partien mit gespeicherten Freunden.'}
				</Text>
			</View>
		);
	}
	return (
		<View style={styles.modalContent}>
			{rows.map((row, index) => (
				<SettingsList
					key={row.friend.id}
					label={`${index + 1}. ${row.friend.name}`}
					value={mode === 'matches' ? formatMatchCount(row.count) : row.count === 1 ? '1 Sieg' : `${row.count} Siege`}
					leftIcon={<Ionicons name={mode === 'matches' ? 'people-outline' : 'trophy-outline'} size={20} color="#ffffff" />}
					iconBgColor={row.friend.color}
					groupPosition={getGroupPosition(index, rows.length)}
				/>
			))}
			{mode === 'wins' && (
				<Text style={styles.modalFootnote}>
					Gezählt werden Partien mit mindestens zwei Spielern, in denen nicht alle punktgleich waren. Ob der höchste oder der
					niedrigste Punktestand gewinnt, richtet sich nach dem jeweiligen Spiel.
				</Text>
			)}
		</View>
	);
}

// ─── Statistics screen ────────────────────────────────────────────────────────

export default function StatsScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const entries = useSelector((state: RootState) => state.gameHistory.entries);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	// null = "Alle Spiele" / "no friend picked yet" (falls back to the most active one).
	const [selectedGameTypeId, setSelectedGameTypeId] = useState<string | null>(null);
	const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

	// ── Overview numbers ──
	const totalMinutes = useMemo(() => totalPlayedMinutes(entries), [entries]);
	const playDayCount = useMemo(() => playCountsByDayIndex(entries).size, [entries]);
	const streaks = useMemo(() => computeStreaks(entries, new Date()), [entries]);
	const activeDaysLastYear = useMemo(() => buildYearActivityGrid(entries, new Date()).activeDayCount, [entries]);

	const favoriteWeekday = useMemo(() => {
		const counts = weekdayCounts(entries);
		let bestIndex = 0;
		for (let i = 1; i < 7; i++) {
			if (counts[i] > counts[bestIndex]) bestIndex = i;
		}
		return counts[bestIndex] > 0 ? { name: WEEKDAY_NAMES[bestIndex], count: counts[bestIndex] } : null;
	}, [entries]);

	// ── Match duration boxplot (all games or one picked game) ──
	const selectedGameType = selectedGameTypeId ? gameTypes.find((gameType) => gameType.id === selectedGameTypeId) : undefined;
	const durations = useMemo(
		() => matchDurations(entries, selectedGameType?.id),
		[entries, selectedGameType?.id],
	);
	const durationStats = useMemo(() => computeBoxplotStats(durations), [durations]);

	// ── Play time per person ──
	const mostActiveFriendId = useMemo(() => {
		let best: { id: string; count: number } | null = null;
		for (const [friendId, count] of friendMatchCounts(entries)) {
			if (!best || count > best.count) best = { id: friendId, count };
		}
		return best?.id ?? null;
	}, [entries]);
	const effectiveFriendId = selectedFriendId ?? mostActiveFriendId;
	const selectedFriend = effectiveFriendId ? friends.find((friend) => friend.id === effectiveFriendId) : undefined;
	const friendEntries = useMemo(
		() => (selectedFriend ? entriesWithFriend(entries, selectedFriend.id) : []),
		[entries, selectedFriend],
	);
	const friendDurations = useMemo(() => matchDurations(friendEntries), [friendEntries]);
	const friendStats = useMemo(() => computeBoxplotStats(friendDurations), [friendDurations]);
	const friendMinutes = useMemo(() => totalPlayedMinutes(friendEntries), [friendEntries]);

	// ── Records ──
	const gameTypeName = useCallback(
		(entry: GameHistoryEntry) => (entry.gameTypeId ? gameTypes.find((gameType) => gameType.id === entry.gameTypeId)?.name : undefined),
		[gameTypes],
	);
	const recordLongest = useMemo(() => longestMatch(entries), [entries]);
	const recordRounds = useMemo(() => mostRoundsMatch(entries), [entries]);
	const recordPlayers = useMemo(() => largestMatch(entries), [entries]);
	const recordDay = useMemo(() => busiestDay(entries), [entries]);
	const recordRows = useMemo(() => {
		const rows: { key: string; icon: string; label: string; value: string }[] = [];
		if (recordLongest?.durationMinutes != null) {
			const name = gameTypeName(recordLongest);
			rows.push({
				key: 'longest',
				icon: 'timer-outline',
				label: 'Längste Partie',
				value: `${formatDuration(recordLongest.durationMinutes)}${name ? ` · ${name}` : ''}`,
			});
		}
		if (recordRounds && recordRounds.roundsCount > 0) {
			const name = gameTypeName(recordRounds);
			rows.push({
				key: 'rounds',
				icon: 'repeat-outline',
				label: 'Meiste Runden in einer Partie',
				value: `${recordRounds.roundsCount} Runden${name ? ` · ${name}` : ''}`,
			});
		}
		if (recordPlayers && recordPlayers.players.length > 0) {
			const name = gameTypeName(recordPlayers);
			rows.push({
				key: 'players',
				icon: 'people-outline',
				label: 'Größte Runde',
				value: `${recordPlayers.players.length} Spieler${name ? ` · ${name}` : ''}`,
			});
		}
		if (recordDay) {
			rows.push({
				key: 'day',
				icon: 'calendar-outline',
				label: 'Aktivster Tag',
				value: `${formatMatchCount(recordDay.count)} am ${formatDayIndex(recordDay.dayIndex)}`,
			});
		}
		return rows;
	}, [recordLongest, recordRounds, recordPlayers, recordDay, gameTypeName]);

	// ── Modals ──
	const handleOpenYearOverview = useCallback(() => {
		showModal({
			title: '📅 Jahresübersicht',
			stickyHeaderComponent: <YearActivityGridWeekdayHeader />,
			children: <YearOverviewContent />,
		});
	}, [showModal]);

	const handleOpenWeekdays = useCallback(() => {
		showModal({ title: '📊 Wochentage', children: <WeekdayContent /> });
	}, [showModal]);

	const handleOpenTopGames = useCallback(() => {
		showModal({ title: '🏆 Top-Spiele', children: <TopGamesContent /> });
	}, [showModal]);

	const handleOpenTopFriends = useCallback(() => {
		showModal({ title: '👥 Häufigste Mitspieler', children: <FriendRankingContent mode="matches" /> });
	}, [showModal]);

	const handleOpenWins = useCallback(() => {
		showModal({ title: '🥇 Siegerliste', children: <FriendRankingContent mode="wins" /> });
	}, [showModal]);

	// The picker modals close on selection, so the (snapshotted) modal content
	// never shows a stale radio state.
	const handleOpenGameFilter = useCallback(() => {
		const counts = gameMatchCounts(entries);
		const games = gameTypes
			.filter((gameType) => (counts.get(gameType.id) ?? 0) > 0)
			.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
		showModal({
			title: '🎲 Spiel auswählen',
			children: (
				<View style={styles.modalContent}>
					<SettingsListSelectOptionSingle
						nativeID={`${ComponentIds.STATS_GAME_FILTER_OPTION_PREFIX}all`}
						label="Alle Spiele"
						leftIcon={<Ionicons name="albums-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						selectionColor={PRIMARY_COLOR}
						isSelected={selectedGameTypeId === null}
						onPress={() => {
							setSelectedGameTypeId(null);
							closeModal();
						}}
						groupPosition={games.length === 0 ? 'single' : 'top'}
					/>
					{games.map((gameType, index) => (
						<SettingsListSelectOptionSingle
							key={gameType.id}
							nativeID={`${ComponentIds.STATS_GAME_FILTER_OPTION_PREFIX}${gameType.id}`}
							label={`${gameType.name} (${formatMatchCount(counts.get(gameType.id) ?? 0)})`}
							leftIcon={<GameTypeIcon icon={gameType.icon} imageUrl={gameType.imageUrl} size={28} />}
							iconBgColor="#ffffff"
							selectionColor={PRIMARY_COLOR}
							isSelected={selectedGameTypeId === gameType.id}
							onPress={() => {
								setSelectedGameTypeId(gameType.id);
								closeModal();
							}}
							groupPosition={index === games.length - 1 ? 'bottom' : 'middle'}
						/>
					))}
				</View>
			),
		});
	}, [entries, gameTypes, selectedGameTypeId, showModal, closeModal]);

	const handleOpenFriendFilter = useCallback(() => {
		const counts = friendMatchCounts(entries);
		const rankedFriends = friends
			.filter((friend) => (counts.get(friend.id) ?? 0) > 0)
			.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
		showModal({
			title: '👤 Person auswählen',
			children: (
				<View style={styles.modalContent}>
					{rankedFriends.length === 0 ? (
						<Text style={styles.modalIntro}>Noch keine Partien mit gespeicherten Freunden.</Text>
					) : (
						rankedFriends.map((friend, index) => (
							<SettingsListSelectOptionSingle
								key={friend.id}
								nativeID={`${ComponentIds.STATS_FRIEND_FILTER_OPTION_PREFIX}${friend.id}`}
								label={`${friend.name} (${formatMatchCount(counts.get(friend.id) ?? 0)})`}
								leftIcon={<Ionicons name="person-outline" size={20} color="#ffffff" />}
								iconBgColor={friend.color}
								selectionColor={PRIMARY_COLOR}
								isSelected={effectiveFriendId === friend.id}
								onPress={() => {
									setSelectedFriendId(friend.id);
									closeModal();
								}}
								groupPosition={getGroupPosition(index, rankedFriends.length)}
							/>
						))
					)}
				</View>
			),
		});
	}, [entries, friends, effectiveFriendId, showModal, closeModal]);

	// ── Empty state ──
	if (entries.length === 0) {
		return (
			<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
				<View style={styles.emptyContainer}>
					<Ionicons name="stats-chart-outline" size={64} color={theme.screen.icon} />
					<Text style={[styles.emptyText, { color: theme.screen.text }]}>Noch keine Statistiken</Text>
					<Text style={[styles.emptySubtext, { color: theme.screen.placeholder }]}>
						Spiele deine erste Partie - danach findest du hier Spielzeiten, Serien und Rekorde.
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}>
				<View style={styles.statsRow}>
					<StatTile value={String(entries.length)} label={entries.length === 1 ? 'Partie' : 'Partien'} color={PRIMARY_COLOR} />
					<StatTile value={formatDuration(totalMinutes)} label="gespielt" color={SUCCESS_COLOR} />
					<StatTile value={String(playDayCount)} label={playDayCount === 1 ? 'Spieltag' : 'Spieltage'} color={TOOLS_COLOR} />
				</View>

				<SettingsListGroupTitle title="Aktivität" />
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_YEAR_ROW}
					label="Jahresübersicht"
					value={
						activeDaysLastYear === 1
							? 'An 1 Tag in den letzten 12 Monaten gespielt'
							: `An ${activeDaysLastYear} Tagen in den letzten 12 Monaten gespielt`
					}
					stackedValue
					leftIcon={<Ionicons name="calendar-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenYearOverview}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_STREAK_ROW}
					label="Serie"
					value={`Aktuell ${streaks.current === 1 ? '1 Tag' : `${streaks.current} Tage`} in Folge · Rekord: ${
						streaks.longest === 1 ? '1 Tag' : `${streaks.longest} Tage`
					}`}
					stackedValue
					leftIcon={<Ionicons name="flame-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_WEEKDAY_ROW}
					label="Lieblings-Wochentag"
					value={favoriteWeekday ? `${favoriteWeekday.name} (${formatMatchCount(favoriteWeekday.count)})` : '-'}
					leftIcon={<Ionicons name="bar-chart-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenWeekdays}
					groupPosition="bottom"
				/>

				<SettingsListGroupTitle title="Spielzeit" />
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_PLAYTIME_ROW}
					label="Stunden gespielt"
					value={`${formatDuration(totalMinutes)} insgesamt`}
					leftIcon={<Ionicons name="hourglass-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_GAME_FILTER_ROW}
					label="Spiel"
					value={selectedGameType ? selectedGameType.name : 'Alle Spiele'}
					leftIcon={<Ionicons name="funnel-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenGameFilter}
					groupPosition="middle"
				/>
				{durations.length > 0 ? (
					<SettingsListBoxplot
						nativeID={ComponentIds.STATS_SCREEN_DURATION_BOXPLOT}
						label="Dauer pro Partie"
						leftIcon={<MaterialCommunityIcons name="chart-box-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						stats={durationStats}
						formatValue={formatDuration}
						groupPosition="bottom"
					/>
				) : (
					<SettingsList
						label="Dauer pro Partie"
						value="Noch keine Partie mit erfasster Spielzeit"
						stackedValue
						leftIcon={<MaterialCommunityIcons name="chart-box-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						groupPosition="bottom"
					/>
				)}

				<SettingsListGroupTitle title="Spielzeit pro Person" />
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_FRIEND_FILTER_ROW}
					label="Person"
					value={
						selectedFriend
							? `${selectedFriend.name} · ${formatMatchCount(friendEntries.length)} · ${formatDuration(friendMinutes)}`
							: 'Noch keine Partien mit gespeicherten Freunden'
					}
					stackedValue
					leftIcon={<Ionicons name="person-outline" size={20} color="#ffffff" />}
					iconBgColor={selectedFriend?.color ?? TOOLS_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenFriendFilter}
					groupPosition="top"
				/>
				{selectedFriend && friendDurations.length > 0 ? (
					<SettingsListBoxplot
						nativeID={ComponentIds.STATS_SCREEN_FRIEND_BOXPLOT}
						label="Dauer pro Partie"
						leftIcon={<MaterialCommunityIcons name="chart-box-outline" size={20} color="#ffffff" />}
						iconBgColor={selectedFriend.color}
						stats={friendStats}
						formatValue={formatDuration}
						groupPosition="bottom"
					/>
				) : (
					<SettingsList
						label="Dauer pro Partie"
						value={
							selectedFriend
								? 'Noch keine Partie dieser Person mit erfasster Spielzeit'
								: 'Wähle eine Person, sobald Partien mit Freunden gespielt wurden'
						}
						stackedValue
						leftIcon={<MaterialCommunityIcons name="chart-box-outline" size={20} color="#ffffff" />}
						iconBgColor={TOOLS_COLOR}
						groupPosition="bottom"
					/>
				)}

				<SettingsListGroupTitle title="Ranglisten" />
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_TOP_GAMES_ROW}
					label="Top-Spiele"
					value="Welche Spiele am häufigsten auf den Tisch kommen"
					stackedValue
					leftIcon={<Ionicons name="podium-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenTopGames}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_TOP_FRIENDS_ROW}
					label="Häufigste Mitspieler"
					value="Mit wem am meisten gespielt wird"
					stackedValue
					leftIcon={<Ionicons name="people-outline" size={20} color="#ffffff" />}
					iconBgColor={TOOLS_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenTopFriends}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.STATS_SCREEN_WINS_ROW}
					label="Siegerliste"
					value="Wer die meisten Partien gewonnen hat"
					stackedValue
					leftIcon={<Ionicons name="trophy-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					rightIcon={CHEVRON}
					handleFunction={handleOpenWins}
					groupPosition="bottom"
				/>

				{recordRows.length > 0 && (
					<>
						<SettingsListGroupTitle title="Rekorde" />
						{recordRows.map((row, index) => (
							<SettingsList
								key={row.key}
								label={row.label}
								value={row.value}
								stackedValue
								leftIcon={<Ionicons name={row.icon as never} size={20} color="#ffffff" />}
								iconBgColor={TOOLS_COLOR}
								groupPosition={getGroupPosition(index, recordRows.length)}
							/>
						))}
					</>
				)}
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
	statsRow: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 8,
	},
	statTile: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 6,
		alignItems: 'center',
		gap: 2,
	},
	statValue: {
		fontSize: 20,
		fontWeight: '800',
		textAlign: 'center',
	},
	statLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
	modalContent: {
		padding: 10,
	},
	yearModalContent: {
		paddingVertical: 10,
	},
	modalIntro: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 12,
		color: '#9ca3af',
	},
	modalFootnote: {
		fontSize: 12,
		lineHeight: 17,
		marginTop: 10,
		color: '#9ca3af',
	},
	weekdayRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
	},
	weekdayName: {
		width: 90,
		fontSize: 14,
	},
	weekdayBarTrack: {
		flex: 1,
		height: 14,
		borderRadius: 7,
		overflow: 'hidden',
	},
	weekdayBarFill: {
		height: '100%',
		borderRadius: 7,
	},
	weekdayCount: {
		width: 28,
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'right',
	},
	gameIconWrapper: {
		marginRight: 12,
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
});
