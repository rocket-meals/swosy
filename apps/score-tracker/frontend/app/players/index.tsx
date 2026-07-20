import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListTextInput,
	SettingsListAvatar,
	MyColorPicker,
	useMyScrollViewModal,
	useTheme,
	AvatarStyle,
} from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';
import {
	addFriend,
	renameFriend,
	setFriendColor,
	setFriendAvatar,
	removeFriend,
	importFriends,
} from '../../store/friendsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { PLAYER_COLORS } from '../../helpers/GameStorage';
import type { Friend } from '../../helpers/FriendsStorage';
import { parseFriendsExport } from '../../helpers/FriendsStorage';
import { ComponentIds } from '../../constants/ComponentIds';
import { logDebug } from '../../helpers/DebugLogger';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const DEBUG_COLOR = '#7c3aed';
const FRIEND_AVATAR_SIZE = 84; // Same size as the Game scoreboard's player avatars

// Helper to determine groupPosition for list items
function getGroupPosition(index: number, total: number): 'top' | 'middle' | 'bottom' {
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

// ─── Import/export rows (shared between the header "Optionen" modal and the
// friend detail modal) ─────────────────────────────────────────────────────

function ExportFriendsRow({
	friends,
	label,
	nativeID,
	groupPosition,
}: Readonly<{
	friends: Friend[];
	label: string;
	nativeID?: string;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
}>) {
	const handleExport = useCallback(async () => {
		await Clipboard.setStringAsync(JSON.stringify(friends, null, 2));
	}, [friends]);

	return (
		<SettingsList
			nativeID={nativeID}
			label={label}
			value={friends.length === 1 ? friends[0].name : `${friends.length} Freunde`}
			leftIcon={<Ionicons name="share-outline" size={20} color="#ffffff" />}
			iconBgColor={PRIMARY_COLOR}
			handleFunction={handleExport}
			groupPosition={groupPosition}
		/>
	);
}

function ImportFriendsRow({
	nativeID,
	groupPosition,
}: Readonly<{
	nativeID?: string;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
}>) {
	const dispatch = useDispatch<AppDispatch>();

	return (
		<SettingsListTextInput
			nativeID={nativeID}
			label="Freunde importieren"
			leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
			iconBgColor={PRIMARY_COLOR}
			modalTitle="Freunde importieren"
			placeholder='[{"id": "...", "name": "Anna", "color": "#2563eb", "createdAt": 0}]'
			saveLabel="Importieren"
			multiline
			numberOfLines={10}
			textAlignVertical="top"
			checkTextInput={(value) => ({ isValid: parseFriendsExport(value) !== null, value })}
			onSave={(value) => {
				const parsed = parseFriendsExport(value);
				if (parsed) dispatch(importFriends(parsed));
			}}
			groupPosition={groupPosition}
		/>
	);
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Friend edit modal content ────────────────────────────────────────────────
//
// Lives in a modal (instead of a separate screen) so editing a friend never
// leaves the friends list. Rendered as its own component so it re-renders
// from its own `useSelector` subscriptions while the modal stays open.

function FriendEditContent({ friendId, onClose }: Readonly<{ friendId: string; onClose: () => void }>) {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const friend = useSelector((state: RootState) => state.friends.friends.find((f) => f.id === friendId));
	const historyEntries = useSelector((state: RootState) => state.gameHistory.entries);
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const { show: showColorModal, close: closeColorModal } = useMyScrollViewModal();

	const friendGames = useMemo(() => {
		if (!friend) return [];
		return historyEntries
			.filter((entry) => entry.players.some((p) => p.friendId === friend.id))
			.map((entry) => {
				const sorted = [...entry.players].sort(
					(a, b) => (entry.finalScores[b.playerId] ?? 0) - (entry.finalScores[a.playerId] ?? 0),
				);
				const playerEntry = entry.players.find((p) => p.friendId === friend.id)!;
				const rank = sorted.findIndex((p) => p.playerId === playerEntry.playerId) + 1;
				const gameType = entry.gameTypeId ? gameTypes.find((g) => g.id === entry.gameTypeId) : undefined;
				return {
					id: entry.id,
					endedAt: entry.endedAt,
					roundsCount: entry.roundsCount,
					score: entry.finalScores[playerEntry.playerId] ?? 0,
					rank,
					totalPlayers: entry.players.length,
					gameLabel: gameType ? `${gameType.icon} ${gameType.name}` : undefined,
				};
			})
			.sort((a, b) => b.endedAt - a.endedAt);
	}, [historyEntries, gameTypes, friend]);

	const handleOpenColorModal = useCallback(() => {
		if (!friend) return;
		showColorModal({
			title: 'Farbe wählen',
			children: (
				<MyColorPicker
					colors={PLAYER_COLORS}
					selectedColor={friend.color}
					onSelect={(color) => {
						dispatch(setFriendColor({ friendId: friend.id, color }));
						closeColorModal();
					}}
				/>
			),
		});
	}, [showColorModal, closeColorModal, friend, dispatch]);

	const handleDelete = useCallback(() => {
		if (!friend) return;
		dispatch(removeFriend(friend.id));
		onClose();
	}, [friend, dispatch, onClose]);

	const handleCopyId = useCallback(async () => {
		if (!friend) return;
		await Clipboard.setStringAsync(friend.id);
	}, [friend]);

	if (!friend) {
		return (
			<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>Freund nicht gefunden.</Text>
		);
	}

	return (
		<View style={styles.modalContent}>
			<SettingsListAvatar
				config={friend.avatarConfig}
				onChange={(config) => {
					logDebug(`players: avatar onChange friend=${friend.id} style=${config.style}`);
					dispatch(setFriendAvatar({ friendId: friend.id, avatarConfig: config }));
				}}
				label="Avatar"
				previewSize={72}
				avatarBackgroundColor={friend.color}
				groupPosition="top"
				editorOptions={{
					title: 'Avatar',
					allowedStyles: [AvatarStyle.AVATAAARS],
					// Debug-Modus (Settings → 5x auf Version tippen) blendet im QuickStart
					// zusätzliche Touch-Test-Buttons ein (siehe QuickstartDebugSection).
					debugMode,
					onDebugEvent: (event) => logDebug(`players: avatar-editor ${event} friend=${friend.id}`),
				}}
			/>
			<SettingsListTextInput
				label="Name"
				placeholder="Name eingeben"
				initialValue={friend.name}
				value={friend.name}
				onSave={(name) => {
					dispatch(renameFriend({ friendId: friend.id, name }));
				}}
				groupPosition="middle"
			/>
			<SettingsList
				label="Farbe"
				leftIcon={<Ionicons name="color-palette-outline" size={20} color="#ffffff" />}
				iconBgColor={friend.color}
				handleFunction={handleOpenColorModal}
				groupPosition="middle"
			/>
			<SettingsList
				nativeID={ComponentIds.PLAYER_DETAIL_DELETE_BUTTON}
				label="Freund löschen"
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={handleDelete}
				groupPosition="bottom"
			/>

			<SettingsListGroupTitle title="Import / Export" />
			<ExportFriendsRow
				nativeID={ComponentIds.PLAYER_DETAIL_EXPORT_ROW}
				friends={[friend]}
				label="Diesen Freund exportieren"
				groupPosition="top"
			/>
			<ImportFriendsRow nativeID={ComponentIds.PLAYER_DETAIL_IMPORT_ROW} groupPosition="bottom" />

			{debugMode && (
				<>
					<SettingsListGroupTitle title="Debug" />
					<SettingsList
						nativeID={ComponentIds.PLAYER_DETAIL_ID_ROW}
						label="ID"
						value={friend.id}
						leftIcon={<MaterialCommunityIcons name="identifier" size={20} color="#ffffff" />}
						iconBgColor={DEBUG_COLOR}
						rightIcon={<MaterialCommunityIcons name="content-copy" size={18} color="#9ca3af" />}
						handleFunction={handleCopyId}
						groupPosition="single"
					/>
				</>
			)}

			<SettingsListGroupTitle title="Gespielte Partien" />
			{friendGames.length === 0 ? (
				<Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>
					Noch keine gespielten Partien.
				</Text>
			) : (
				friendGames.map((game, index) => (
					<SettingsList
						key={game.id}
						label={game.gameLabel ? `${game.gameLabel} · ${formatDate(game.endedAt)}` : formatDate(game.endedAt)}
						value={`${game.score} Punkte · Platz ${game.rank}/${game.totalPlayers} · ${game.roundsCount} Runden`}
						stackedValue
						leftIcon={<Ionicons name="trophy-outline" size={20} color="#ffffff" />}
						iconBgColor={friend.color}
						groupPosition={getGroupPosition(index, friendGames.length)}
					/>
				))
			)}
		</View>
	);
}

// ─── Players (friends) screen ─────────────────────────────────────────────────

export default function PlayersScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const friends = useSelector((state: RootState) => state.friends.friends);
	const navigation = useNavigation();
	const [searchQuery, setSearchQuery] = useState('');
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const filteredFriends = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return friends;
		return friends.filter((friend) => friend.name.toLowerCase().includes(query));
	}, [friends, searchQuery]);

	const handleOpenFriendModal = useCallback(
		(friendId: string) => {
			showModal({
				title: 'Freund bearbeiten',
				children: <FriendEditContent friendId={friendId} onClose={closeModal} />,
			});
		},
		[showModal, closeModal],
	);

	const handleAddFriend = useCallback(() => {
		const friendNumber = friends.length + 1;
		const color = PLAYER_COLORS[friends.length % PLAYER_COLORS.length];
		const action = dispatch(addFriend(`Freund ${friendNumber}`, color));
		handleOpenFriendModal(action.payload.id);
	}, [friends.length, dispatch, handleOpenFriendModal]);

	const handleOpenOptionsModal = useCallback(() => {
		showModal({
			title: '⚙️ Optionen',
			children: (
				<View style={styles.modalContent}>
					<SettingsListGroupTitle title="Import / Export" />
					<ExportFriendsRow
						nativeID={ComponentIds.PLAYERS_OPTIONS_EXPORT_ALL_ROW}
						friends={friends}
						label="Alle Freunde exportieren"
						groupPosition="top"
					/>
					<ImportFriendsRow nativeID={ComponentIds.PLAYERS_OPTIONS_IMPORT_ROW} groupPosition="bottom" />
				</View>
			),
		});
	}, [showModal, friends]);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					nativeID={ComponentIds.PLAYERS_SCREEN_OPTIONS_BUTTON}
					onPress={handleOpenOptionsModal}
					style={styles.headerButton}
				>
					<Ionicons name="settings-outline" size={22} color={theme.header.text} />
				</TouchableOpacity>
			),
		});
	}, [navigation, theme.header.text, handleOpenOptionsModal]);

	const searchResultsContent =
		filteredFriends.length === 0 ? (
			<Text style={[styles.emptySubtext, styles.noResultsText, { color: theme.screen.placeholder }]}>
				Kein Freund gefunden für „{searchQuery}“.
			</Text>
		) : (
			filteredFriends.map((friend, index) => (
				<SettingsListAvatar
					key={friend.id}
					nativeID={`${ComponentIds.PLAYERS_SCREEN_FRIEND_ROW_PREFIX}${friend.id}`}
					config={friend.avatarConfig}
					avatarBackgroundColor={friend.color}
					previewSize={FRIEND_AVATAR_SIZE}
					label={friend.name}
					rightIcon={<MaterialCommunityIcons name="pencil" size={20} color="#9ca3af" />}
					onPressOverride={() => handleOpenFriendModal(friend.id)}
					groupPosition={getGroupPosition(index, filteredFriends.length)}
				/>
			))
		);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			{friends.length > 0 && (
				<View style={styles.searchBarWrapper}>
					<View style={[styles.searchBar, { backgroundColor: theme.screen.iconBg }]}>
						<Ionicons name="search-outline" size={18} color={theme.screen.icon} />
						<TextInput
							nativeID={ComponentIds.PLAYERS_SCREEN_SEARCH_INPUT}
							style={[styles.searchInput, { color: theme.screen.text }]}
							placeholder="Freund suchen"
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
				<TouchableOpacity
					nativeID={ComponentIds.PLAYERS_SCREEN_ADD_BUTTON}
					style={[styles.addFriendButton, { borderColor: PRIMARY_COLOR }]}
					onPress={handleAddFriend}
					activeOpacity={0.7}
				>
					<Ionicons name="person-add-outline" size={22} color={PRIMARY_COLOR} />
					<Text style={[styles.addFriendButtonText, { color: PRIMARY_COLOR }]}>Spieler erstellen</Text>
				</TouchableOpacity>

				{friends.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name="people-outline" size={64} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.text }]}>Noch keine Freunde</Text>
						<Text style={[styles.emptySubtext, { color: theme.screen.placeholder }]}>
							Lege oben deinen ersten Spieler an
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
	headerButton: {
		padding: 4,
		marginRight: 8,
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
	modalContent: {
		padding: 10,
	},
	addFriendButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		borderRadius: 12,
		paddingVertical: 14,
		marginBottom: 12,
	},
	addFriendButtonText: {
		fontSize: 15,
		fontWeight: '600',
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
	emptyHint: {
		fontSize: 13,
		textAlign: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
});
