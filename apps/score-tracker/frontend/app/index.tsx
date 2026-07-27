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
	setCategoryValue,
	setPlayerCategoryValue,
	movePlayer,
	removePlayer,
	setScore,
	setCardSelection,
	startGame,
	goToPreviousRound,
	goToNextRound,
	resetScores,
	resetAll,
} from '../store/gameSlice';
import { addFriendFromPlayer } from '../store/friendsSlice';
import { addGameType } from '../store/gameTypesSlice';
import { archiveGame, removeGameFromHistory } from '../store/gameHistorySlice';
import { setColumnsPortrait, setColumnsLandscape } from '../store/appSettingsSlice';
import type { AppDispatch, RootState } from '../store/store';
import { PLAYER_COLORS } from '../helpers/GameStorage';
import type { Player } from '../helpers/GameStorage';
import type { GameType } from '../helpers/GameTypesStorage';
import { buildHistoryEntry } from '../helpers/GameHistoryStorage';
import type { Friend } from '../helpers/FriendsStorage';
import { ComponentIds } from '../constants/ComponentIds';
import { logDebug } from '../helpers/DebugLogger';
import { generateId } from '../helpers/RandomHelper';
import GameTypeIcon from '../components/GameTypeIcon';
import { makeGameHeaderTitle } from '../components/GameHeaderTitle';
import CardScoreEntryModal from '../components/CardScoreEntryModal';
import CategoryValueRows from '../components/CategoryValueRows';
import { computeNextStartingPlayerIndex } from '../helpers/GameRules';
import type { GameCategory } from '../helpers/GameCategories';
import { categoriesForScope, resolveCategoryValues, summarizeCategoryValues } from '../helpers/GameCategories';

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
				nativeID={ComponentIds.GAME_SCORE_INPUT_SAVE_BUTTON}
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

function MatchCategorySection({ categories }: Readonly<{ categories: GameCategory[] }>) {
	const dispatch = useDispatch<AppDispatch>();
	const values = useSelector((state: RootState) => state.game.categoryValues);
	const matchCategories = useMemo(() => categoriesForScope(categories, 'match'), [categories]);
	const resolved = useMemo(() => resolveCategoryValues(categories, values), [categories, values]);

	if (matchCategories.length === 0) return null;

	return (
		<View style={styles.categorySection}>
			<SettingsListGroupTitle title="Spielinfos" />
			<CategoryValueRows
				categories={matchCategories}
				values={resolved}
				allCategories={categories}
				onChange={(categoryId, value) => dispatch(setCategoryValue({ categoryId, value }))}
			/>
		</View>
	);
}

