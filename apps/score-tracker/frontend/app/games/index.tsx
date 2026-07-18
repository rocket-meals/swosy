import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, SettingsListTextInput, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { router, useNavigation } from 'expo-router';
import { addGameType, addGameTypeFromPreset } from '../../store/gameTypesSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { FLIP_SEVEN_PRESET, parseGamePreset } from '../../helpers/GameRules';
import { ComponentIds } from '../../constants/ComponentIds';
import GameTypeIcon from '../../components/GameTypeIcon';

const PRIMARY_COLOR = '#2563eb';

export default function GamesScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const gameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const historyEntries = useSelector((state: RootState) => state.gameHistory.entries);
	const navigation = useNavigation();
	const [searchQuery, setSearchQuery] = useState('');
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const filteredGameTypes = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return gameTypes;
		return gameTypes.filter((gameType) => gameType.name.toLowerCase().includes(query));
	}, [gameTypes, searchQuery]);

	// Played matches per game type (derived from the archived history)
	const matchCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const entry of historyEntries) {
			if (entry.gameTypeId) {
				counts[entry.gameTypeId] = (counts[entry.gameTypeId] ?? 0) + 1;
			}
		}
		return counts;
	}, [historyEntries]);

	const handleAddGameType = useCallback(() => {
		const gameNumber = gameTypes.length + 1;
		const action = dispatch(addGameType(`Spiel ${gameNumber}`));
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [gameTypes.length, dispatch]);

	const handleLoadFlipSeven = useCallback(() => {
		const action = dispatch(addGameTypeFromPreset(FLIP_SEVEN_PRESET));
		closeModal();
		router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
	}, [dispatch, closeModal]);

	const handleImportPreset = useCallback(
		(value: string) => {
			const preset = parseGamePreset(value);
			if (!preset) return;
			const action = dispatch(addGameTypeFromPreset(preset));
			closeModal();
			router.push({ pathname: '/games/[id]', params: { id: action.payload.id } });
		},
		[dispatch, closeModal],
	);

	const handleOpenImportModal = useCallback(() => {
		showModal({
			title: 'Spiel laden',
			children: (
				<View style={styles.modalContent}>
					<SettingsListGroupTitle title="Beispiel" />
					<SettingsList
						nativeID={ComponentIds.GAMES_IMPORT_LOAD_FLIP_SEVEN_ROW}
						label="🃏 Flip Seven laden"
						value="Fertig konfiguriertes Beispielspiel"
						leftIcon={<Ionicons name="download-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						handleFunction={handleLoadFlipSeven}
						groupPosition="single"
					/>
					<SettingsListGroupTitle title="Eigenes Spiel importieren" />
					<SettingsListTextInput
						nativeID={ComponentIds.GAMES_IMPORT_PRESET_ROW}
						label="Spiel importieren"
						leftIcon={<Ionicons name="clipboard-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						modalTitle="Spiel importieren"
						placeholder='{"name": "...", "icon": "🃏", "scoringMode": "highWins", "rules": {...}}'
						saveLabel="Importieren"
						multiline
						numberOfLines={10}
						textAlignVertical="top"
						checkTextInput={(value) => ({ isValid: parseGamePreset(value) !== null, value })}
						onSave={handleImportPreset}
						groupPosition="single"
					/>
				</View>
			),
		});
	}, [showModal, handleLoadFlipSeven, handleImportPreset]);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={styles.headerButtons}>
					<TouchableOpacity
						nativeID={ComponentIds.GAMES_SCREEN_IMPORT_BUTTON}
						onPress={handleOpenImportModal}
						style={styles.headerButton}
					>
						<Ionicons name="cloud-download-outline" size={22} color={theme.header.text} />
					</TouchableOpacity>
					<TouchableOpacity
						nativeID={ComponentIds.GAMES_SCREEN_ADD_BUTTON}
						onPress={handleAddGameType}
						style={styles.headerButton}
					>
						<Ionicons name="add-circle-outline" size={24} color={theme.header.text} />
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, theme.header.text, handleAddGameType, handleOpenImportModal]);

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
				{gameTypes.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name="dice-outline" size={64} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.text }]}>Noch keine Spiele</Text>
						<Text style={[styles.emptySubtext, { color: theme.screen.placeholder }]}>
							Lege ein Spiel (z.B. Skat, Phase 10, ...) über den + Button im Header an
						</Text>
					</View>
				) : filteredGameTypes.length === 0 ? (
					<Text style={[styles.emptySubtext, styles.noResultsText, { color: theme.screen.placeholder }]}>
						Kein Spiel gefunden für „{searchQuery}“.
					</Text>
				) : (
					filteredGameTypes.map((gameType, index) => {
						const count = matchCounts[gameType.id] ?? 0;
						return (
							<SettingsList
								key={gameType.id}
								nativeID={`${ComponentIds.GAMES_SCREEN_GAME_ROW_PREFIX}${gameType.id}`}
								leftIconComponent={
									<View style={styles.gameIconWrapper}>
										<GameTypeIcon icon={gameType.icon} size={56} />
									</View>
								}
								label={gameType.name}
								value={count === 1 ? '1 Partie' : `${count} Partien`}
								stackedValue
								rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
								handleFunction={() => router.push({ pathname: '/games/[id]', params: { id: gameType.id } })}
								groupPosition={index === 0 ? 'top' : index === filteredGameTypes.length - 1 ? 'bottom' : 'middle'}
							/>
						);
					})
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
