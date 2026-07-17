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
	useMyScrollViewModal,
	useTheme,
	MyColorPicker,
	myContrastColor,
	AvatarStyle,
} from 'repo-depkit-common-ui';
import type { AvatarConfig } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';
import {
	addGuestPlayer,
	addFriendPlayer,
	renamePlayer,
	setPlayerColor,
	setPlayerAvatar,
	removePlayer,
	setScore,
	startGame,
	goToPreviousRound,
	goToNextRound,
	resetScores,
	resetAll,
} from '../store/gameSlice';
import { archiveGame } from '../store/gameHistorySlice';
import { setColumnsPortrait, setColumnsLandscape } from '../store/appSettingsSlice';
import type { AppDispatch, RootState } from '../store/store';
import { PLAYER_COLORS } from '../helpers/GameStorage';
import type { Player } from '../helpers/GameStorage';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { Friend } from '../helpers/FriendsStorage';
import { ComponentIds } from '../constants/ComponentIds';
import { logDebug } from '../helpers/DebugLogger';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const WARNING_COLOR = '#f59e0b';

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

function generateHistoryId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Score Input Modal Content ────────────────────────────────────────────────

const QUICK_SCORES = [-5, -1, 0, 1, 5];

function ScoreInputContent({
	initialValue,
	onSave,
}: {
	initialValue: number | null;
	onSave: (value: number | null) => void;
}) {
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
				{QUICK_SCORES.map((v) => (
					<TouchableOpacity
						key={v}
						style={[
							styles.quickButton,
							{
								backgroundColor: v < 0 ? DANGER_COLOR + '20' : v > 0 ? PRIMARY_COLOR + '20' : theme.screen.border + '40',
								borderColor: v < 0 ? DANGER_COLOR : v > 0 ? PRIMARY_COLOR : theme.screen.border,
							},
						]}
						onPress={() => handleQuickScore(v)}
						activeOpacity={0.7}
					>
						<Text style={[styles.quickButtonText, { color: v < 0 ? DANGER_COLOR : v > 0 ? PRIMARY_COLOR : theme.screen.text }]}>
							{v > 0 ? `+${v}` : String(v)}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}

// ─── Player score row (active game, scoreboard view) ──────────────────────────
//
// Reuses the shared SettingsListAvatar (the same building block as the player
// edit rows and the friends screen) so avatar sizing, text wrapping/colors and
// spacing all stay consistent: the player's color fills the whole row, name
// and points stack on their own lines (so a long name is never lost), and the
// leader crown replaces the row's default right icon.

const TILE_AVATAR_SIZE = 84;
const MISSING_SCORE_BORDER = 'rgba(255,255,255,0.85)';

function PlayerTile({
	playerId,
	name,
	score,
	color,
	avatarConfig,
	isLeader,
	hasScore,
	onPress,
	tileWidth,
}: {
	playerId: string;
	name: string;
	score: number;
	color: string;
	avatarConfig?: AvatarConfig;
	isLeader: boolean;
	hasScore: boolean;
	onPress: () => void;
	tileWidth?: number;
}) {
	const { theme, isDark } = useTheme();
	const textColor = myContrastColor(color, theme, isDark);

	return (
		<SettingsListAvatar
			nativeID={`${ComponentIds.GAME_PLAYER_TILE_PREFIX}${playerId}`}
			config={avatarConfig}
			onPressOverride={onPress}
			label={name}
			value={String(score)}
			stackedValue
			previewSize={TILE_AVATAR_SIZE}
			avatarBackgroundColor="#ffffff"
			width={tileWidth}
			backgroundColor={color}
			titleColor={textColor}
			valueColor={textColor}
			titleFontSize={20}
			valueFontSize={26}
			borderColor={hasScore ? undefined : MISSING_SCORE_BORDER}
			borderWidth={hasScore ? undefined : 2.5}
			borderStyle="dashed"
			rightIcon={isLeader ? <Ionicons name="trophy" size={24} color="#fbbf24" /> : <View style={styles.rightIconPlaceholder} />}
			groupPosition="single"
			showSeparator={false}
		/>
	);
}

// ─── Player edit row group (setup phase + header "Spieler bearbeiten" mode) ───

function PlayerEditGroup({
	player,
	onRename,
	onColorChange,
	onAvatarChange,
	onDelete,
}: {
	player: Player;
	onRename: (name: string) => void;
	onColorChange: (color: string) => void;
	onAvatarChange: (config: AvatarConfig) => void;
	onDelete: () => void;
}) {
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
			<SettingsListAvatar
				config={player.avatarConfig}
				onChange={(config) => {
					logDebug(`game: avatar onChange player=${player.id} style=${config.style}`);
					onAvatarChange(config);
				}}
				label={player.name}
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

// ─── Game Screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const players = useSelector((state: RootState) => state.game.players);
	const rounds = useSelector((state: RootState) => state.game.rounds);
	const status = useSelector((state: RootState) => state.game.status);
	const currentRoundIndex = useSelector((state: RootState) => state.game.currentRoundIndex);
	const friends = useSelector((state: RootState) => state.friends.friends);
	const columnsPortrait = useSelector((state: RootState) => state.appSettings.columnsPortrait);
	const columnsLandscape = useSelector((state: RootState) => state.appSettings.columnsLandscape);

	const { show: showScoreModal, close: closeScoreModal } = useMyScrollViewModal();
	const { show: showAddPlayerModal, close: closeAddPlayerModal } = useMyScrollViewModal();
	const { show: showSettingsModal, close: closeSettingsModal } = useMyScrollViewModal();
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

	const showEditRows = status === 'setup' || isEditingPlayers;

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

	// Find leader (player with highest score)
	const leaderId = useMemo(() => {
		if (players.length === 0) return null;
		let maxScore = -Infinity;
		let maxId: string | null = null;
		for (const player of players) {
			const total = totals[player.id] ?? 0;
			if (total > maxScore) {
				maxScore = total;
				maxId = player.id;
			}
		}
		// Only show leader if at least one player has a score > 0
		if (maxScore <= 0) return null;
		return maxId;
	}, [players, totals]);

	const currentRound = rounds[currentRoundIndex] ?? null;
	const currentRoundNumber = currentRoundIndex + 1;

	// Tile width, only needed once a multi-column layout is active
	const tileWidth = useMemo(() => {
		if (columnCount === 1) return undefined;
		const availableWidth = windowWidth - insets.left - insets.right;
		return Math.floor((availableWidth - TILE_GAP * (columnCount + 1)) / columnCount);
	}, [columnCount, windowWidth, insets.left, insets.right]);

	// ─── Add-player chooser (friend roster or guest) ─────────────────────────

	const handleOpenAddPlayerModal = useCallback(() => {
		const existingFriendIds = new Set(players.map((p) => p.friendId).filter((id): id is string => !!id));
		const availableFriends = friends.filter((f) => !existingFriendIds.has(f.id));

		showAddPlayerModal({
			title: 'Spieler hinzufügen',
			children: (
				<View style={styles.modalContent}>
					<SettingsListGroupTitle title="Freunde" />
					{availableFriends.length === 0 ? (
						<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
							Keine Freunde verfügbar. Lege welche im Spieler-Bereich an oder füge einen Gast hinzu.
						</Text>
					) : (
						availableFriends.map((friend: Friend, index) => (
							<SettingsListAvatar
								key={friend.id}
								nativeID={`${ComponentIds.GAME_ADD_PLAYER_FRIEND_ROW_PREFIX}${friend.id}`}
								config={friend.avatarConfig}
								avatarBackgroundColor={friend.color}
								previewSize={PICKER_AVATAR_SIZE}
								label={friend.name}
								rightIcon={<Ionicons name="add-circle-outline" size={22} color="#ffffff" />}
								onPressOverride={() => {
									dispatch(addFriendPlayer(friend));
									closeAddPlayerModal();
								}}
								groupPosition={getGroupPosition(index, availableFriends.length)}
							/>
						))
					)}
					<SettingsListGroupTitle title="Sonstige" />
					<SettingsList
						nativeID={ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON}
						label="Gast hinzufügen"
						leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={() => {
							dispatch(addGuestPlayer());
							closeAddPlayerModal();
						}}
						groupPosition="single"
					/>
				</View>
			),
		});
	}, [players, friends, showAddPlayerModal, closeAddPlayerModal, dispatch, theme]);

	// ─── Settings modal (header gear) ────────────────────────────────────────

	const handleStartNewGame = useCallback(() => {
		if (players.length > 0) {
			const entry: GameHistoryEntry = {
				id: generateHistoryId(),
				endedAt: Date.now(),
				roundsCount: rounds.length,
				players: players.map((p) => ({
					playerId: p.id,
					friendId: p.friendId,
					name: p.name,
					color: p.color,
					avatarConfig: p.avatarConfig,
				})),
				finalScores: Object.fromEntries(players.map((p) => [p.id, totals[p.id] ?? 0])),
			};
			dispatch(archiveGame(entry));
		}
		dispatch(resetAll());
		closeSettingsModal();
	}, [players, rounds, totals, dispatch, closeSettingsModal]);

	const handleOpenSettingsModal = useCallback(() => {
		showSettingsModal({
			title: '⚙️ Einstellungen',
			children: (
				<View style={styles.modalContent}>
					<ColumnsSettingsSection />

					{status === 'active' && (
						<>
							<SettingsListGroupTitle title="Spiel" />
							<SettingsList
								nativeID={ComponentIds.GAME_SETTINGS_RESET_SCORES}
								label="Alle Punkte zurücksetzen"
								leftIcon={<Ionicons name="refresh-outline" size={20} color="#ffffff" />}
								iconBgColor={WARNING_COLOR}
								handleFunction={() => {
									dispatch(resetScores());
									closeSettingsModal();
								}}
								groupPosition="top"
							/>
							<SettingsList
								nativeID={ComponentIds.GAME_SETTINGS_NEW_GAME}
								label="Neues Spiel"
								leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
								iconBgColor={DANGER_COLOR}
								handleFunction={handleStartNewGame}
								groupPosition="bottom"
							/>
						</>
					)}
				</View>
			),
		});
	}, [status, dispatch, closeSettingsModal, handleStartNewGame]);

	// ─── Header buttons ───────────────────────────────────────────────────────

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={styles.headerButtons}>
					{status === 'active' && (
						<TouchableOpacity
							nativeID={ComponentIds.GAME_HEADER_EDIT_PLAYERS_BUTTON}
							onPress={() => setIsEditingPlayers((v) => !v)}
							style={styles.headerButton}
						>
							<Ionicons
								name={isEditingPlayers ? 'checkmark-circle-outline' : 'people-outline'}
								size={22}
								color={theme.header.text}
							/>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						nativeID={ComponentIds.GAME_HEADER_SETTINGS_BUTTON}
						onPress={handleOpenSettingsModal}
						style={styles.headerButton}
					>
						<Ionicons name="settings-outline" size={22} color={theme.header.text} />
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, theme.header.text, status, isEditingPlayers, handleOpenSettingsModal]);

	// ─── Score entry ──────────────────────────────────────────────────────────

	const handleTilePress = useCallback(
		(playerId: string) => {
			if (!currentRound) return;
			showScoreModal({
				title: 'Punkte eingeben',
				children: (
					<ScoreInputContent
						initialValue={currentRound.scores[playerId] ?? null}
						onSave={(value) => {
							dispatch(setScore({ roundId: currentRound.id, playerId, score: value }));
							closeScoreModal();
						}}
					/>
				),
			});
		},
		[currentRound, showScoreModal, closeScoreModal, dispatch],
	);

	const handlePrevRound = useCallback(() => dispatch(goToPreviousRound()), [dispatch]);
	const handleNextRound = useCallback(() => dispatch(goToNextRound()), [dispatch]);

	// ─── Render ───────────────────────────────────────────────────────────────

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
						{players.map((player) => (
							<PlayerEditGroup
								key={player.id}
								player={player}
								onRename={(name) => dispatch(renamePlayer({ playerId: player.id, name }))}
								onColorChange={(color) => dispatch(setPlayerColor({ playerId: player.id, color }))}
								onAvatarChange={(config) => dispatch(setPlayerAvatar({ playerId: player.id, avatarConfig: config }))}
								onDelete={() => dispatch(removePlayer(player.id))}
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
					players.map((player) => (
						<PlayerTile
							key={player.id}
							playerId={player.id}
							name={player.name}
							score={totals[player.id] ?? 0}
							color={player.color}
							avatarConfig={player.avatarConfig}
							isLeader={player.id === leaderId}
							hasScore={currentRound ? currentRound.scores[player.id] != null : false}
							onPress={() => handleTilePress(player.id)}
							tileWidth={tileWidth}
						/>
					))
				)}
			</ScrollView>

			{(status === 'setup' || !isEditingPlayers) && (
				<View style={[styles.bottomBar, { borderTopColor: theme.screen.border, paddingBottom: insets.bottom + 12 }]}>
					{status === 'setup' ? (
						<TouchableOpacity
							nativeID={ComponentIds.GAME_START_BUTTON}
							style={[styles.nextRoundButton, { backgroundColor: PRIMARY_COLOR, opacity: players.length === 0 ? 0.5 : 1 }]}
							onPress={() => dispatch(startGame())}
							disabled={players.length === 0}
							activeOpacity={0.8}
						>
							<Text style={styles.nextRoundText}>Spiel starten</Text>
						</TouchableOpacity>
					) : (
						<>
							<TouchableOpacity
								nativeID={ComponentIds.GAME_ROUND_PREV_BUTTON}
								style={[styles.roundNavButton, { backgroundColor: theme.screen.border, opacity: currentRoundIndex === 0 ? 0.4 : 1 }]}
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
							</Text>
							<TouchableOpacity
								nativeID={ComponentIds.GAME_ROUND_NEXT_BUTTON}
								style={[styles.roundNavButton, { backgroundColor: PRIMARY_COLOR }]}
								onPress={handleNextRound}
								activeOpacity={0.8}
							>
								<Text style={styles.roundNavText}>Runde {currentRoundNumber + 1}</Text>
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
	playerEditGroup: {
		marginBottom: 4,
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