function PlayerCategorySection({ playerId, categories }: Readonly<{ playerId: string; categories: GameCategory[] }>) {
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
				onChange={(categoryId, value) => dispatch(setPlayerCategoryValue({ playerId, categoryId, value }))}
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
			nativeID={nativeID}
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

// ─── Player edit row group (setup phase + header "Spieler bearbeiten" mode) ───

function PlayerEditGroup({
	player,
	onRename,
	onColorChange,
	onAvatarChange,
	onSaveAsFriend,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: Readonly<{
	player: Player;
	onRename: (name: string) => void;
	onColorChange: (color: string) => void;
	onAvatarChange: (config: AvatarConfig) => void;
	/** Only set for guest players (no friendId yet): saves them to the friends roster. */
	onSaveAsFriend?: () => void;
	onDelete: () => void;
	/** Manual seating-order adjustment (see GameRules `startingPlayerMode`). */
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}>) {
	const { theme } = useTheme();
	const { show: showColorModal, close: closeColorModal } = useMyScrollViewModal();
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);

	const handleOpenColorModal = useCallback(() => {
		showColorModal({
			title: 'Farbe wählen',
			children: (
				<MyColorPicker
					colors={PLAYER_COLORS}
					selectedColor={player.color}
					onSelect={(color) => {
						onColorChange(color);
						closeColorModal();
					}}
				/>
			),
		});
	}, [showColorModal, closeColorModal, player.color, onColorChange]);

	return (
		<View style={styles.playerEditGroup} nativeID={`${ComponentIds.GAME_PLAYER_ROW_PREFIX}${player.id}`}>
			<SettingsList
				label="Reihenfolge"
				leftIcon={<Ionicons name="swap-vertical-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				rightElement={
					<View style={styles.reorderButtons}>
						<TouchableOpacity
							nativeID={`${ComponentIds.GAME_PLAYER_ROW_MOVE_UP_PREFIX}${player.id}`}
							onPress={onMoveUp}
							disabled={!canMoveUp}
							hitSlop={8}
							style={styles.reorderButton}
						>
							<Ionicons name="chevron-up" size={20} color={canMoveUp ? theme.screen.text : theme.screen.border} />
						</TouchableOpacity>
						<TouchableOpacity
							nativeID={`${ComponentIds.GAME_PLAYER_ROW_MOVE_DOWN_PREFIX}${player.id}`}
							onPress={onMoveDown}
							disabled={!canMoveDown}
							hitSlop={8}
							style={styles.reorderButton}
						>
							<Ionicons name="chevron-down" size={20} color={canMoveDown ? theme.screen.text : theme.screen.border} />
						</TouchableOpacity>
					</View>
				}
				groupPosition="top"
			/>
			<SettingsListAvatar
				config={player.avatarConfig}
				onChange={(config) => {
					logDebug(`game: avatar onChange player=${player.id} style=${config.style}`);
					onAvatarChange(config);
				}}
				label={player.name}
				previewSize={EDIT_AVATAR_SIZE}
				avatarBackgroundColor={player.color}
				groupPosition="middle"
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
				onSave={onRename}
				groupPosition="middle"
			/>
			<SettingsList
				label="Farbe"
				leftIcon={<Ionicons name="color-palette-outline" size={20} color="#ffffff" />}
				iconBgColor={player.color}
				handleFunction={handleOpenColorModal}
				groupPosition="middle"
			/>
			{onSaveAsFriend && (
				<SettingsList
					nativeID={`${ComponentIds.GAME_PLAYER_ROW_SAVE_FRIEND_PREFIX}${player.id}`}
					label="Als Freund speichern"
					leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
					iconBgColor={SUCCESS_COLOR}
					handleFunction={onSaveAsFriend}
					groupPosition="middle"
				/>
			)}
			<SettingsList
				nativeID={`${ComponentIds.GAME_PLAYER_ROW_DELETE_PREFIX}${player.id}`}
				label="Spieler löschen"
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={onDelete}
				groupPosition="bottom"
			/>
		</View>
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

function AddPlayerContent({ onDone, onEditPlayers }: Readonly<{ onDone: () => void; onEditPlayers?: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const players = useSelector((state: RootState) => state.game.players);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const [friendSearch, setFriendSearch] = useState('');

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
										nativeID={`${ComponentIds.GAME_ADD_PLAYER_MOVE_UP_PREFIX}${player.id}`}
										onPress={() => dispatch(movePlayer({ playerId: player.id, direction: 'up' }))}
										disabled={index === 0}
										hitSlop={8}
										style={styles.reorderButton}
									>
										<Ionicons name="chevron-up" size={20} color={index === 0 ? theme.screen.border : theme.screen.text} />
									</TouchableOpacity>
									<TouchableOpacity
										nativeID={`${ComponentIds.GAME_ADD_PLAYER_MOVE_DOWN_PREFIX}${player.id}`}
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
										nativeID={`${ComponentIds.GAME_ADD_PLAYER_EDIT_PREFIX}${player.id}`}
										onPress={() => {
											onEditPlayers?.();
											onDone();
										}}
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
				handleFunction={() => dispatch(addGuestPlayer())}
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
						onPressOverride={() => dispatch(addFriendPlayer(friend))}
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
		show({ title: 'Spieler hinzufügen', children: <AddPlayerContent onDone={close} onEditPlayers={onEditPlayers} /> });
	}, [show, close, onEditPlayers]);

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
							nativeID={`${ComponentIds.GAME_SETTINGS_PLAYER_REMOVE_PREFIX}${player.id}`}
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
				nativeID={ComponentIds.GAME_HEADER_SETTINGS_BUTTON}
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
			nativeID={ComponentIds.GAME_HEADER_BACK_BUTTON}
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
function resolveNextRoundLabel(matchFinished: boolean, maxRounds: number | null, currentRoundNumber: number): string {
	if (matchFinished) {
		return 'Spiel beendet';
	} else if (maxRounds != null && currentRoundNumber >= maxRounds) {
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
	const game = useSelector((state: RootState) => state.game);
	const players = useSelector((state: RootState) => state.game.players);
	const matchId = useSelector((state: RootState) => state.game.matchId);
	const rounds = useSelector((state: RootState) => state.game.rounds);
	const status = useSelector((state: RootState) => state.game.status);
	const currentRoundIndex = useSelector((state: RootState) => state.game.currentRoundIndex);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const gameTypeId = useSelector((state: RootState) => state.game.gameTypeId);
	const playerOrderState = useSelector((state: RootState) => state.game.playerOrderState);
	const categoryValues = useSelector((state: RootState) => state.game.categoryValues);
	const playerCategoryValues = useSelector((state: RootState) => state.game.playerCategoryValues);
	const columnsPortrait = useSelector((state: RootState) => state.appSettings.columnsPortrait);
	const columnsLandscape = useSelector((state: RootState) => state.appSettings.columnsLandscape);

	const { show: showScoreModal, close: closeScoreModal } = useMyScrollViewModal();
	const { show: showAddPlayerModal, close: closeAddPlayerModal } = useMyScrollViewModal();
	const { show: showSettingsModal, close: closeSettingsModal } = useMyScrollViewModal();
	const { show: showGameTypeModal, close: closeGameTypeModal } = useMyScrollViewModal();
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const navigation = useNavigation();

	const [isEditingPlayers, setIsEditingPlayers] = useState(false);
	const toggleEditingPlayers = useCallback(() => setIsEditingPlayers(v => !v), []);

	// Leaving the setup phase always drops back into the scoreboard view.
	const prevStatusRef = useRef(status);
	useEffect(() => {
		if (prevStatusRef.current === 'setup' && status === 'active') {
			setIsEditingPlayers(false);
		}
		prevStatusRef.current = status;
	}, [status]);

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
	const isLastPossibleRound =
		(matchFinished && currentRoundIndex >= rounds.length - 1) || (maxRounds != null && currentRoundNumber >= maxRounds);

	// Label for the "next round" navigation button
	const nextRoundLabel = resolveNextRoundLabel(matchFinished, maxRounds, currentRoundNumber);

	// Tile width, only needed once a multi-column layout is active
	const tileWidth = useMemo(() => {
		if (columnCount === 1) return undefined;
		const availableWidth = windowWidth - insets.left - insets.right;
		return Math.floor((availableWidth - TILE_GAP * (columnCount + 1)) / columnCount);
	}, [columnCount, windowWidth, insets.left, insets.right]);

	// ─── Add-player chooser (friend roster or guest) ─────────────────────────

	const handleOpenAddPlayerModal = useCallback(() => {
		showAddPlayerModal({
			title: 'Spieler hinzufügen',
			children: <AddPlayerContent onDone={closeAddPlayerModal} onEditPlayers={() => setIsEditingPlayers(true)} />,
		});
	}, [showAddPlayerModal, closeAddPlayerModal]);

	// ─── Settings modal (header gear) ────────────────────────────────────────

	/**
	 * Throw away the match currently open - including its archived entry, if it
	 * was re-opened from the history - and start over from the setup phase with
	 * the same game preselected. The seats are emptied too: the next match
	 * picks its players fresh instead of inheriting this one's roster.
	 */
	const handleDeleteMatch = useCallback(() => {
		if (matchId) dispatch(removeGameFromHistory(matchId));
		dispatch(resetScores({ clearPlayers: true }));
		closeSettingsModal();
	}, [matchId, dispatch, closeSettingsModal]);

	// ─── Game type selection (setup phase) ───────────────────────────────────

	const handleOpenGameTypeModal = useCallback(() => {
		showGameTypeModal({
			title: 'Spiel auswählen',
			children: <GameTypeSelectSection onDone={closeGameTypeModal} />,
		});
	}, [showGameTypeModal, closeGameTypeModal]);

	// Save a guest player to the friends roster and link them, so future edits
	// stay in sync and the player can be re-added from the roster next time.
	const handleSaveGuestAsFriend = useCallback(
		(player: Player) => {
			const action = dispatch(
				addFriendFromPlayer({ name: player.name, color: player.color, avatarConfig: player.avatarConfig }),
			);
			dispatch(linkPlayerToFriend({ playerId: player.id, friendId: action.payload.id }));
		},
		[dispatch],
	);

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

					{status === 'active' && (
						<>
							<SettingsListGroupTitle title="Partie" />
							{trackScores && (
								<SettingsList
									nativeID={ComponentIds.GAME_SETTINGS_RESET_SCORES}
									label="Alle Punkte zurücksetzen"
									value="Spieler bleiben, alle Runden werden geleert"
									stackedValue
									leftIcon={<Ionicons name="refresh-outline" size={20} color="#ffffff" />}
									iconBgColor={WARNING_COLOR}
									handleFunction={() => {
										dispatch(resetScores());
										closeSettingsModal();
									}}
									groupPosition="top"
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
								groupPosition={trackScores ? 'bottom' : 'single'}
							/>
						</>
					)}
				</View>
			),
		});
	}, [status, trackScores, dispatch, closeSettingsModal, handleDeleteMatch]);

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

	// Tapping a player opens their round entry: the score (a plain number or the
	// game type's card picker) and/or the player-scope categories. A game with
	// `trackScores: false` skips the score part entirely and is recorded through
	// its categories alone.
	const handleTilePress = useCallback(
		(playerId: string) => {
			// Only score entry needs a round; a game without points has none.
			if (trackScores && !currentRound) return;
			const player = players.find((p) => p.id === playerId);
			const categorySection = playerCategories.length > 0 ? <PlayerCategorySection playerId={playerId} categories={categories} /> : null;
			const title = player ? player.name : 'Eintrag';

			if (!trackScores) {
				showScoreModal({
					title,
					children: categorySection ?? (
						<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
							Dieses Spiel zählt keine Punkte. Lege im Spiel eine Kategorie für „Jeden Spieler einzeln“ an, um hier etwas zu erfassen.
						</Text>
					),
				});
				return;
			}

			const scoreEntryRules = selectedGameType?.rules?.scoreEntry;
			if (!currentRound) return;
			if (scoreEntryRules) {
				showScoreModal({
					title: 'Punkte eingeben',
					children: (
						<>
							<CardScoreEntryModal
								items={scoreEntryRules.items}
								scoreFormula={scoreEntryRules.scoreFormula}
								bonusAtNumberCount={scoreEntryRules.bonusAtNumberCount}
								bonusPoints={scoreEntryRules.bonusPoints}
								initialSelection={currentRound.cardSelections?.[playerId] ?? []}
								onSave={(cardIds, score) => {
									dispatch(setCardSelection({ roundId: currentRound.id, playerId, cardIds, score }));
									closeScoreModal();
								}}
							/>
							{categorySection}
						</>
					),
				});
				return;
			}
			showScoreModal({
				title: 'Punkte eingeben',
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
					</>
				),
			});
		},
		[currentRound, players, categories, playerCategories, trackScores, selectedGameType, showScoreModal, closeScoreModal, dispatch, theme],
	);

	const handlePrevRound = useCallback(() => dispatch(goToPreviousRound()), [dispatch]);

	// Only a brand-new round needs a computed starting player - paging forward
	// through already-played rounds must keep their originally recorded one.
	const handleNextRound = useCallback(() => {
		const isCreatingNewRound = currentRoundIndex >= rounds.length - 1;
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
			scoringMode,
			state: playerOrderState ?? selectedGameType?.rules?.playerOrder?.initialState ?? 0,
		});
		dispatch(goToNextRound({ startingPlayerId: players[startIndex]?.id, nextOrderState: nextState }));
	}, [currentRoundIndex, rounds.length, currentRound, selectedGameType, players, scoringMode, playerOrderState, dispatch]);

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
						<MatchCategorySection categories={categories} />
						{players.map((player, index) => (
							<PlayerEditGroup
								key={player.id}
								player={player}
								onRename={(name) => dispatch(renamePlayer({ playerId: player.id, name }))}
								onColorChange={(color) => dispatch(setPlayerColor({ playerId: player.id, color }))}
								onAvatarChange={(config) => dispatch(setPlayerAvatar({ playerId: player.id, avatarConfig: config }))}
								onSaveAsFriend={player.friendId ? undefined : () => handleSaveGuestAsFriend(player)}
								onDelete={() => dispatch(removePlayer(player.id))}
								onMoveUp={() => dispatch(movePlayer({ playerId: player.id, direction: 'up' }))}
								onMoveDown={() => dispatch(movePlayer({ playerId: player.id, direction: 'down' }))}
								canMoveUp={index > 0}
								canMoveDown={index < players.length - 1}
							/>
						))}
						<TouchableOpacity
							nativeID={ComponentIds.GAME_ADD_PLAYER_BUTTON}
							style={[styles.addPlayerButton, { borderColor: PRIMARY_COLOR }]}
							onPress={handleOpenAddPlayerModal}
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
						{matchFinished && (
							<View nativeID={ComponentIds.GAME_FINISHED_BANNER} style={[styles.finishedBanner, { backgroundColor: SUCCESS_COLOR }]}>
								<Ionicons name="trophy-outline" size={18} color="#ffffff" />
								<Text style={styles.finishedBannerText}>
									Spiel beendet - Zielscore {maxScore} erreicht
									{finishedBannerWinnerSuffix}
								</Text>
							</View>
						)}
						<MatchCategorySection categories={categories} />
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
							nativeID={ComponentIds.GAME_START_BUTTON}
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
								nativeID={ComponentIds.GAME_ROUND_PREV_BUTTON}
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
								nativeID={ComponentIds.GAME_ROUND_NEXT_BUTTON}
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
	playerEditGroup: {
		marginBottom: 4,
	},
	reorderButtons: {
		flexDirection: 'row',
		gap: 4,
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
