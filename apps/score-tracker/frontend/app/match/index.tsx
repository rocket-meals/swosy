import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

// BottomSheetTextInput's blur handler calls RNTextInput.State.currentlyFocusedInput(),
// which react-native-web doesn't implement - it throws when the input loses focus
// (e.g. after tapping "Save"). Fall back to the plain TextInput on web, matching the
// same platform check already used by repo-depkit-common-ui's SettingsListTextInput.
const ResolvedScoreTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;
import { Ionicons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListTextInput,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	SettingsListAvatar,
	MyAvatar,
	useMyScrollViewModal,
	useTheme,
	MyColorPicker,
	myContrastColor,
	AvatarStyle,
} from 'repo-depkit-common-ui';
import type { AvatarConfig } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { router, useNavigation } from 'expo-router';
import {
	addGuestPlayer,
	addFriendPlayer,
	renamePlayer,
	setPlayerColor,
	setPlayerAvatar,
	linkPlayerToFriend,
	setGameType,
	setStartedAt,
	setEndedAt,
	setCategoryValue,
	setPlayerCategoryValue,
	movePlayer,
	removePlayer,
	setScore,
	setCardSelection,
	startGame,
	goToPreviousRound,
	goToNextRound,
	reopenMatch,
	resetScores,
} from '../../store/gameSlice';
import { addFriendFromPlayer } from '../../store/friendsSlice';
import { addGameType } from '../../store/gameTypesSlice';
import { archiveGame, removeGameFromHistory } from '../../store/gameHistorySlice';
import { setColumnsPortrait, setColumnsLandscape } from '../../store/appSettingsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { PLAYER_COLORS } from '../../helpers/GameStorage';
import type { Player } from '../../helpers/GameStorage';
import type { GameType } from '../../helpers/GameTypesStorage';
import { buildHistoryEntry, hasRecordedResults } from '../../helpers/GameHistoryStorage';
import { buildMatchShareBundle, encodeShareBundle } from '../../helpers/ShareCodec';
import type { Friend } from '../../helpers/FriendsStorage';
import { ComponentIds } from '../../constants/ComponentIds';
import { logDebug } from '../../helpers/DebugLogger';
import { generateId } from '../../helpers/RandomHelper';
import GameTypeIcon from '../../components/GameTypeIcon';
import { makeGameHeaderTitle } from '../../components/GameHeaderTitle';
import CardScoreEntryModal from '../../components/CardScoreEntryModal';
import ShareExportContent from '../../components/ShareExportContent';
import CategoryValueRows from '../../components/CategoryValueRows';
import { computeNextStartingPlayerIndex } from '../../helpers/GameRules';
import type { GameCategory } from '../../helpers/GameCategories';
import { categoriesForScope, formatDuration, resolveCategoryValues, summarizeCategoryValues } from '../../helpers/GameCategories';
import { durationMinutesBetween, formatTimestampAsDateTime, parseDateTimeInput } from '../../helpers/MatchTimes';
import { countLabel } from '../../helpers/CountLabel';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const WARNING_COLOR = '#f59e0b';
const SUCCESS_COLOR = '#16a34a';

// Avatar preview sizes (50% larger than the original design across the board).
const EDIT_AVATAR_SIZE = 60;
const PICKER_AVATAR_SIZE = 48;

const TILE_GAP = 10;

