import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoolean,
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
	setGameTypeImageUrl,
	setGameTypeScoringMode,
	setGameTypeMaxRounds,
	setGameTypeMaxScore,
	setGameTypeRules,
	setGameTypeStartingPlayerMode,
	setGameTypeTrackScores,
	setGameTypeVersion,
	updateGameTypeFromPreset,
	addGameTypeFromPreset,
	removeGameType,
} from '../../store/gameTypesSlice';
import { loadMatch, resetScores, setGameType } from '../../store/gameSlice';
import { archiveGame } from '../../store/gameHistorySlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { GameHistoryEntry, GameHistoryPlayerEntry } from '../../helpers/GameHistoryStorage';
import { buildHistoryEntry } from '../../helpers/GameHistoryStorage';
import type { ScoringMode, GameType } from '../../helpers/GameTypesStorage';
import type { StartingPlayerMode } from '../../helpers/GameRules';
import { gameTypeToPreset, parseGamePreset, STARTING_PLAYER_MODES, ROTATE_PLAYER_ORDER_RULE } from '../../helpers/GameRules';
import type { CategoryFilters, GameCategory, GameCategoryValues, MatchSort } from '../../helpers/GameCategories';
import {
	DEFAULT_MATCH_SORT,
	compareCategoryValues,
	formatCategoryValue,
	matchPassesFilters,
	resolveCategoryValues,
	summarizeCategoryValues,
} from '../../helpers/GameCategories';
import { ComponentIds } from '../../constants/ComponentIds';
import { generateId } from '../../helpers/RandomHelper';
import GameTypeIcon from '../../components/GameTypeIcon';
import { makeGameHeaderTitle } from '../../components/GameHeaderTitle';
import GameCategorySettings from '../../components/GameCategorySettings';
import { GameImagePickerContent, GameImageSearchHeader, ImageQueryObservable, defaultImageQuery } from '../../components/GameImagePicker';
import { findImageUrlForGameName } from '../../helpers/ImageSearch';
import { describeImageSize, isInlineImage } from '../../helpers/GameImageUpload';
import MatchFilterSort from '../../components/MatchFilterSort';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const DEBUG_COLOR = '#7c3aed';
const SUCCESS_COLOR = '#16a34a';

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper to determine groupPosition for list items
function getGroupPosition(index: number, total: number): 'top' | 'middle' | 'bottom' {
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/** Summary line of the "Sortieren & filtern" row, e.g. `Dauer ↑ · 2 Filter aktiv`. */
function describeSortAndFilters(categories: GameCategory[], sort: MatchSort, filters: CategoryFilters): string {
	const sortCategory = sort.categoryId ? categories.find((c) => c.id === sort.categoryId) : undefined;
	const sortName = sortCategory ? sortCategory.name : 'Datum';
	const arrow = sort.direction === 'asc' ? '↑' : '↓';
	const activeFilters = Object.keys(filters).length;
	if (activeFilters === 0) return `${sortName} ${arrow}`;
	return `${sortName} ${arrow} · ${activeFilters === 1 ? '1 Filter aktiv' : `${activeFilters} Filter aktiv`}`;
}

/**
 * Value line of one match row: the winner (only for games that are actually
 * scored) plus whatever the game's own match categories recorded.
 */
function describeMatchRow(
	match: Readonly<{ winnerName?: string; winnerScore: number; roundsCount: number; players: unknown[]; categorySummary: string }>,
	trackScores: boolean,
): string {
	const parts: string[] = [];
	// A game that isn't scored has no rounds at all (see `startGame`), so
	// neither a winner nor a round count says anything about such a match.
	if (trackScores) {
		if (match.winnerName) parts.push(`🏆 ${match.winnerName} (${match.winnerScore} Punkte)`);
		parts.push(match.roundsCount === 1 ? '1 Runde' : `${match.roundsCount} Runden`);
	} else {
		parts.push(match.players.length === 1 ? '1 Spieler' : `${match.players.length} Spieler`);
	}
	if (match.categorySummary) parts.push(match.categorySummary);
	return parts.join(' · ');
}

/** Everything of a match the search field looks at: date, participants and recorded values. */
function matchSearchText(
	match: Readonly<{ endedAt: number; players: { name: string }[]; categoryValues: GameCategoryValues }>,
	categories: GameCategory[],
): string {
	const values = categories.map((category) => formatCategoryValue(category, match.categoryValues[category.id]));
	return [formatDate(match.endedAt), ...match.players.map((player) => player.name), ...values].join(' ').toLowerCase();
}

/** What the "Bild" row shows as its value: where the game's picture comes from. */
function describeGameImage(imageUrl: string | null | undefined): string {
	if (!imageUrl) return 'Emoji';
	return isInlineImage(imageUrl) ? `Eigenes Bild (${describeImageSize(imageUrl)})` : 'Bild aus der Suche';
}

// ─── Scoring mode modal content (live-updating, subscribes to the store) ─────

function ScoringModeSection({ gameTypeId }: Readonly<{ gameTypeId: string }>) {
	const dispatch = useDispatch<AppDispatch>();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId));
	if (!gameType) return null;

	const options: { mode: ScoringMode; label: string; icon: React.ReactNode }[] = [
		{ mode: 'highWins', label: 'Viele Punkte gewinnen (mehr ist besser)', icon: <Ionicons name="trending-up-outline" size={20} color="#ffffff" /> },
		{ mode: 'lowWins', label: 'Wenige Punkte gewinnen (weniger ist besser)', icon: <Ionicons name="trending-down-outline" size={20} color="#ffffff" /> },
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

// ─── Starting-player mode modal content (live-updating, subscribes to the store) ──
//
// Three built-in modes (see GameRules `computeNextStartingPlayerIndex`) plus a
// "custom" escape hatch that hands the decision to `rules.playerOrder`, a
// small JSON expression tree edited via the "Code bearbeiten" field below -
// same reasoning as the score-entry rules above.

const STARTING_PLAYER_MODE_INFO: Record<StartingPlayerMode, { label: string; icon: React.ReactNode }> = {
	fixed: {
		label: 'Reihenfolge bleibt gleich',
		icon: <Ionicons name="reorder-three-outline" size={20} color="#ffffff" />,
	},
	previousWinner: {
		label: 'Bester der letzten Runde beginnt',
		icon: <Ionicons name="trophy-outline" size={20} color="#ffffff" />,
	},
	previousLoser: {
		label: 'Schlechtester der letzten Runde beginnt',
		icon: <MaterialCommunityIcons name="trophy-broken" size={20} color="#ffffff" />,
	},
	totalWinner: {
		label: 'Bester insgesamt beginnt',
		icon: <Ionicons name="podium-outline" size={20} color="#ffffff" />,
	},
	totalLoser: {
		label: 'Schlechtester insgesamt beginnt',
		icon: <MaterialCommunityIcons name="podium-bronze" size={20} color="#ffffff" />,
	},
	rotate: {
		label: 'Startspieler rotiert reihum',
		icon: <Ionicons name="sync-outline" size={20} color="#ffffff" />,
	},
	custom: {
		label: 'Benutzerdefiniert (JSON-Regel)',
		icon: <MaterialCommunityIcons name="code-json" size={20} color="#ffffff" />,
	},
};

/**
 * Modus-Label inklusive der Auflösung, was „Bester“/„Schlechtester“ bei der
 * aktuellen Wertung konkret bedeutet - bei „Wenige Punkte gewinnen“ (z.B.
 * Odin) ist der Rundenbeste, wer die *wenigsten* Punkte bekommen hat. Wer die
 * meisten Punkte der letzten Runde beginnen lassen will, wählt dort also
 * „Schlechtester der letzten Runde beginnt“.
 */
function startingPlayerModeLabel(mode: StartingPlayerMode, scoringMode: ScoringMode): string {
	const lowWins = scoringMode === 'lowWins';
	const bestPoints = lowWins ? 'wenigste' : 'meiste';
	const worstPoints = lowWins ? 'meiste' : 'wenigste';
	switch (mode) {
		case 'previousWinner':
			return `Bester der letzten Runde beginnt (${bestPoints} Punkte)`;
		case 'previousLoser':
			return `Schlechtester der letzten Runde beginnt (${worstPoints} Punkte)`;
		case 'totalWinner':
			return `Bester insgesamt beginnt (${bestPoints} Punkte)`;
		case 'totalLoser':
			return `Schlechtester insgesamt beginnt (${worstPoints} Punkte)`;
		default:
			return STARTING_PLAYER_MODE_INFO[mode].label;
	}
}

function StartingPlayerModeSection({ gameTypeId }: Readonly<{ gameTypeId: string }>) {
	const dispatch = useDispatch<AppDispatch>();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId));
	if (!gameType) return null;
	const mode: StartingPlayerMode = gameType.startingPlayerMode ?? 'fixed';

	return (
		<View style={styles.modalContent}>
			{STARTING_PLAYER_MODES.map((candidate, index) => (
				<SettingsListSelectOptionSingle
					key={candidate}
					nativeID={`${ComponentIds.GAME_STARTING_PLAYER_MODE_ROW_PREFIX}${candidate}`}
					label={startingPlayerModeLabel(candidate, gameType.scoringMode)}
					leftIcon={STARTING_PLAYER_MODE_INFO[candidate].icon}
					iconBgColor={PRIMARY_COLOR}
					isSelected={mode === candidate}
					onPress={() => {
						dispatch(setGameTypeStartingPlayerMode({ gameTypeId, startingPlayerMode: candidate }));
						// Seed a working default so "custom" is never left without a rule to evaluate.
						if (candidate === 'custom' && !gameType.rules?.playerOrder) {
							dispatch(
								setGameTypeRules({
									gameTypeId,
									rules: { version: 1, scoreEntry: gameType.rules?.scoreEntry, playerOrder: ROTATE_PLAYER_ORDER_RULE },
								}),
							);
						}
					}}
					groupPosition={getGroupPosition(index, STARTING_PLAYER_MODES.length)}
				/>
			))}
			<Text style={styles.startingPlayerHint}>
				„Bester“/„Schlechtester“ richtet sich nach der Wertung dieses Spiels - aktuell gewinnt, wer{' '}
				{gameType.scoringMode === 'lowWins' ? 'wenige' : 'viele'} Punkte hat.
			</Text>
			{mode === 'custom' && (
				<Text style={styles.startingPlayerHint}>
					Die Regel wird als „playerOrder“ im JSON unter „Code bearbeiten“ gepflegt (Felder: startIndex, nextState, initialState).
				</Text>
			)}
		</View>
	);
}

// ─── Match row (one archived game of this game type) ─────────────────────────

const MATCH_AVATAR_SIZE = 28;
const MAX_MATCH_AVATARS = 5;

function MatchParticipants({ players }: Readonly<{ players: GameHistoryPlayerEntry[] }>) {
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

function GameDetailBackButton({ color }: Readonly<{ color: string }>) {
	return (
		<TouchableOpacity
			nativeID={ComponentIds.GAME_DETAIL_BACK_BUTTON}
			onPress={() => router.replace('/games')}
			style={styles.headerBackButton}
		>
			<Ionicons name="arrow-back" size={24} color={color} />
		</TouchableOpacity>
	);
}

function makeGameDetailHeaderLeft(color: string) {
	return () => <GameDetailBackButton color={color} />;
}

// ─── Game detail screen ───────────────────────────────────────────────────────

// ─── Game settings (all the "how is this game played" rows) ───────────────────
//
// Shown inline on the detail screen while the game has never been played, and
// behind the header's gear button once it has - by then the screen is about the
// recorded matches, and the settings are a rarely used side trip. Subscribes to
// the store itself so it stays live in both places.

function GameTypeSettingsContent({
	gameTypeId,
	onGameTypeDeleted,
}: Readonly<{ gameTypeId: string; onGameTypeDeleted: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const gameType = useSelector((state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId));
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	// One picker for both kinds of "image": searched pictures (only their URL is
	// stored) and the emoji fallback. The search term lives in an observable so
	// the modal's sticky header and its content can share it.
	const handleOpenImageModal = useCallback(() => {
		if (!gameType) return;
		const observable = new ImageQueryObservable(defaultImageQuery(gameType.name));
		showModal({
			title: 'Bild wählen',
			stickyHeaderComponent: <GameImageSearchHeader observable={observable} />,
			children: <GameImagePickerContent gameTypeId={gameTypeId} observable={observable} onPicked={closeModal} />,
		});
	}, [showModal, closeModal, gameType, gameTypeId]);

	/**
	 * Naming a game that has no picture yet looks one up automatically: the
	 * first hit for "<name> Logo". Fire and forget - a failed lookup simply
	 * leaves the emoji in place.
	 */
	const handleRenameGameType = useCallback(
		(name: string) => {
			const trimmed = name.trim();
			dispatch(renameGameType({ gameTypeId, name: trimmed }));
			if (gameType?.imageUrl || trimmed === '') return;
			findImageUrlForGameName(trimmed)
				.then((imageUrl) => {
					if (imageUrl) dispatch(setGameTypeImageUrl({ gameTypeId, imageUrl }));
				})
				.catch(() => undefined);
		},
		[dispatch, gameTypeId, gameType?.imageUrl],
	);

	const handleOpenScoringModal = useCallback(() => {
		showModal({ title: 'Wertung', children: <ScoringModeSection gameTypeId={gameTypeId} /> });
	}, [showModal, gameTypeId]);

	const handleOpenStartingPlayerModal = useCallback(() => {
		showModal({ title: 'Startspieler', children: <StartingPlayerModeSection gameTypeId={gameTypeId} /> });
	}, [showModal, gameTypeId]);

	const handleCopyId = useCallback(async () => {
		await Clipboard.setStringAsync(gameTypeId);
	}, [gameTypeId]);

	const handleExportPreset = useCallback(async () => {
		if (!gameType) return;
		await Clipboard.setStringAsync(JSON.stringify(gameTypeToPreset(gameType), null, 2));
	}, [gameType]);

	const handleImportPreset = useCallback(
		(value: string) => {
			const preset = parseGamePreset(value);
			if (!preset) return;
			const action = dispatch(addGameTypeFromPreset(preset));
			router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
		},
		[dispatch],
	);

	// Only clears the score-entry rules (card picker) - a custom player-order
	// rule living in the same `rules` object, if any, is kept intact.
	const handleRemoveRules = useCallback(() => {
		if (!gameType) return;
		if (gameType.rules?.playerOrder) {
			dispatch(setGameTypeRules({ gameTypeId, rules: { version: 1, playerOrder: gameType.rules.playerOrder } }));
		} else {
			dispatch(setGameTypeRules({ gameTypeId, rules: null }));
		}
	}, [gameType, gameTypeId, dispatch]);

	const handleEditCode = useCallback(
		(value: string) => {
			const preset = parseGamePreset(value);
			if (!preset) return;
			dispatch(updateGameTypeFromPreset({ gameTypeId, preset }));
		},
		[gameTypeId, dispatch],
	);

	if (!gameType) return null;
	const trackScores = gameType.trackScores ?? true;

	return (
		<>
			<SettingsListTextInput
				nativeID={ComponentIds.GAME_DETAIL_NAME_ROW}
				label="Name"
				placeholder="Name eingeben"
				initialValue={gameType.name}
				value={gameType.name}
				onSave={handleRenameGameType}
				groupPosition="top"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_DETAIL_IMAGE_ROW}
				label="Bild"
				value={describeGameImage(gameType.imageUrl)}
				leftIconComponent={
					<View style={styles.gameIconWrapper}>
						<GameTypeIcon icon={gameType.icon} imageUrl={gameType.imageUrl} size={48} />
					</View>
				}
				rightIcon={<MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />}
				handleFunction={handleOpenImageModal}
				groupPosition="middle"
			/>
			<SettingsList
				label="Wertung"
				value={gameType.scoringMode === 'lowWins' ? 'Wenige Punkte gewinnen (weniger ist besser)' : 'Viele Punkte gewinnen (mehr ist besser)'}
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
			{/* A game without points has no rounds either, so the two round/score
			    limits only make sense while it is scored. */}
			{trackScores && (
				<>
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
							dispatch(setGameTypeMaxRounds({ gameTypeId, maxRounds: value }));
						}}
						allowDisable
						disableLabel="Unbegrenzt"
						onDisable={() => {
							dispatch(setGameTypeMaxRounds({ gameTypeId, maxRounds: null }));
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
							dispatch(setGameTypeMaxScore({ gameTypeId, maxScore: value }));
						}}
						allowDisable
						disableLabel="Unbegrenzt"
						onDisable={() => {
							dispatch(setGameTypeMaxScore({ gameTypeId, maxScore: null }));
						}}
						groupPosition="middle"
					/>
				</>
			)}
			<SettingsListNumberInput
				nativeID={ComponentIds.GAME_DETAIL_VERSION_ROW}
				label="Version"
				value={String(gameType.version ?? 1)}
				leftIcon={<MaterialCommunityIcons name="tag-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Version"
				placeholder="z.B. 1"
				initialValue={gameType.version ?? 1}
				min={1}
				max={999999}
				onSave={(value) => {
					dispatch(setGameTypeVersion({ gameTypeId, version: value }));
				}}
				groupPosition="middle"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_DETAIL_DELETE_BUTTON}
				label="Spiel löschen"
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={() => {
					dispatch(removeGameType(gameTypeId));
					onGameTypeDeleted();
				}}
				groupPosition="bottom"
			/>

			<SettingsListGroupTitle title="Spielregeln" />
			<SettingsListBoolean
				nativeID={ComponentIds.GAME_DETAIL_TRACK_SCORES_ROW}
				label="Punkte zählen"
				leftIcon={<MaterialCommunityIcons name="counter" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isEnabled={trackScores}
				valueActive="Spieler bekommen Punkte"
				valueInactive="Nur Kategorien, keine Runden"
				onToggle={() => dispatch(setGameTypeTrackScores({ gameTypeId, trackScores: !trackScores }))}
				groupPosition="top"
			/>
			{trackScores && (
				<SettingsList
					label="Punkte-Eingabe"
					value={gameType.rules?.scoreEntry ? 'Kartenauswahl' : 'Zahleneingabe (Standard)'}
					leftIcon={<MaterialCommunityIcons name={gameType.rules?.scoreEntry ? 'cards-outline' : 'numeric'} size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					groupPosition="middle"
				/>
			)}
			<SettingsList
				nativeID={ComponentIds.GAME_DETAIL_STARTING_PLAYER_ROW}
				label="Startspieler"
				value={startingPlayerModeLabel(gameType.startingPlayerMode ?? 'fixed', gameType.scoringMode)}
				leftIcon={<Ionicons name="person-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleOpenStartingPlayerModal}
				groupPosition={gameType.rules?.scoreEntry ? 'middle' : 'bottom'}
			/>
			{gameType.rules?.scoreEntry && (
				<SettingsList
					label="Regeln entfernen"
					value="Zurück zur Zahleneingabe"
					leftIcon={<Ionicons name="close-circle-outline" size={20} color="#ffffff" />}
					iconBgColor={DANGER_COLOR}
					handleFunction={handleRemoveRules}
					groupPosition="bottom"
				/>
			)}

			<SettingsListGroupTitle title="Kategorien" />
			<GameCategorySettings gameTypeId={gameTypeId} />

			<SettingsListGroupTitle title="Code" />
			<SettingsListTextInput
				nativeID={ComponentIds.GAME_DETAIL_CODE_EDIT_ROW}
				label="Code bearbeiten"
				leftIcon={<MaterialCommunityIcons name="code-json" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Code bearbeiten"
				placeholder='{"name": "...", "icon": "🃏", "scoringMode": "highWins", "rules": {...}}'
				initialValue={JSON.stringify(gameTypeToPreset(gameType), null, 2)}
				saveLabel="Übernehmen"
				multiline
				numberOfLines={16}
				textAlignVertical="top"
				checkTextInput={(value) => ({ isValid: parseGamePreset(value) !== null, value })}
				onSave={handleEditCode}
				groupPosition="single"
			/>

			<SettingsListGroupTitle title="Spiel als Vorlage teilen" />
			<SettingsList
				nativeID={ComponentIds.GAME_DETAIL_EXPORT_ROW}
				label="Dieses Spiel exportieren"
				value={gameType.name}
				leftIcon={<Ionicons name="share-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={handleExportPreset}
				groupPosition="top"
			/>
			<SettingsListTextInput
				nativeID={ComponentIds.GAMES_IMPORT_PRESET_ROW}
				label="Spiel importieren"
				leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Spiel importieren"
				placeholder='{"name": "...", "icon": "🃏", "scoringMode": "highWins", "rules": {...}}'
				saveLabel="Importieren"
				multiline
				numberOfLines={10}
				textAlignVertical="top"
				checkTextInput={(value) => ({ isValid: parseGamePreset(value) !== null, value })}
				onSave={handleImportPreset}
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
		</>
	);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function GameDetailHeaderRight({ color, onOpenSettings }: Readonly<{ color: string; onOpenSettings: () => void }>) {
	return (
		<TouchableOpacity
			nativeID={ComponentIds.GAME_DETAIL_SETTINGS_BUTTON}
			onPress={onOpenSettings}
			style={styles.headerButton}
		>
			<Ionicons name="settings-outline" size={22} color={color} />
		</TouchableOpacity>
	);
}

function makeGameDetailHeaderRight(color: string, onOpenSettings: () => void) {
	return () => <GameDetailHeaderRight color={color} onOpenSettings={onOpenSettings} />;
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
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	// Match list search/sorting/filtering. Kept as local screen state (not
	// persisted): it's a way of looking at the list, not part of the game.
	const [searchQuery, setSearchQuery] = useState('');
	const [matchFilters, setMatchFilters] = useState<CategoryFilters>({});
	const [matchSort, setMatchSort] = useState<MatchSort>(DEFAULT_MATCH_SORT);
	const [showFilters, setShowFilters] = useState(false);

	const categories: GameCategory[] = useMemo(() => gameType?.categories ?? [], [gameType]);
	const trackScores = gameType?.trackScores ?? true;

	// The match currently being played, if it belongs to this game. It is not in
	// the history yet (that happens when it is replaced or ended), but it is a
	// match of this game all the same - so it shows up in the list, on top and
	// marked as running, and tapping it jumps straight back into it.
	const runningMatch = useMemo(() => {
		if (!gameType || activeGame.status !== 'active' || activeGame.gameTypeId !== gameType.id) return null;
		if (activeGame.players.length === 0) return null;
		return buildHistoryEntry(activeGame, { id: activeGame.matchId ?? 'running', endedAt: Date.now() });
	}, [gameType, activeGame]);

	const allMatchEntries = useMemo(() => {
		if (!gameType) return [];
		const archived = historyEntries.filter((entry) => entry.gameTypeId === gameType.id && entry.id !== runningMatch?.id);
		return runningMatch ? [runningMatch, ...archived] : archived;
	}, [historyEntries, gameType, runningMatch]);

	// A game that has never been played shows its settings right away - that's
	// the "just created it, set it up" case. From the first recorded match on,
	// the screen is about those matches and the settings move into the header.
	const hasMatches = allMatchEntries.length > 0;

	const matches = useMemo(() => {
		if (!gameType) return [];
		const sortCategory = matchSort.categoryId ? categories.find((c) => c.id === matchSort.categoryId) : undefined;
		const directionFactor = matchSort.direction === 'asc' ? 1 : -1;
		const query = searchQuery.trim().toLowerCase();

		return allMatchEntries
			.filter((entry) =>
				matchPassesFilters({
					categories,
					filters: matchFilters,
					matchValues: entry.categoryValues,
					playerValues: entry.playerCategoryValues,
				}),
			)
			.map((entry) => {
				const ranked = [...entry.players].sort((a, b) => {
					const scoreA = entry.finalScores[a.playerId] ?? 0;
					const scoreB = entry.finalScores[b.playerId] ?? 0;
					return gameType.scoringMode === 'lowWins' ? scoreA - scoreB : scoreB - scoreA;
				});
				const winner = ranked[0];
				return {
					id: entry.id,
					entry,
					isRunning: entry.id === runningMatch?.id,
					endedAt: entry.endedAt,
					roundsCount: entry.roundsCount,
					players: entry.players,
					winnerName: winner ? winner.name : undefined,
					winnerScore: winner ? entry.finalScores[winner.playerId] ?? 0 : 0,
					categoryValues: resolveCategoryValues(categories, entry.categoryValues),
					categorySummary: summarizeCategoryValues(
						categories.filter((c) => c.scope === 'match'),
						entry.categoryValues,
					),
				};
			})
			.filter((match) => query === '' || matchSearchText(match, categories).includes(query))
			.sort((a, b) => {
				if (!sortCategory) return (a.endedAt - b.endedAt) * directionFactor;
				const byCategory = compareCategoryValues(
					sortCategory,
					a.categoryValues[sortCategory.id],
					b.categoryValues[sortCategory.id],
				);
				// Equal category values keep the newest match first, so the list
				// never jumps around between renders.
				if (byCategory !== 0) return byCategory * directionFactor;
				return b.endedAt - a.endedAt;
			});
	}, [allMatchEntries, gameType, categories, matchFilters, matchSort, searchQuery, runningMatch]);

	const handleOpenSettingsModal = useCallback(() => {
		if (!gameType) return;
		showModal({
			title: '⚙️ Einstellungen',
			children: (
				<View style={styles.modalContent}>
					<GameTypeSettingsContent
						gameTypeId={gameType.id}
						onGameTypeDeleted={() => {
							closeModal();
							router.replace('/games');
						}}
					/>
				</View>
			),
		});
	}, [showModal, closeModal, gameType]);

	// Header: back arrow to the games list (drawer navigators have no reliable
	// push history, so navigate explicitly - same reasoning as the old friend
	// detail screen). The gear only appears once the settings have moved out of
	// the screen body.
	useLayoutEffect(() => {
		navigation.setOptions({
			title: gameType ? `${gameType.icon} ${gameType.name}` : 'Spiel',
			headerTitle: gameType ? makeGameHeaderTitle(gameType.name, gameType.icon, gameType.imageUrl) : undefined,
			headerLeft: makeGameDetailHeaderLeft(theme.header.text),
			headerRight: hasMatches ? makeGameDetailHeaderRight(theme.header.text, handleOpenSettingsModal) : undefined,
		});
	}, [navigation, theme.header.text, gameType, hasMatches, handleOpenSettingsModal]);

	/** Archive whatever is currently being played, so it isn't lost when the game state is replaced. */
	const archiveRunningMatch = useCallback(() => {
		if (activeGame.status !== 'active' || activeGame.players.length === 0) return;
		dispatch(
			archiveGame(buildHistoryEntry(activeGame, { id: activeGame.matchId ?? generateId(), endedAt: Date.now() })),
		);
	}, [activeGame, dispatch]);

	// Start a new match of this game: archive a still-running match first (it
	// keeps its own game type), then reuse the current player list in the setup
	// phase with this game type preselected.
	const handleStartMatch = useCallback(() => {
		if (!gameType) return;
		archiveRunningMatch();
		// A new match starts with empty seats - the players are picked in the
		// setup phase instead of carrying over the previous match's roster.
		dispatch(resetScores({ clearPlayers: true }));
		dispatch(setGameType(gameType.id));
		router.push('/');
	}, [gameType, archiveRunningMatch, dispatch]);

	// Tapping a match returns to it: the running one is already loaded, an
	// archived one is loaded back into the game state (and keeps its id, so
	// playing on updates its own history entry).
	const handleOpenMatch = useCallback(
		(entry: GameHistoryEntry, isRunning: boolean) => {
			if (!isRunning) {
				archiveRunningMatch();
				dispatch(loadMatch(entry));
			}
			router.push('/');
		},
		[archiveRunningMatch, dispatch],
	);

	if (!gameType) {
		return (
			<View style={[styles.emptyContainer, { backgroundColor: theme.screen.background }]}>
				<Text style={{ color: theme.screen.text }}>Spiel nicht gefunden.</Text>
			</View>
		);
	}

	const matchCountTitle =
		matches.length === allMatchEntries.length
			? `Partien (${matches.length})`
			: `Partien (${matches.length} von ${allMatchEntries.length})`;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				contentContainerStyle={[
					styles.listContent,
					{ paddingBottom: insets.bottom + 32, paddingLeft: insets.left, paddingRight: insets.right },
				]}
			>
				{!hasMatches && (
					<GameTypeSettingsContent gameTypeId={gameType.id} onGameTypeDeleted={() => router.replace('/games')} />
				)}

				<SettingsListGroupTitle title={matchCountTitle} />
				<SettingsList
					nativeID={ComponentIds.GAME_DETAIL_START_MATCH_BUTTON}
					label="Neue Partie starten"
					leftIcon={<Ionicons name="play-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleStartMatch}
					groupPosition={hasMatches && categories.length > 0 ? 'top' : 'single'}
				/>
				{hasMatches && categories.length > 0 && (
					<SettingsList
						nativeID={ComponentIds.GAME_DETAIL_FILTER_TOGGLE}
						label="Sortieren & filtern"
						value={describeSortAndFilters(categories, matchSort, matchFilters)}
						stackedValue
						leftIcon={<Ionicons name="funnel-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						rightIcon={<Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />}
						handleFunction={() => setShowFilters((value) => !value)}
						groupPosition="bottom"
					/>
				)}
				{hasMatches && (
					<View style={[styles.searchBar, { backgroundColor: theme.screen.iconBg }]}>
						<Ionicons name="search-outline" size={18} color={theme.screen.icon} />
						<TextInput
							nativeID={ComponentIds.GAME_DETAIL_SEARCH_INPUT}
							style={[styles.searchInput, { color: theme.screen.text }]}
							placeholder="Partie suchen"
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
				)}
				{hasMatches && categories.length > 0 && showFilters && (
					<MatchFilterSort
						categories={categories}
						filters={matchFilters}
						onFiltersChange={setMatchFilters}
						sort={matchSort}
						onSortChange={setMatchSort}
					/>
				)}
				{matches.length === 0 ? (
					<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
						{allMatchEntries.length === 0 ? 'Noch keine Partien gespielt.' : 'Keine Partie passt zur Suche.'}
					</Text>
				) : (
					matches.map((match, index) => (
						<SettingsList
							key={match.id}
							nativeID={`${ComponentIds.GAME_DETAIL_MATCH_ROW_PREFIX}${match.id}`}
							label={match.isRunning ? `${formatDate(match.endedAt)} · läuft` : formatDate(match.endedAt)}
							value={describeMatchRow(match, trackScores)}
							stackedValue
							leftIcon={<Ionicons name={match.isRunning ? 'play-circle-outline' : 'calendar-outline'} size={20} color="#ffffff" />}
							iconBgColor={match.isRunning ? SUCCESS_COLOR : PRIMARY_COLOR}
							rightElement={<MatchParticipants players={match.players} />}
							handleFunction={() => handleOpenMatch(match.entry, match.isRunning)}
							groupPosition={getGroupPosition(index, matches.length)}
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
	headerButton: {
		padding: 4,
		marginRight: 8,
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 40,
		marginTop: 12,
		marginBottom: 4,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		height: '100%',
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
	startingPlayerHint: {
		fontSize: 12,
		color: '#9ca3af',
		paddingHorizontal: 10,
		paddingTop: 10,
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