// Helper to determine groupPosition for list items
function getGroupPosition(index: number, total: number): 'top' | 'middle' | 'bottom' {
	if (total === 1 || index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/** Day a finished match ended, for the view-only banner (same format as the Partien list). */
function formatEndedAtDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Score Input Modal Content ────────────────────────────────────────────────

const QUICK_SCORES = [-5, -1, 0, 1, 5];

function ScoreInputContent({
	initialValue,
	onSave,
}: Readonly<{
	initialValue: number | null;
	onSave: (value: number | null) => void;
}>) {
	const { theme } = useTheme();
	const [signMode, setSignMode] = useState<'plus' | 'minus'>(
		initialValue != null && initialValue < 0 ? 'minus' : 'plus',
	);
	const [text, setText] = useState(initialValue != null ? String(Math.abs(initialValue)) : '');

	const handleSave = useCallback(() => {
		if (text.trim() === '') {
			onSave(null);
			return;
		}
		const num = Number.parseInt(text, 10);
		if (Number.isNaN(num)) {
			onSave(null);
			return;
		}
		onSave(signMode === 'minus' ? -Math.abs(num) : Math.abs(num));
	}, [text, signMode, onSave]);

	const handleQuickScore = useCallback(
		(delta: number) => {
			const currentNum = text.trim() === '' ? 0 : Number.parseInt(text, 10) || 0;
			const currentSigned = signMode === 'minus' ? -Math.abs(currentNum) : Math.abs(currentNum);
			const newValue = delta === 0 ? 0 : currentSigned + delta;
			if (newValue < 0) {
				setSignMode('minus');
				setText(String(Math.abs(newValue)));
			} else {
				setSignMode('plus');
				setText(String(newValue));
			}
		},
		[text, signMode],
	);

	return (
		<View style={styles.scoreInputContainer}>
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
			<View style={[styles.scoreInputField, { backgroundColor: theme.screen.background, borderColor: theme.screen.border }]}>
				<Text style={[styles.scoreInputSign, { color: signMode === 'minus' ? DANGER_COLOR : PRIMARY_COLOR }]}>
					{signMode === 'minus' ? '−' : '+'}
				</Text>
				<View style={styles.scoreInputTextWrapper}>
					<ResolvedScoreTextInput
						style={[styles.scoreInputNative, { color: theme.screen.text }]}
						value={text}
						onChangeText={setText}
						keyboardType="number-pad"
						autoFocus
						placeholder="0"
						placeholderTextColor={theme.screen.border}
						returnKeyType="done"
						onSubmitEditing={handleSave}
					/>
				</View>
			</View>
			<TouchableOpacity
				id={ComponentIds.GAME_SCORE_INPUT_SAVE_BUTTON}
				style={[styles.scoreInputSaveButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleSave}
				activeOpacity={0.8}
			>
				<Text style={styles.scoreInputSaveText}>Save</Text>
			</TouchableOpacity>
			<View style={styles.quickButtonsRow}>
				{QUICK_SCORES.map((v) => {
					let quickButtonBackground = theme.screen.border + '40';
					let quickButtonBorder = theme.screen.border;
					let quickButtonTextColor = theme.screen.text;
					if (v < 0) {
						quickButtonBackground = DANGER_COLOR + '20';
						quickButtonBorder = DANGER_COLOR;
						quickButtonTextColor = DANGER_COLOR;
					} else if (v > 0) {
						quickButtonBackground = PRIMARY_COLOR + '20';
						quickButtonBorder = PRIMARY_COLOR;
						quickButtonTextColor = PRIMARY_COLOR;
					}
					return (
						<TouchableOpacity
							key={v}
							style={[
								styles.quickButton,
								{
									backgroundColor: quickButtonBackground,
									borderColor: quickButtonBorder,
								},
							]}
							onPress={() => handleQuickScore(v)}
							activeOpacity={0.7}
						>
							<Text style={[styles.quickButtonText, { color: quickButtonTextColor }]}>
								{v > 0 ? `+${v}` : String(v)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

// ─── Custom category sections (see helpers/GameCategories) ────────────────────
//
// Both sections subscribe to the store themselves so their rows update live -
// the player one is rendered inside a modal, where a closure-captured value
// would otherwise keep showing whatever was recorded at open-time.

/**
 * One editable built-in time row (Startzeit/Endzeit): renders exactly like a
 * category value row - a plain value row when read-only, otherwise a text
 * input taking `TT.MM.JJJJ HH:MM` with a "Jetzt" shortcut, where an empty
 * input clears the value again.
 */
function MatchTimeRow({
	nativeID,
	label,
	icon,
	timestamp,
	emptyHint,
	onSave,
	groupPosition,
}: Readonly<{
	nativeID: string;
	label: string;
	icon: React.ReactNode;
	timestamp: number | undefined;
	/** Shown as the row value while nothing is recorded (instead of a bare dash). */
	emptyHint: string;
	onSave: (timestamp: number | null) => void;
	groupPosition: 'top' | 'middle' | 'bottom' | 'single';
}>) {
	const value = timestamp != null ? formatTimestampAsDateTime(timestamp) : emptyHint;

	return (
		<SettingsListTextInput
			nativeID={nativeID}
			label={label}
			value={value}
			leftIcon={icon}
			iconBgColor={PRIMARY_COLOR}
			modalTitle={label}
			placeholder="TT.MM.JJJJ HH:MM"
			keyboardType="numbers-and-punctuation"
			saveLabel="Übernehmen"
			initialValue={timestamp != null ? formatTimestampAsDateTime(timestamp) : ''}
			// An empty input clears the value again; anything else has to be a
			// real date + time before it can be saved.
			checkTextInput={(next) => ({ isValid: next.trim() === '' || parseDateTimeInput(next) != null, value: next })}
			suggestions={[{ key: 'now', value: formatTimestampAsDateTime(Date.now()), label: `Jetzt (${formatTimestampAsDateTime(Date.now())})` }]}
			onSave={(next) => onSave(parseDateTimeInput(next))}
			groupPosition={groupPosition}
		/>
	);
}

/**
 * The built-in start/end/duration rows of the running or finished match (see
 * helpers/MatchTimes) - always all three, behaving like a category trio with
 * a computed duration: the start is stamped when the match starts, the end
 * when it is ended, both stay editable like any category value (finished
 * matches included - edits sync back into the archive), and the duration is
 * derived.
 */
function MatchTimeRows() {
	const dispatch = useDispatch<AppDispatch>();
	const startedAt = useSelector((state: RootState) => state.game.startedAt);
	const endedAt = useSelector((state: RootState) => state.game.endedAt);
	const storedDuration = useSelector((state: RootState) => state.game.durationMinutes);

	// While the match runs (no end recorded yet), the duration keeps counting
	// from the start; a recorded end fixes it.
	const duration = storedDuration ?? durationMinutesBetween(startedAt, endedAt ?? Date.now());
	let durationValue = 'Ergibt sich aus Startzeit → Endzeit';
	if (duration != null) {
		durationValue = `${formatDuration(duration)}${endedAt == null ? ' (läuft)' : ''}`;
	}

	return (
		<>
			<MatchTimeRow
				nativeID={ComponentIds.GAME_MATCH_STARTED_AT_ROW}
				label="Startzeit"
				icon={<Ionicons name="play-outline" size={20} color="#ffffff" />}
				timestamp={startedAt}
				emptyHint="—"
				onSave={(next) => dispatch(setStartedAt(next))}
				groupPosition="top"
			/>
			<MatchTimeRow
				nativeID={ComponentIds.GAME_MATCH_ENDED_AT_ROW}
				label="Endzeit"
				icon={<Ionicons name="stop-outline" size={20} color="#ffffff" />}
				timestamp={endedAt}
				emptyHint="Wird beim Beenden gesetzt"
				onSave={(next) => dispatch(setEndedAt(next))}
				groupPosition="middle"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_MATCH_DURATION_ROW}
				label="Dauer"
				value={durationValue}
				leftIcon={<Ionicons name="hourglass-outline" size={20} color="#ffffff" />}
				iconBgColor="#6b7280"
				groupPosition="bottom"
			/>
		</>
	);
}

function MatchCategorySection({ categories, gameTypeId }: Readonly<{ categories: GameCategory[]; gameTypeId?: string }>) {
	const dispatch = useDispatch<AppDispatch>();
	const values = useSelector((state: RootState) => state.game.categoryValues);
	const status = useSelector((state: RootState) => state.game.status);
	const matchCategories = useMemo(() => categoriesForScope(categories, 'match'), [categories]);
	const resolved = useMemo(() => resolveCategoryValues(categories, values), [categories, values]);

	// The built-in times exist from the moment the match starts - in the setup
	// phase there is nothing stamped yet.
	const showTimeRows = status !== 'setup';
	if (matchCategories.length === 0 && !showTimeRows) return null;

	return (
		<View style={styles.categorySection}>
			<SettingsListGroupTitle title="Spielinfos" />
			{showTimeRows && <MatchTimeRows />}
			<CategoryValueRows
				categories={matchCategories}
				values={resolved}
				allCategories={categories}
				gameTypeId={gameTypeId}
				onChange={(categoryId, value) => dispatch(setCategoryValue({ categoryId, value }))}
			/>
		</View>
	);
}

function PlayerCategorySection({
	playerId,
	categories,
	gameTypeId,
}: Readonly<{ playerId: string; categories: GameCategory[]; gameTypeId?: string }>) {
	const dispatch = useDispatch<AppDispatch>();
	const values = useSelector((state: RootState) => state.game.playerCategoryValues?.[playerId]);
	const playerCategories = useMemo(() => categoriesForScope(categories, 'player'), [categories]);
	const resolved = useMemo(() => resolveCategoryValues(categories, values), [categories, values]);

	if (playerCategories.length === 0) return null;

	return (
		<View style={styles.modalContent}>
			<CategoryValueRows
				categories={playerCategories}
				values={resolved}
				allCategories={categories}
				gameTypeId={gameTypeId}
				onChange={(categoryId, value) => dispatch(setPlayerCategoryValue({ playerId, categoryId, value }))}
			/>
		</View>
	);
}

/**
 * "Mehr Infos" block of the player entry modal: the player's totals in this
 * match plus the way into the full player editor (name, color, avatar).
 * Subscribes to the store itself so the numbers update live while the modal
 * stays open.
 */
function PlayerMatchInfoSection({
	playerId,
	trackScores,
	onEditPlayer,
}: Readonly<{ playerId: string; trackScores: boolean; onEditPlayer: () => void }>) {
	const player = useSelector((state: RootState) => state.game.players.find((p) => p.id === playerId));
	const rounds = useSelector((state: RootState) => state.game.rounds);

	if (!player) return null;

	let total = 0;
	let scoredRounds = 0;
	for (const round of rounds) {
		const score = round.scores[player.id];
		if (score != null) {
			total += score;
			scoredRounds += 1;
		}
	}

	return (
		<View style={styles.modalContent}>
			<SettingsListGroupTitle title="Spieler" />
			{trackScores && (
				<SettingsList
					nativeID={`${ComponentIds.GAME_PLAYER_INFO_TOTAL_PREFIX}${player.id}`}
					label="Gesamtpunkte"
					value={`${total} Punkte · ${countLabel(scoredRounds, 'gewertete Runde', 'gewertete Runden')}`}
					leftIcon={<Ionicons name="podium-outline" size={20} color="#ffffff" />}
					iconBgColor="#6b7280"
					groupPosition="top"
				/>
			)}
			<SettingsList
				nativeID={`${ComponentIds.GAME_PLAYER_INFO_EDIT_PREFIX}${player.id}`}
				label="Spieler bearbeiten"
				value="Name, Farbe und Avatar"
				leftIcon={<Ionicons name="person-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={onEditPlayer}
				groupPosition={trackScores ? 'bottom' : 'single'}
			/>
		</View>
	);
}

// ─── Player score row (active game, scoreboard view) ──────────────────────────
//
// Single column: full screen width, so the shared SettingsListAvatar row
// (avatar left, name+score stacked to its right) has plenty of room.
//
// Multi-column: that same row layout squeezes the name into a narrow column
// next to the large avatar, wrapping awkwardly (or even character-by-
// character - see the SettingsList minWidth:0 fix). Stacking the avatar on
// top of the name instead gives the name the tile's *full* width to wrap
// into, so this renders a bespoke vertical "card" layout instead of going
// through SettingsListAvatar once a tileWidth is set.

const TILE_AVATAR_SIZE = 84;
const MISSING_SCORE_BORDER = 'rgba(255,255,255,0.85)';

function PlayerTile({
	playerId,
	name,
	scoreLabel,
	compactValue,
	color,
	avatarConfig,
	isLeader,
	isRoundStarter,
	hasScore,
	onPress,
	tileWidth,
}: Readonly<{
	playerId: string;
	name: string;
	/** Either the player's total score, or - for games without points - a summary of their recorded categories. */
	scoreLabel: string;
	/** Renders `scoreLabel` in a smaller font, for the multi-word category summary. */
	compactValue: boolean;
	color: string;
	avatarConfig?: AvatarConfig;
	isLeader: boolean;
	/** Whether this player starts the currently viewed round (see GameRules `startingPlayerMode`). */
	isRoundStarter: boolean;
	hasScore: boolean;
	onPress: () => void;
	tileWidth?: number;
}>) {
	const { theme, isDark } = useTheme();
	const textColor = myContrastColor(color, theme, isDark);
	const nativeID = `${ComponentIds.GAME_PLAYER_TILE_PREFIX}${playerId}`;

	if (tileWidth === undefined) {
		return (
			<View style={styles.tileWrapper}>
				<SettingsListAvatar
					nativeID={nativeID}
					config={avatarConfig}
					onPressOverride={onPress}
					label={name}
					value={scoreLabel}
					stackedValue
					previewSize={TILE_AVATAR_SIZE}
					avatarBackgroundColor="#ffffff"
					backgroundColor={color}
					titleColor={textColor}
					valueColor={textColor}
					titleFontSize={20}
					valueFontSize={compactValue ? 15 : 26}
					borderColor={hasScore ? undefined : MISSING_SCORE_BORDER}
					borderWidth={hasScore ? undefined : 2.5}
					borderStyle="dashed"
					rightIcon={isLeader ? <Ionicons name="trophy" size={24} color="#fbbf24" /> : <View style={styles.rightIconPlaceholder} />}
					groupPosition="single"
					showSeparator={false}
				/>
				{isRoundStarter && (
					<View style={styles.starterBadge}>
						<Ionicons name="play" size={12} color="#ffffff" />
					</View>
				)}
			</View>
		);
	}

	return (
		<TouchableOpacity
			id={nativeID}
			onPress={onPress}
			activeOpacity={0.8}
			style={[
				styles.verticalTile,
				{ width: tileWidth, backgroundColor: color },
				!hasScore && styles.verticalTileMissingScore,
			]}
		>
			{isLeader && (
				<View style={styles.verticalTileTrophy}>
					<Ionicons name="trophy" size={20} color="#fbbf24" />
				</View>
			)}
			{isRoundStarter && (
				<View style={styles.starterBadge}>
					<Ionicons name="play" size={12} color="#ffffff" />
				</View>
			)}
			<MyAvatar style={avatarConfig?.style} options={avatarConfig?.options} size={TILE_AVATAR_SIZE} rounded backgroundColor="#ffffff" />
			<Text style={[styles.verticalTileName, { color: textColor }]} numberOfLines={2} ellipsizeMode="tail">
				{name}
			</Text>
			<Text style={[styles.verticalTileScore, compactValue && styles.verticalTileScoreCompact, { color: textColor }]} numberOfLines={3}>
				{scoreLabel}
			</Text>
		</TouchableOpacity>
	);
}

// ─── Player edit modal content (opened via the pencil on a player row) ───────
//
// Mirrors the friends screen's "Freund bearbeiten" modal: avatar, name, color,
// save-as-friend (guests) and delete live here instead of inline rows in the
// setup list. Subscribes to the store itself so the rows update live while
// the modal stays open.

function PlayerEditContent({ playerId, onClose }: Readonly<{ playerId: string; onClose: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const player = useSelector((state: RootState) => state.game.players.find((p) => p.id === playerId));
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const { show: showColorModal, close: closeColorModal } = useMyScrollViewModal();

	const handleOpenColorModal = useCallback(() => {
		if (!player) return;
		showColorModal({
			title: 'Farbe wählen',
			children: (
				<MyColorPicker
					colors={PLAYER_COLORS}
					selectedColor={player.color}
					onSelect={(color) => {
						dispatch(setPlayerColor({ playerId, color }));
						closeColorModal();
					}}
				/>
			),
		});
	}, [showColorModal, closeColorModal, player, playerId, dispatch]);

	// Save a guest player to the friends roster and link them, so future edits
	// stay in sync and the player can be re-added from the roster next time.
	const handleSaveAsFriend = useCallback(() => {
		if (!player) return;
		const action = dispatch(
			addFriendFromPlayer({ name: player.name, color: player.color, avatarConfig: player.avatarConfig }),
		);
		dispatch(linkPlayerToFriend({ playerId, friendId: action.payload.id }));
	}, [player, playerId, dispatch]);

	if (!player) {
		return <Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>Spieler nicht gefunden.</Text>;
	}

	return (
		<View style={styles.modalContent}>
			<SettingsListAvatar
				config={player.avatarConfig}
				onChange={(config) => {
					logDebug(`game: avatar onChange player=${player.id} style=${config.style}`);
					dispatch(setPlayerAvatar({ playerId, avatarConfig: config }));
				}}
				label="Avatar"
				previewSize={EDIT_AVATAR_SIZE}
				avatarBackgroundColor={player.color}
				groupPosition="top"
				editorOptions={{
					title: 'Avatar',
					allowedStyles: [AvatarStyle.AVATAAARS],
					// Debug-Modus (Settings → 5x auf Version tippen) blendet im QuickStart
					// zusätzliche Touch-Test-Buttons ein (siehe QuickstartDebugSection).
					debugMode,
					onDebugEvent: (event) => logDebug(`game: avatar-editor ${event} player=${player.id}`),
				}}
			/>
			<SettingsListTextInput
				label="Name"
				placeholder="Name eingeben"
				initialValue={player.name}
				value={player.name}
				onSave={(name) => {
					dispatch(renamePlayer({ playerId, name }));
				}}
				groupPosition="middle"
			/>
			<SettingsList
				label="Farbe"
				leftIcon={<Ionicons name="color-palette-outline" size={20} color="#ffffff" />}
				iconBgColor={player.color}
				handleFunction={handleOpenColorModal}
				groupPosition="middle"
			/>
			{!player.friendId && (
				<SettingsList
					nativeID={`${ComponentIds.GAME_PLAYER_ROW_SAVE_FRIEND_PREFIX}${player.id}`}
					label="Als Freund speichern"
					leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					handleFunction={handleSaveAsFriend}
					groupPosition="middle"
				/>
			)}
			<SettingsList
				nativeID={`${ComponentIds.GAME_PLAYER_ROW_DELETE_PREFIX}${player.id}`}
				label="Spieler löschen"
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={() => {
					dispatch(removePlayer(playerId));
					onClose();
				}}
				groupPosition="bottom"
			/>
		</View>
	);
}

// ─── Player row (setup phase + header "Spieler bearbeiten" mode) ─────────────
//
// Compact, friends-screen-style row: avatar and name, with reorder arrows and
// an edit pencil on the right. Everything else (name, color, avatar, delete)
// moved into the PlayerEditContent modal behind the pencil.

function PlayerSetupRow({
	player,
	index,
	total,
	onEdit,
}: Readonly<{
	player: Player;
	index: number;
	total: number;
	onEdit: () => void;
}>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const canMoveUp = index > 0;
	const canMoveDown = index < total - 1;

	return (
		<SettingsListAvatar
			nativeID={`${ComponentIds.GAME_PLAYER_ROW_PREFIX}${player.id}`}
			config={player.avatarConfig}
			avatarBackgroundColor={player.color}
			previewSize={PICKER_AVATAR_SIZE}
			label={player.name}
			onPressOverride={onEdit}
			rightIcon={
				<View style={styles.selectedPlayerActions}>
					<TouchableOpacity
						id={`${ComponentIds.GAME_PLAYER_ROW_MOVE_UP_PREFIX}${player.id}`}
						onPress={() => dispatch(movePlayer({ playerId: player.id, direction: 'up' }))}
						disabled={!canMoveUp}
						hitSlop={8}
						style={styles.reorderButton}
					>
						<Ionicons name="chevron-up" size={20} color={canMoveUp ? theme.screen.text : theme.screen.border} />
					</TouchableOpacity>
					<TouchableOpacity
						id={`${ComponentIds.GAME_PLAYER_ROW_MOVE_DOWN_PREFIX}${player.id}`}
						onPress={() => dispatch(movePlayer({ playerId: player.id, direction: 'down' }))}
						disabled={!canMoveDown}
						hitSlop={8}
						style={styles.reorderButton}
					>
						<Ionicons name="chevron-down" size={20} color={canMoveDown ? theme.screen.text : theme.screen.border} />
					</TouchableOpacity>
					<TouchableOpacity
						id={`${ComponentIds.GAME_PLAYER_ROW_EDIT_PREFIX}${player.id}`}
						onPress={onEdit}
						hitSlop={8}
						style={styles.reorderButton}
					>
						<Ionicons name="pencil-outline" size={18} color={theme.screen.text} />
					</TouchableOpacity>
				</View>
			}
			groupPosition={getGroupPosition(index, total)}
		/>
	);
}

// ─── Columns settings section (settings modal) ────────────────────────────────
//
// Rendered as its own component (rather than JSX built inline in a callback)
// so it re-renders from its own `useSelector` subscription and the selected
// option updates live while the modal stays open - a plain closure-captured
// JSX tree would keep showing the option that was selected at open-time.

function ColumnsSettingsSection() {
	const dispatch = useDispatch<AppDispatch>();
	const columnsPortrait = useSelector((state: RootState) => state.appSettings.columnsPortrait);
	const columnsLandscape = useSelector((state: RootState) => state.appSettings.columnsLandscape);

	return (
		<>
			<SettingsListGroupTitle title="Spalten (Hochformat)" />
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAME_SETTINGS_COLUMNS_PORTRAIT_1}
				label="1 Spalte"
				leftIcon={<Ionicons name="reorder-four-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={columnsPortrait === 1}
				onPress={() => dispatch(setColumnsPortrait(1))}
				groupPosition="top"
			/>
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAME_SETTINGS_COLUMNS_PORTRAIT_2}
				label="2 Spalten"
				leftIcon={<Ionicons name="grid-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={columnsPortrait === 2}
				onPress={() => dispatch(setColumnsPortrait(2))}
				groupPosition="bottom"
			/>
			<SettingsListGroupTitle title="Spalten (Querformat)" />
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAME_SETTINGS_COLUMNS_LANDSCAPE_1}
				label="1 Spalte"
				leftIcon={<Ionicons name="reorder-four-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={columnsLandscape === 1}
				onPress={() => dispatch(setColumnsLandscape(1))}
				groupPosition="top"
			/>
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAME_SETTINGS_COLUMNS_LANDSCAPE_2}
				label="2 Spalten"
				leftIcon={<Ionicons name="grid-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={columnsLandscape === 2}
				onPress={() => dispatch(setColumnsLandscape(2))}
				groupPosition="bottom"
			/>
		</>
	);
}

// ─── Player management (settings modal) ───────────────────────────────────────
//
// Adding and removing players used to hang off the header; both now live here,
// next to the rest of what can be done to the running match. Connected to the
// store so the list updates while the modal stays open.

/** How long a deselected player stays visible (grayed out) before actually leaving the match - the tap can be undone until then. */
const PENDING_REMOVAL_DELAY_MS = 2000;

function AddPlayerContent({
	onDone,
	insertAtStart,
}: Readonly<{
	onDone: () => void;
	/** Seats newly added players first instead of last (the setup screen's top add button). */
	insertAtStart?: boolean;
}>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const players = useSelector((state: RootState) => state.game.players);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const [friendSearch, setFriendSearch] = useState('');
	const { show: showPlayerEditModal, close: closePlayerEditModal } = useMyScrollViewModal();

	const handleEditPlayer = useCallback(
		(playerId: string) => {
			showPlayerEditModal({
				title: 'Spieler bearbeiten',
				children: <PlayerEditContent playerId={playerId} onClose={closePlayerEditModal} />,
			});
		},
		[showPlayerEditModal, closePlayerEditModal],
	);

	// Tapping a selected row doesn't remove the player immediately: the row
	// first turns gray, and only after PENDING_REMOVAL_DELAY_MS the player
	// leaves the match. Tapping the gray row again cancels the removal.
	const [pendingRemovalIds, setPendingRemovalIds] = useState<string[]>([]);
	const removalTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	const togglePendingRemoval = useCallback(
		(playerId: string) => {
			const timer = removalTimersRef.current[playerId];
			if (timer) {
				clearTimeout(timer);
				delete removalTimersRef.current[playerId];
				setPendingRemovalIds((ids) => ids.filter((id) => id !== playerId));
				return;
			}
			setPendingRemovalIds((ids) => [...ids, playerId]);
			removalTimersRef.current[playerId] = setTimeout(() => {
				delete removalTimersRef.current[playerId];
				setPendingRemovalIds((ids) => ids.filter((id) => id !== playerId));
				dispatch(removePlayer(playerId));
			}, PENDING_REMOVAL_DELAY_MS);
		},
		[dispatch],
	);

	// Content unmounting with removals still pending (e.g. the modal is torn
	// down right after a tap): they were meant to go, so remove them right away
	// instead of letting the tap silently evaporate.
	useEffect(
		() => () => {
			for (const [playerId, timer] of Object.entries(removalTimersRef.current)) {
				clearTimeout(timer);
				dispatch(removePlayer(playerId));
			}
			removalTimersRef.current = {};
		},
		[dispatch],
	);

	// Selected friends live in the top section, so the friends list below only
	// offers the remaining ones - grayed out with a plus, i.e. "not selected".
	const selectedFriendIds = new Set(players.map((p) => p.friendId).filter((id): id is string => !!id));
	const query = friendSearch.trim().toLowerCase();
	const availableFriends = friends.filter(
		(f) => !selectedFriendIds.has(f.id) && (!query || f.name.toLowerCase().includes(query)),
	);

	return (
		<View style={styles.modalContent}>
			<SettingsListGroupTitle title={`Ausgewählte Spieler (${players.length})`} />
			{players.length === 0 && (
				<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
					Noch keine Spieler ausgewählt. Wähle unten Freunde aus oder füge einen Gast hinzu.
				</Text>
			)}
			{players.map((player, index) => {
				const pendingRemoval = pendingRemovalIds.includes(player.id);
				return (
					<View key={player.id} style={pendingRemoval ? styles.pendingRemovalRow : undefined}>
						<SettingsListAvatar
							nativeID={`${ComponentIds.GAME_ADD_PLAYER_SELECTED_ROW_PREFIX}${player.id}`}
							config={player.avatarConfig}
							avatarBackgroundColor={player.color}
							previewSize={PICKER_AVATAR_SIZE}
							label={player.name}
							onPressOverride={() => togglePendingRemoval(player.id)}
							rightIcon={
								<View style={styles.selectedPlayerActions}>
									<TouchableOpacity
										id={`${ComponentIds.GAME_ADD_PLAYER_MOVE_UP_PREFIX}${player.id}`}
										onPress={() => dispatch(movePlayer({ playerId: player.id, direction: 'up' }))}
										disabled={index === 0}
										hitSlop={8}
										style={styles.reorderButton}
									>
										<Ionicons name="chevron-up" size={20} color={index === 0 ? theme.screen.border : theme.screen.text} />
									</TouchableOpacity>
									<TouchableOpacity
										id={`${ComponentIds.GAME_ADD_PLAYER_MOVE_DOWN_PREFIX}${player.id}`}
										onPress={() => dispatch(movePlayer({ playerId: player.id, direction: 'down' }))}
										disabled={index === players.length - 1}
										hitSlop={8}
										style={styles.reorderButton}
									>
										<Ionicons
											name="chevron-down"
											size={20}
											color={index === players.length - 1 ? theme.screen.border : theme.screen.text}
										/>
									</TouchableOpacity>
									<TouchableOpacity
										id={`${ComponentIds.GAME_ADD_PLAYER_EDIT_PREFIX}${player.id}`}
										onPress={() => handleEditPlayer(player.id)}
										hitSlop={8}
										style={styles.reorderButton}
									>
										<Ionicons name="pencil-outline" size={18} color={theme.screen.text} />
									</TouchableOpacity>
								</View>
							}
							groupPosition={getGroupPosition(index, players.length)}
						/>
					</View>
				);
			})}
			<SettingsList
				nativeID={ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON}
				label="Gast hinzufügen"
				leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={() => dispatch(addGuestPlayer(insertAtStart ? { atStart: true } : undefined))}
				groupPosition="single"
			/>
			<SettingsListGroupTitle title="Freunde" />
			{friends.length > 0 && (
				<View style={[styles.modalSearchBar, { backgroundColor: theme.screen.iconBg }]}>
					<Ionicons name="search-outline" size={18} color={theme.screen.icon} />
					<TextInput
						nativeID={ComponentIds.GAME_ADD_PLAYER_SEARCH_INPUT}
						style={[styles.modalSearchInput, { color: theme.screen.text }]}
						placeholder="Freund suchen"
						placeholderTextColor={theme.screen.placeholder}
						value={friendSearch}
						onChangeText={setFriendSearch}
						returnKeyType="search"
						autoCorrect={false}
					/>
					{friendSearch.length > 0 && (
						<TouchableOpacity onPress={() => setFriendSearch('')} hitSlop={8}>
							<Ionicons name="close-circle" size={18} color={theme.screen.icon} />
						</TouchableOpacity>
					)}
				</View>
			)}
			{friends.length === 0 && (
				<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
					Keine Freunde verfügbar. Lege welche im Spieler-Bereich an oder füge einen Gast hinzu.
				</Text>
			)}
			{friends.length > 0 && availableFriends.length === 0 && (
				<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
					{query ? `Kein Freund gefunden für „${friendSearch}“.` : 'Alle Freunde sind bereits ausgewählt.'}
				</Text>
			)}
			{availableFriends.map((friend: Friend, index) => (
				<View key={friend.id} style={styles.unselectedFriendRow}>
					<SettingsListAvatar
						nativeID={`${ComponentIds.GAME_ADD_PLAYER_FRIEND_ROW_PREFIX}${friend.id}`}
						config={friend.avatarConfig}
						avatarBackgroundColor={friend.color}
						previewSize={PICKER_AVATAR_SIZE}
						label={friend.name}
						rightIcon={<Ionicons name="add-circle-outline" size={22} color="#ffffff" />}
						onPressOverride={() => dispatch(addFriendPlayer({ friend, atStart: insertAtStart }))}
						groupPosition={getGroupPosition(index, availableFriends.length)}
					/>
				</View>
			))}
		</View>
	);
}

function MatchPlayersSection({ onEditPlayers }: Readonly<{ onEditPlayers: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const players = useSelector((state: RootState) => state.game.players);
	const { show, close } = useMyScrollViewModal();

	const handleAddPlayer = useCallback(() => {
		show({ title: 'Spieler hinzufügen', children: <AddPlayerContent onDone={close} /> });
	}, [show, close]);

	return (
		<>
			<SettingsListGroupTitle title={`Spieler (${players.length})`} />
			{players.length === 0 && (
				<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>Noch keine Spieler in dieser Partie.</Text>
			)}
			{players.map((player, index) => (
				<SettingsListAvatar
					key={player.id}
					nativeID={`${ComponentIds.GAME_SETTINGS_PLAYER_ROW_PREFIX}${player.id}`}
					config={player.avatarConfig}
					avatarBackgroundColor={player.color}
					previewSize={PICKER_AVATAR_SIZE}
					label={player.name}
					onPressOverride={onEditPlayers}
					rightIcon={
						<TouchableOpacity
							id={`${ComponentIds.GAME_SETTINGS_PLAYER_REMOVE_PREFIX}${player.id}`}
							onPress={() => dispatch(removePlayer(player.id))}
							hitSlop={8}
						>
							<Ionicons name="trash-outline" size={20} color={DANGER_COLOR} />
						</TouchableOpacity>
					}
					groupPosition={index === 0 ? 'top' : 'middle'}
				/>
			))}
			<SettingsList
				nativeID={ComponentIds.GAME_SETTINGS_ADD_PLAYER}
				label="Spieler hinzufügen"
				leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={handleAddPlayer}
				groupPosition="middle"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_SETTINGS_EDIT_PLAYERS}
				label="Spieler bearbeiten"
				value="Name, Farbe, Avatar und Reihenfolge"
				leftIcon={<Ionicons name="people-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={onEditPlayers}
				groupPosition="bottom"
			/>
		</>
	);
}

// ─── Match options (settings modal: end/reopen/reset/delete the match) ───────
//
// Subscribes to the store itself so ending a match always archives the *live*
// state. These rows used to be built inline in the settings-modal callback,
// which captured a stale `game` snapshot - "Partie beenden" then archived (or,
// via the hasRecordedResults guard, silently discarded) an outdated copy of
// the match, wiping the entered rounds and players from the saved entry.

function MatchOptionsSection({ onClose }: Readonly<{ onClose: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const game = useSelector((state: RootState) => state.game);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const selectedGameType = game.gameTypeId ? gameTypes.find((g) => g.id === game.gameTypeId) : undefined;
	const trackScores = selectedGameType?.trackScores ?? true;
	const { show: showExportModal } = useMyScrollViewModal();

	/**
	 * Share this Partie: the match itself plus its Spiel and the participating
	 * Freunde as one export string (see helpers/ShareCodec), offered via the
	 * export modal (copy to clipboard or platform share sheet). The snapshot
	 * uses the same builder as archiving, but doesn't archive anything.
	 */
	const handleExportMatch = useCallback(() => {
		const entry = buildHistoryEntry(game, { id: game.matchId ?? generateId(), endedAt: game.endedAt ?? Date.now() });
		const bundle = buildMatchShareBundle({ entry, gameType: selectedGameType, friends });
		showExportModal({
			title: 'Partie exportieren',
			children: (
				<ShareExportContent
					text={encodeShareBundle(bundle)}
					info="Der Export enthält diese Partie, das Spiel und die teilnehmenden Freunde als Text. Ein anderer Spieler kann ihn auf dem Start-Screen über „Partie importieren“ einfügen - Spiel und Freunde werden dabei mit angelegt, falls sie noch fehlen."
				/>
			),
		});
	}, [game, selectedGameType, friends, showExportModal]);

	/**
	 * Mark the match's rounds as finished: archive the match (it appears as
	 * beendet in its game's Partien list, viewable from there) and open the
	 * follow-up match right away - same game, same players, back in the setup
	 * phase. A match nothing was recorded in is discarded instead of archived.
	 */
	const handleEndMatch = useCallback(() => {
		if (hasRecordedResults(game)) {
			// A manually entered/corrected Endzeit wins over the current moment
			// (see the built-in time rows) - clearing it re-stamps on ending.
			dispatch(archiveGame(buildHistoryEntry(game, { id: game.matchId ?? generateId(), endedAt: game.endedAt ?? Date.now() })));
		}
		dispatch(resetScores());
		onClose();
	}, [game, dispatch, onClose]);

	/** Put a finished (view-only) match back into play - the counterpart of "Partie beenden". */
	const handleReopenMatch = useCallback(() => {
		dispatch(reopenMatch());
		onClose();
	}, [dispatch, onClose]);

	/**
	 * Throw away the match currently open - including its archived entry, if it
	 * was opened from the history - and start over from the setup phase with
	 * the same game preselected. The seats are emptied too: the next match
	 * picks its players fresh instead of inheriting this one's roster.
	 */
	const handleDeleteMatch = useCallback(() => {
		if (game.matchId) dispatch(removeGameFromHistory(game.matchId));
		dispatch(resetScores({ clearPlayers: true }));
		onClose();
	}, [game.matchId, dispatch, onClose]);

	if (game.status === 'setup') return null;

	return (
		<>
			<SettingsListGroupTitle title="Partie" />
			<SettingsList
				nativeID={ComponentIds.GAME_SETTINGS_EXPORT_MATCH}
				label="Partie exportieren"
				leftIcon={<Ionicons name="share-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleExportMatch}
				groupPosition="top"
			/>
			{game.status === 'active' && (
				<SettingsList
					nativeID={ComponentIds.GAME_SETTINGS_END_MATCH}
					label="Partie beenden"
					value="Runden werden als beendet markiert und die Partie gespeichert"
					stackedValue
					leftIcon={<Ionicons name="flag-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					handleFunction={handleEndMatch}
					groupPosition="middle"
				/>
			)}
			{game.status === 'finished' && (
				<SettingsList
					nativeID={ComponentIds.GAME_SETTINGS_REOPEN_MATCH}
					label="Partie wieder öffnen"
					value="Entfernt das Beendet-Flag - die Partie läuft weiter und kann neue Runden bekommen"
					stackedValue
					leftIcon={<Ionicons name="lock-open-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					handleFunction={handleReopenMatch}
					groupPosition="middle"
				/>
			)}
			{game.status === 'active' && trackScores && (
				<SettingsList
					nativeID={ComponentIds.GAME_SETTINGS_RESET_SCORES}
					label="Alle Punkte zurücksetzen"
					value="Spieler bleiben, alle Runden werden geleert"
					stackedValue
					leftIcon={<Ionicons name="refresh-outline" size={20} color="#ffffff" />}
					iconBgColor={WARNING_COLOR}
					handleFunction={() => {
						dispatch(resetScores());
						onClose();
					}}
					groupPosition="middle"
				/>
			)}
			{/* Replaces the old "Neues Spiel": that left open whether it
			    reset or deleted the match. This one only ever deletes. */}
			<SettingsList
				nativeID={ComponentIds.GAME_SETTINGS_DELETE_MATCH}
				label="Partie löschen"
				value="Diese Partie wird verworfen und aus der Liste des Spiels entfernt"
				stackedValue
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={handleDeleteMatch}
				groupPosition="bottom"
			/>
		</>
	);
}

// ─── Game type selector (setup phase modal) ───────────────────────────────────
//
// Rendered as its own component so it re-renders from its own `useSelector`
// subscription and the selected option updates live while the modal is open
// (same pattern as ColumnsSettingsSection).

function GameTypeSelectSection({ onDone }: Readonly<{ onDone: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const gameTypeId = useSelector((state: RootState) => state.game.gameTypeId);

	const handleCreateGameType = useCallback(() => {
		const action = dispatch(addGameType(`Spiel ${gameTypes.length + 1}`));
		dispatch(setGameType(action.payload.id));
		onDone();
		// Jump straight into the new game's detail screen so name/icon/rules
		// can be filled in right away.
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [dispatch, gameTypes.length, onDone]);

	return (
		<View style={styles.modalContent}>
			<SettingsListSelectOptionSingle
				nativeID={ComponentIds.GAME_TYPE_SELECT_NONE}
				label="Kein bestimmtes Spiel"
				leftIcon={<Ionicons name="game-controller-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				isSelected={!gameTypeId}
				onPress={() => {
					dispatch(setGameType(undefined));
					onDone();
				}}
				groupPosition={gameTypes.length === 0 ? 'single' : 'top'}
			/>
			{gameTypes.map((gameType, index) => (
				<SettingsListSelectOptionSingle
					key={gameType.id}
					nativeID={`${ComponentIds.GAME_TYPE_SELECT_ROW_PREFIX}${gameType.id}`}
					label={gameType.name}
					leftIcon={<GameTypeIcon icon={gameType.icon} imageUrl={gameType.imageUrl} size={28} />}
					iconBgColor="#ffffff"
					selectionColor={PRIMARY_COLOR}
					isSelected={gameTypeId === gameType.id}
					onPress={() => {
						dispatch(setGameType(gameType.id));
						onDone();
					}}
					groupPosition={index === gameTypes.length - 1 ? 'bottom' : 'middle'}
				/>
			))}
			<SettingsListGroupTitle title="Neu" />
			<SettingsList
				nativeID={ComponentIds.GAME_TYPE_SELECT_CREATE}
				label="Neues Spiel erstellen"
				leftIcon={<Ionicons name="add-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={handleCreateGameType}
				groupPosition="single"
			/>
		</View>
	);
}

// ─── Game Screen ──────────────────────────────────────────────────────────────

// Everything that acts on the match itself (add/remove players, delete the
// match) lives in the settings modal - the header only opens it.
function GameHeaderRight({ color, onOpenSettings }: Readonly<{ color: string; onOpenSettings: () => void }>) {
	return (
		<View style={styles.headerButtons}>
			<TouchableOpacity
				id={ComponentIds.GAME_HEADER_SETTINGS_BUTTON}
				onPress={onOpenSettings}
				style={styles.headerButton}
			>
				<Ionicons name="settings-outline" size={22} color={color} />
			</TouchableOpacity>
		</View>
	);
}

function makeGameHeaderRight(color: string, onOpenSettings: () => void) {
	return () => <GameHeaderRight color={color} onOpenSettings={onOpenSettings} />;
}

/**
 * While the match belongs to a game, the burger is replaced by a back arrow
 * leading to that game - the match was opened from there, so that's where
 * "back" goes. Without a game there is nothing to go back to and the drawer
 * button stays.
 */
function GameHeaderBackButton({ color, gameTypeId }: Readonly<{ color: string; gameTypeId: string }>) {
	return (
		<TouchableOpacity
			id={ComponentIds.GAME_HEADER_BACK_BUTTON}
			onPress={() => router.replace({ pathname: '/games/[id]', params: { id: gameTypeId } })}
			style={styles.headerBackButton}
		>
			<Ionicons name="arrow-back" size={24} color={color} />
		</TouchableOpacity>
	);
}

function makeGameHeaderLeft(color: string, gameTypeId: string) {
	return () => <GameHeaderBackButton color={color} gameTypeId={gameTypeId} />;
}

/** Label for the "next round" navigation button. */
function resolveNextRoundLabel(params: {
	matchFinished: boolean;
	maxRounds: number | null;
	currentRoundNumber: number;
	/** Viewing an archived match read-only (see `GameStatus`'s `finished`). */
	isFinishedView: boolean;
	roundsCount: number;
}): string {
	const { matchFinished, maxRounds, currentRoundNumber, isFinishedView, roundsCount } = params;
	if (isFinishedView) {
		return currentRoundNumber >= roundsCount ? 'Partie beendet' : `Runde ${currentRoundNumber + 1}`;
	}
	if (matchFinished) {
		return 'Spiel beendet';
	}
	if (maxRounds != null && currentRoundNumber >= maxRounds) {
		return 'Letzte Runde';
	}
	return `Runde ${currentRoundNumber + 1}`;
}

/**
 * Derived, purely presentational values for the setup-row/finished-banner/
 * round-nav bar, computed from state that's already resolved earlier in
 * `GameScreen`. Extracted so the many independent ternaries don't all count
 * toward `GameScreen`'s own cognitive complexity.
 */
function resolveGameScreenDisplayValues({
	selectedGameType,
	leaderId,
	players,
	currentRoundIndex,
	maxRounds,
	isLastPossibleRound,
}: {
	selectedGameType: GameType | undefined;
	leaderId: string | null;
	players: Player[];
	currentRoundIndex: number;
	maxRounds: number | null;
	isLastPossibleRound: boolean;
}) {
	const gameTypeRowValue = selectedGameType ? selectedGameType.name : 'Kein bestimmtes Spiel';
	const gameTypeRowIconComponent = selectedGameType ? (
		<View style={styles.gameTypeIconWrapper}>
			<GameTypeIcon icon={selectedGameType.icon} imageUrl={selectedGameType.imageUrl} size={40} />
		</View>
	) : undefined;
	const gameTypeRowLeftIcon = selectedGameType ? undefined : <Ionicons name="game-controller-outline" size={20} color="#ffffff" />;
	const finishedBannerWinnerSuffix = leaderId ? ` von ${players.find((p) => p.id === leaderId)?.name}` : '';
	const startButtonOpacity = players.length === 0 ? 0.5 : 1;
	const prevRoundOpacity = currentRoundIndex === 0 ? 0.4 : 1;
	const maxRoundsSuffix = maxRounds != null ? ` / ${maxRounds}` : '';
	const nextRoundOpacity = isLastPossibleRound ? 0.4 : 1;
	return {
		gameTypeRowValue,
		gameTypeRowIconComponent,
		gameTypeRowLeftIcon,
		finishedBannerWinnerSuffix,
		startButtonOpacity,
		prevRoundOpacity,
		maxRoundsSuffix,
		nextRoundOpacity,
	};
}

export default function GameScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const players = useSelector((state: RootState) => state.game.players);
	const rounds = useSelector((state: RootState) => state.game.rounds);
	const endedAt = useSelector((state: RootState) => state.game.endedAt);
	const status = useSelector((state: RootState) => state.game.status);
	const currentRoundIndex = useSelector((state: RootState) => state.game.currentRoundIndex);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const gameTypeId = useSelector((state: RootState) => state.game.gameTypeId);
	const playerOrderState = useSelector((state: RootState) => state.game.playerOrderState);
	const playerCategoryValues = useSelector((state: RootState) => state.game.playerCategoryValues);
	const columnsPortrait = useSelector((state: RootState) => state.appSettings.columnsPortrait);
	const columnsLandscape = useSelector((state: RootState) => state.appSettings.columnsLandscape);

	const { show: showScoreModal, close: closeScoreModal } = useMyScrollViewModal();
	const { show: showAddPlayerModal, close: closeAddPlayerModal } = useMyScrollViewModal();
	const { show: showSettingsModal, close: closeSettingsModal } = useMyScrollViewModal();
	const { show: showGameTypeModal, close: closeGameTypeModal } = useMyScrollViewModal();
	const { show: showPlayerEditModal, close: closePlayerEditModal } = useMyScrollViewModal();
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const navigation = useNavigation();

	const [isEditingPlayers, setIsEditingPlayers] = useState(false);

	// Leaving the setup phase always drops back into the scoreboard view.
	const prevStatusRef = useRef(status);
	useEffect(() => {
		if (prevStatusRef.current === 'setup' && status === 'active') {
			setIsEditingPlayers(false);
		}
		prevStatusRef.current = status;
	}, [status]);

	// "Beendet" only flags the match and fixes its duration - everything stays
	// editable, and edits sync straight back into the archived entry (see the
	// auto-persist in store.ts).
	const isFinishedView = status === 'finished';
	const showEditRows = status === 'setup' || isEditingPlayers;

	const selectedGameType = useMemo(
		() => (gameTypeId ? gameTypes.find((g) => g.id === gameTypeId) : undefined),
		[gameTypes, gameTypeId],
	);
	const maxRounds = selectedGameType?.maxRounds ?? null;
	const maxScore = selectedGameType?.maxScore ?? null;
	const scoringMode = selectedGameType?.scoringMode ?? 'highWins';
	// Custom tracked categories of the selected game (see helpers/GameCategories).
	// `trackScores: false` games are recorded purely through their player-scope
	// categories, so the tiles show those instead of a point total.
	const categories = useMemo<GameCategory[]>(() => selectedGameType?.categories ?? [], [selectedGameType]);
	const playerCategories = useMemo(() => categoriesForScope(categories, 'player'), [categories]);
	const trackScores = selectedGameType?.trackScores ?? true;

	// Landscape detection and column count (independently configurable per orientation)
	const isLandscape = windowWidth > windowHeight;
	const columnCount = isLandscape ? columnsLandscape : columnsPortrait;

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

	// Find leader. With the default "highWins" scoring the highest total leads;
	// game types with "lowWins" (e.g. golf-style card games) invert this.
	const leaderId = useMemo(() => {
		if (players.length === 0 || !trackScores) return null;
		const anyScoreEntered = rounds.some((round) => players.some((p) => round.scores[p.id] != null));
		if (!anyScoreEntered) return null;
		let bestScore = scoringMode === 'lowWins' ? Infinity : -Infinity;
		let bestId: string | null = null;
		for (const player of players) {
			const total = totals[player.id] ?? 0;
			const isBetter = scoringMode === 'lowWins' ? total < bestScore : total > bestScore;
			if (isBetter) {
				bestScore = total;
				bestId = player.id;
			}
		}
		// With "highWins", keep the crown hidden until someone is actually in
		// the plus (matches the previous behavior).
		if (scoringMode === 'highWins' && bestScore <= 0) return null;
		return bestId;
	}, [players, rounds, totals, scoringMode, trackScores]);

	// A match is over once any player's total reaches the game type's optional
	// max score - independent of scoringMode (both "first to X" and
	// "bust at X" games use a target/limit score this way).
	const matchFinished = useMemo(() => {
		if (maxScore == null || !trackScores) return false;
		return players.some((player) => (totals[player.id] ?? 0) >= maxScore);
	}, [maxScore, players, totals, trackScores]);

	const currentRound = rounds[currentRoundIndex] ?? null;
	const currentRoundNumber = currentRoundIndex + 1;
	// A finished match only blocks *advancing past the end* - paging forward
	// through already-played rounds (after having gone back) must keep working.
	// In the view-only finished state the last recorded round is always the end.
	const isLastPossibleRound =
		((matchFinished || isFinishedView) && currentRoundIndex >= rounds.length - 1) ||
		(maxRounds != null && currentRoundNumber >= maxRounds);

	// Label for the "next round" navigation button
	const nextRoundLabel = resolveNextRoundLabel({
		matchFinished,
		maxRounds,
		currentRoundNumber,
		isFinishedView,
		roundsCount: rounds.length,
	});

	// Tile width, only needed once a multi-column layout is active
	const tileWidth = useMemo(() => {
		if (columnCount === 1) return undefined;
		const availableWidth = windowWidth - insets.left - insets.right;
		return Math.floor((availableWidth - TILE_GAP * (columnCount + 1)) / columnCount);
	}, [columnCount, windowWidth, insets.left, insets.right]);

	// ─── Add-player chooser (friend roster or guest) ─────────────────────────
	//
	// The setup list has an add button above AND below the players: the top
	// one seats new players first, the bottom one last.

	const handleOpenAddPlayerModal = useCallback(
		(atStart: boolean) => {
			showAddPlayerModal({
				title: 'Spieler hinzufügen',
				children: <AddPlayerContent onDone={closeAddPlayerModal} insertAtStart={atStart} />,
			});
		},
		[showAddPlayerModal, closeAddPlayerModal],
	);

	// ─── Per-player edit modal (pencil on a player row) ──────────────────────

	const handleOpenPlayerEditModal = useCallback(
		(playerId: string) => {
			showPlayerEditModal({
				title: 'Spieler bearbeiten',
				children: <PlayerEditContent playerId={playerId} onClose={closePlayerEditModal} />,
			});
		},
		[showPlayerEditModal, closePlayerEditModal],
	);

	// ─── Game type selection (setup phase) ───────────────────────────────────

	const handleOpenGameTypeModal = useCallback(() => {
		showGameTypeModal({
			title: 'Spiel auswählen',
			children: <GameTypeSelectSection onDone={closeGameTypeModal} />,
		});
	}, [showGameTypeModal, closeGameTypeModal]);

	// All sections subscribe to the store themselves (see MatchOptionsSection),
	// so the modal content never acts on a stale snapshot of the match.
	const handleOpenSettingsModal = useCallback(() => {
		showSettingsModal({
			title: '⚙️ Optionen',
			children: (
				<View style={styles.modalContent}>
					<MatchPlayersSection
						onEditPlayers={() => {
							setIsEditingPlayers(true);
							closeSettingsModal();
						}}
					/>

					<ColumnsSettingsSection />

					<MatchOptionsSection onClose={closeSettingsModal} />
				</View>
			),
		});
	}, [showSettingsModal, closeSettingsModal]);

	// ─── Header buttons ───────────────────────────────────────────────────────

	useLayoutEffect(() => {
		navigation.setOptions({
			// Show which game is being played right in the header - as its picture
			// plus the name when it has one, otherwise the emoji in the text title.
			title: selectedGameType ? `${selectedGameType.icon} ${selectedGameType.name}` : 'Aktuelle Partie',
			headerTitle: selectedGameType
				? makeGameHeaderTitle(selectedGameType.name, selectedGameType.icon, selectedGameType.imageUrl)
				: undefined,
			headerRight: makeGameHeaderRight(theme.header.text, handleOpenSettingsModal),
			headerLeft: selectedGameType ? makeGameHeaderLeft(theme.header.text, selectedGameType.id) : undefined,
		});
	}, [navigation, theme.header.text, handleOpenSettingsModal, selectedGameType]);

	// ─── Score entry ──────────────────────────────────────────────────────────

	// Tapping a player opens their entry: the score of the viewed round (a
	// plain number or the game type's card picker), the player-scope
	// categories, plus a summary and the player editor (name, color, avatar) -
	// works on finished matches too, "beendet" only flags the match and fixes
	// its duration.
	const handleTilePress = useCallback(
		(playerId: string) => {
			// Only score entry needs a round; a game without points has none.
			if (trackScores && !currentRound) return;
			const player = players.find((p) => p.id === playerId);
			const categorySection =
				playerCategories.length > 0 ? <PlayerCategorySection playerId={playerId} categories={categories} gameTypeId={gameTypeId} /> : null;
			const infoSection = (
				<PlayerMatchInfoSection playerId={playerId} trackScores={trackScores} onEditPlayer={() => handleOpenPlayerEditModal(playerId)} />
			);
			const title = player ? player.name : 'Eintrag';

			if (!trackScores) {
				showScoreModal({
					title,
					children: (
						<>
							{categorySection ?? (
								<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
									Dieses Spiel zählt keine Punkte. Lege im Spiel eine Kategorie für „Jeden Spieler einzeln“ an, um hier etwas zu erfassen.
								</Text>
							)}
							{infoSection}
						</>
					),
				});
				return;
			}

			const scoreEntryRules = selectedGameType?.rules?.scoreEntry;
			if (!currentRound) return;
			if (scoreEntryRules) {
				showScoreModal({
					title,
					children: (
						<>
							<CardScoreEntryModal
								items={scoreEntryRules.items}
								scoreFormula={scoreEntryRules.scoreFormula}
								bonusAtNumberCount={scoreEntryRules.bonusAtNumberCount}
								bonusPoints={scoreEntryRules.bonusPoints}
								initialSelection={currentRound.cardSelections?.[playerId] ?? []}
								initialScore={currentRound.scores[playerId] ?? null}
								onSave={(cardIds, score) => {
									dispatch(setCardSelection({ roundId: currentRound.id, playerId, cardIds, score }));
									closeScoreModal();
								}}
							/>
							{categorySection}
							{infoSection}
						</>
					),
				});
				return;
			}
			showScoreModal({
				title,
				children: (
					<>
						<ScoreInputContent
							initialValue={currentRound.scores[playerId] ?? null}
							onSave={(value) => {
								dispatch(setScore({ roundId: currentRound.id, playerId, score: value }));
								closeScoreModal();
							}}
						/>
						{categorySection}
						{infoSection}
					</>
				),
			});
		},
		[currentRound, players, categories, playerCategories, trackScores, selectedGameType, gameTypeId, showScoreModal, closeScoreModal, handleOpenPlayerEditModal, dispatch, theme],
	);

	const handlePrevRound = useCallback(() => dispatch(goToPreviousRound()), [dispatch]);

	// Only a brand-new round needs a computed starting player - paging forward
	// through already-played rounds must keep their originally recorded one.
	const handleNextRound = useCallback(() => {
		const isCreatingNewRound = currentRoundIndex >= rounds.length - 1;
		// Viewing a finished match pages through its recorded rounds but must
		// never grow it by a new one.
		if (isFinishedView && isCreatingNewRound) return;
		if (!isCreatingNewRound || !currentRound) {
			dispatch(goToNextRound());
			return;
		}
		const { startIndex, nextState } = computeNextStartingPlayerIndex({
			mode: selectedGameType?.startingPlayerMode ?? 'fixed',
			customRule: selectedGameType?.rules?.playerOrder,
			playerCount: players.length,
			previousStartIndex: players.findIndex((p) => p.id === currentRound.startingPlayerId),
			previousRoundScores: players.map((p) => currentRound.scores[p.id] ?? null),
			totalScores: players.map((p) => totals[p.id] ?? null),
			scoringMode,
			state: playerOrderState ?? selectedGameType?.rules?.playerOrder?.initialState ?? 0,
		});
		dispatch(goToNextRound({ startingPlayerId: players[startIndex]?.id, nextOrderState: nextState }));
	}, [currentRoundIndex, rounds.length, currentRound, isFinishedView, selectedGameType, players, totals, scoringMode, playerOrderState, dispatch]);

	// ─── Render ───────────────────────────────────────────────────────────────

	const {
		gameTypeRowValue,
		gameTypeRowIconComponent,
		gameTypeRowLeftIcon,
		finishedBannerWinnerSuffix,
		startButtonOpacity,
		prevRoundOpacity,
		maxRoundsSuffix,
		nextRoundOpacity,
	} = resolveGameScreenDisplayValues({
		selectedGameType,
		leaderId,
		players,
		currentRoundIndex,
		maxRounds,
		isLastPossibleRound,
	});

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView
				style={styles.tilesScroll}
				contentContainerStyle={[
					styles.tilesContainer,
					!showEditRows && columnCount > 1 && styles.tilesContainerGrid,
					{ paddingBottom: insets.bottom + 96 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{showEditRows ? (
					<>
						{status === 'setup' && (
							<View style={styles.gameTypeRow}>
								<SettingsList
									nativeID={ComponentIds.GAME_SETUP_GAME_TYPE_ROW}
									label="Spiel"
									value={gameTypeRowValue}
									leftIconComponent={gameTypeRowIconComponent}
									leftIcon={gameTypeRowLeftIcon}
									iconBgColor={PRIMARY_COLOR}
									rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
									handleFunction={handleOpenGameTypeModal}
									groupPosition="single"
								/>
							</View>
						)}
						<MatchCategorySection categories={categories} gameTypeId={gameTypeId} />
						{/* Without players the two add buttons would sit right next to
						    each other - a single one (the bottom, whose id the tests
						    use) is enough until someone is seated. */}
						{players.length > 0 && (
							<TouchableOpacity
								id={ComponentIds.GAME_ADD_PLAYER_BUTTON_TOP}
								style={[styles.addPlayerButton, styles.addPlayerButtonTop, { borderColor: PRIMARY_COLOR }]}
								onPress={() => handleOpenAddPlayerModal(true)}
								activeOpacity={0.7}
							>
								<Ionicons name="add-circle-outline" size={22} color={PRIMARY_COLOR} />
								<Text style={[styles.addPlayerButtonText, { color: PRIMARY_COLOR }]}>Spieler hinzufügen</Text>
							</TouchableOpacity>
						)}
						{/* One wrapper View: the ScrollView's contentContainer has a `gap`,
						    which would otherwise push the grouped rows apart. */}
						{players.length > 0 && (
							<View>
								{players.map((player, index) => (
									<PlayerSetupRow
										key={player.id}
										player={player}
										index={index}
										total={players.length}
										onEdit={() => handleOpenPlayerEditModal(player.id)}
									/>
								))}
							</View>
						)}
						<TouchableOpacity
							id={ComponentIds.GAME_ADD_PLAYER_BUTTON}
							style={[styles.addPlayerButton, { borderColor: PRIMARY_COLOR }]}
							onPress={() => handleOpenAddPlayerModal(false)}
							activeOpacity={0.7}
						>
							<Ionicons name="add-circle-outline" size={22} color={PRIMARY_COLOR} />
							<Text style={[styles.addPlayerButtonText, { color: PRIMARY_COLOR }]}>Spieler hinzufügen</Text>
						</TouchableOpacity>
						{players.length === 0 && status === 'setup' && (
							<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
								Noch keine Spieler. Füge Freunde oder Gäste hinzu, um zu starten.
							</Text>
						)}
					</>
				) : (
					<>
						{isFinishedView && (
							<View nativeID={ComponentIds.GAME_FINISHED_VIEW_BANNER} style={[styles.finishedBanner, styles.finishedViewBanner]}>
								<Ionicons name="flag-outline" size={18} color="#ffffff" />
								<Text style={styles.finishedBannerText}>
									Beendete Partie{endedAt ? ` vom ${formatEndedAtDate(endedAt)}` : ''} - Änderungen werden direkt in der
									gespeicherten Partie übernommen.
								</Text>
							</View>
						)}
						{matchFinished && !isFinishedView && (
							<View nativeID={ComponentIds.GAME_FINISHED_BANNER} style={[styles.finishedBanner, { backgroundColor: SUCCESS_COLOR }]}>
								<Ionicons name="trophy-outline" size={18} color="#ffffff" />
								<Text style={styles.finishedBannerText}>
									Spiel beendet - Zielscore {maxScore} erreicht
									{finishedBannerWinnerSuffix}
								</Text>
							</View>
						)}
						<MatchCategorySection categories={categories} gameTypeId={gameTypeId} />
						{players.map((player) => {
							const summary = summarizeCategoryValues(playerCategories, playerCategoryValues?.[player.id]);
							return (
								<PlayerTile
									key={player.id}
									playerId={player.id}
									name={player.name}
									scoreLabel={trackScores ? String(totals[player.id] ?? 0) : summary || 'Noch nichts erfasst'}
									compactValue={!trackScores}
									color={player.color}
									avatarConfig={player.avatarConfig}
									isLeader={player.id === leaderId}
									isRoundStarter={currentRound?.startingPlayerId === player.id}
									hasScore={trackScores ? currentRound?.scores[player.id] != null : summary !== ''}
									onPress={() => handleTilePress(player.id)}
									tileWidth={tileWidth}
								/>
							);
						})}
					</>
				)}
			</ScrollView>

			{/* A game without points has no rounds, so the round navigation bar
			    disappears with them - such a match is ended via the header's
			    settings ("Neues Spiel") or discarded via its delete button. */}
			{(status === 'setup' || (!isEditingPlayers && trackScores)) && (
				<View style={[styles.bottomBar, { borderTopColor: theme.screen.border, paddingBottom: insets.bottom + 12 }]}>
					{status === 'setup' ? (
						<TouchableOpacity
							id={ComponentIds.GAME_START_BUTTON}
							style={[styles.nextRoundButton, { backgroundColor: PRIMARY_COLOR, opacity: startButtonOpacity }]}
							onPress={() => dispatch(startGame({ withRounds: trackScores }))}
							disabled={players.length === 0}
							activeOpacity={0.8}
						>
							<Text style={styles.nextRoundText}>Spiel starten</Text>
						</TouchableOpacity>
					) : (
						<>
							<TouchableOpacity
								id={ComponentIds.GAME_ROUND_PREV_BUTTON}
								style={[styles.roundNavButton, { backgroundColor: theme.screen.border, opacity: prevRoundOpacity }]}
								onPress={handlePrevRound}
								disabled={currentRoundIndex === 0}
								activeOpacity={0.8}
							>
								<Ionicons name="chevron-back" size={18} color={theme.screen.text} />
								{currentRoundNumber > 1 && (
									<Text style={[styles.roundNavText, { color: theme.screen.text }]}>Runde {currentRoundNumber - 1}</Text>
								)}
							</TouchableOpacity>
							<Text nativeID={ComponentIds.GAME_ROUND_LABEL} style={[styles.roundLabel, { color: theme.screen.text }]}>
								Runde {currentRoundNumber}
								{maxRoundsSuffix}
							</Text>
							<TouchableOpacity
								id={ComponentIds.GAME_ROUND_NEXT_BUTTON}
								style={[
									styles.roundNavButton,
									{ backgroundColor: PRIMARY_COLOR, opacity: nextRoundOpacity },
								]}
								onPress={handleNextRound}
								disabled={isLastPossibleRound}
								activeOpacity={0.8}
							>
								<Text style={styles.roundNavText}>
									{nextRoundLabel}
								</Text>
								<Ionicons name="chevron-forward" size={18} color="#ffffff" />
							</TouchableOpacity>
						</>
					)}
				</View>
			)}
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
	headerBackButton: {
		padding: 4,
		marginLeft: 8,
		marginRight: 8,
	},
	tilesScroll: {
		flex: 1,
	},
	tilesContainer: {
		padding: TILE_GAP,
		gap: TILE_GAP,
	},
	tilesContainerGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	rightIconPlaceholder: {
		width: 24,
		height: 24,
	},
	tileWrapper: {
		position: 'relative',
	},
	starterBadge: {
		position: 'absolute',
		top: 8,
		left: 8,
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: 'rgba(0,0,0,0.55)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 2,
	},
	verticalTile: {
		alignItems: 'center',
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 8,
	},
	verticalTileMissingScore: {
		borderColor: MISSING_SCORE_BORDER,
		borderWidth: 2.5,
		borderStyle: 'dashed',
	},
	verticalTileTrophy: {
		position: 'absolute',
		top: 8,
		right: 8,
	},
	verticalTileName: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: 10,
	},
	verticalTileScore: {
		fontSize: 22,
		fontWeight: '700',
		marginTop: 2,
	},
	verticalTileScoreCompact: {
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'center',
	},
	categorySection: {
		width: '100%',
	},
	reorderButton: {
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	gameTypeRow: {
		marginBottom: 8,
	},
	gameTypeIconWrapper: {
		marginRight: 12,
	},
	gameTypeOptionEmoji: {
		fontSize: 18,
	},
	addPlayerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		borderRadius: 12,
		paddingVertical: 14,
		marginTop: 4,
	},
	addPlayerButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
	addPlayerButtonTop: {
		marginTop: 0,
		marginBottom: 4,
	},
	emptyHint: {
		fontSize: 13,
		textAlign: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	finishedBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginBottom: 12,
	},
	finishedViewBanner: {
		backgroundColor: '#6b7280',
	},
	finishedBannerText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '700',
		textAlign: 'center',
		flexShrink: 1,
	},
	bottomBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		gap: 12,
	},
	roundNavButton: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 4,
	},
	roundNavText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	roundLabel: {
		fontSize: 13,
		fontWeight: '600',
		paddingHorizontal: 4,
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
	pendingRemovalRow: {
		opacity: 0.35,
	},
	selectedPlayerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	unselectedFriendRow: {
		opacity: 0.55,
	},
	modalSearchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 40,
		marginBottom: 8,
	},
	modalSearchInput: {
		flex: 1,
		fontSize: 15,
		height: '100%',
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
	quickButtonsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
		marginTop: 4,
	},
	quickButton: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		borderWidth: 1.5,
		justifyContent: 'center',
		alignItems: 'center',
	},
	quickButtonText: {
		fontSize: 15,
		fontWeight: '700',
	},
});
