import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, SettingsListSelectOptionSingle, useTheme } from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { addGameTypeFromPreset, updateGameTypeFromPreset } from '../store/gameTypesSlice';
import { importFriends } from '../store/friendsSlice';
import { archiveGame } from '../store/gameHistorySlice';
import type { Friend } from '../helpers/FriendsStorage';
import type { ShareBundle } from '../helpers/ShareCodec';
import { decodeShareText } from '../helpers/ShareCodec';
import type { FriendConflictChoice, GameConflictChoice, ImportMode, ImportPlan } from '../helpers/ShareImportPlan';
import { buildImportPlan, dedupedFriendName, remapSharedMatch } from '../helpers/ShareImportPlan';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';
const WARNING_COLOR = '#f59e0b';

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getGroupPosition(index: number, total: number): 'top' | 'middle' | 'bottom' | 'single' {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/** What the paste field accepts on this surface - shown as the intro hint. */
function importHint(mode: ImportMode): string {
	switch (mode) {
		case 'games':
			return 'Füge hier einen Export ein - es werden nur die enthaltenen Spiele importiert. Auch aus dem Export einer ganzen Partie wird hier nur das Spiel übernommen.';
		case 'friends':
			return 'Füge hier einen Export ein - es werden nur die enthaltenen Freunde importiert. Auch aus dem Export einer ganzen Partie werden hier nur die Freunde übernommen.';
		default:
			return 'Ein anderer Spieler kann eine Partie teilen: Partie öffnen → ⚙️ Optionen → „Partie exportieren“. Der Export landet in seiner Zwischenablage und kann hier eingefügt werden - Spiel und Freunde werden dabei mit angelegt, falls sie noch fehlen.';
	}
}

/** Everything the plan would touch, for the "nothing matches this surface" check. */
function planIsEmpty(plan: ImportPlan): boolean {
	return plan.games.length === 0 && plan.friends.length === 0 && plan.matches.length === 0;
}

/**
 * Interactive import of a shared export string (see helpers/ShareCodec):
 * paste or load from the clipboard, review what the bundle contains, answer
 * the conflict questions (game version mismatch, same-named friend) and
 * import. `mode` narrows what is consumed - the games screen imports only
 * Spiele, the friends screen only Freunde, the start screen everything.
 */
export default function ShareImportContent({ mode, onClose }: Readonly<{ mode: ImportMode; onClose: () => void }>) {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const localGameTypes = useSelector((state: RootState) => state.gameTypes.gameTypes);
	const localFriends = useSelector((state: RootState) => state.friends.friends);

	const [text, setText] = useState('');
	const [bundle, setBundle] = useState<ShareBundle | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [gameChoices, setGameChoices] = useState<Record<number, GameConflictChoice>>({});
	const [friendChoices, setFriendChoices] = useState<Record<number, FriendConflictChoice>>({});
	const [summary, setSummary] = useState<string | null>(null);

	// The plan is derived, not stored: it stays consistent with the live store
	// even if games/friends change while the modal is open.
	const plan = useMemo(
		() => (bundle ? buildImportPlan(bundle, { localGameTypes, localFriends, mode }) : null),
		[bundle, localGameTypes, localFriends, mode],
	);

	const tryParse = useCallback(
		(candidate: string) => {
			setText(candidate);
			setSummary(null);
			if (candidate.trim() === '') {
				setBundle(null);
				setError(null);
				return;
			}
			const decoded = decodeShareText(candidate);
			if (!decoded) {
				setBundle(null);
				setError('Der Text ist kein gültiger Export.');
				return;
			}
			const decodedPlan = buildImportPlan(decoded, { localGameTypes, localFriends, mode });
			if (planIsEmpty(decodedPlan)) {
				setBundle(null);
				setError('In diesem Export ist nichts enthalten, das hier importiert werden kann.');
				return;
			}
			setBundle(decoded);
			setError(null);
			setGameChoices({});
			setFriendChoices({});
		},
		[localGameTypes, localFriends, mode],
	);

	const handleLoadClipboard = useCallback(async () => {
		const clipboardText = await Clipboard.getStringAsync();
		if (!clipboardText || clipboardText.trim() === '') {
			setError('Die Zwischenablage ist leer.');
			return;
		}
		tryParse(clipboardText);
	}, [tryParse]);

	const handleReset = useCallback(() => {
		setText('');
		setBundle(null);
		setError(null);
		setSummary(null);
	}, []);

	const handleImport = useCallback(() => {
		if (!plan) return;

		// Spiele first: matches need to know which local game they belong to.
		const gameIdMap: Record<string, string> = {};
		let gamesCreated = 0;
		let gamesUpdated = 0;
		plan.games.forEach((resolution, index) => {
			if (resolution.kind === 'create') {
				const action = dispatch(addGameTypeFromPreset(resolution.game));
				gamesCreated++;
				if (resolution.game.id) gameIdMap[resolution.game.id] = action.payload.id;
				return;
			}
			if (resolution.kind === 'versionConflict' && (gameChoices[index] ?? 'keepLocal') === 'updateLocal') {
				dispatch(updateGameTypeFromPreset({ gameTypeId: resolution.localGameType.id, preset: resolution.game }));
				gamesUpdated++;
			}
			if (resolution.game.id) gameIdMap[resolution.game.id] = resolution.localGameType.id;
		});

		// Freunde: merge/add per resolution and remember which local id each
		// imported id ended up as, so the match participants stay linked.
		const friendIdMap: Record<string, string> = {};
		const friendsToImport: Friend[] = [];
		let friendsLinked = 0;
		plan.friends.forEach((resolution, index) => {
			if (resolution.kind === 'existing') {
				friendsToImport.push(resolution.friend);
				friendIdMap[resolution.friend.id] = resolution.friend.id;
				return;
			}
			if (resolution.kind === 'new') {
				friendsToImport.push(resolution.friend);
				friendIdMap[resolution.friend.id] = resolution.friend.id;
				return;
			}
			const choice = friendChoices[index] ?? 'samePerson';
			if (choice === 'samePerson') {
				friendIdMap[resolution.friend.id] = resolution.localFriend.id;
				friendsLinked++;
			} else if (choice === 'newPerson') {
				friendsToImport.push(resolution.friend);
				friendIdMap[resolution.friend.id] = resolution.friend.id;
			} else {
				friendsToImport.push({ ...resolution.friend, name: dedupedFriendName(resolution.friend.name, localFriends) });
				friendIdMap[resolution.friend.id] = resolution.friend.id;
			}
		});
		if (friendsToImport.length > 0) dispatch(importFriends(friendsToImport));

		// Partien last, with all references remapped. `archiveGame` upserts by
		// id, so importing the same Partie again updates it instead of
		// duplicating it.
		for (const match of plan.matches) {
			dispatch(archiveGame(remapSharedMatch(match, { gameIdMap, friendIdMap })));
		}

		const parts: string[] = [];
		if (plan.matches.length > 0) parts.push(plan.matches.length === 1 ? '1 Partie' : `${plan.matches.length} Partien`);
		if (plan.games.length > 0) {
			const details: string[] = [];
			if (gamesCreated > 0) details.push(`${gamesCreated} neu`);
			if (gamesUpdated > 0) details.push(`${gamesUpdated} aktualisiert`);
			parts.push(`${plan.games.length === 1 ? '1 Spiel' : `${plan.games.length} Spiele`}${details.length > 0 ? ` (${details.join(', ')})` : ''}`);
		}
		if (plan.friends.length > 0) {
			const details: string[] = [];
			if (friendsToImport.length > 0) details.push(`${friendsToImport.length} übernommen`);
			if (friendsLinked > 0) details.push(`${friendsLinked} verknüpft`);
			parts.push(`${plan.friends.length === 1 ? '1 Freund' : `${plan.friends.length} Freunde`}${details.length > 0 ? ` (${details.join(', ')})` : ''}`);
		}
		setSummary(`Importiert: ${parts.join(' · ')}.`);
	}, [plan, gameChoices, friendChoices, localFriends, dispatch]);

	// ─── Done state ───────────────────────────────────────────────────────────

	if (summary) {
		return (
			<View style={styles.container}>
				<View style={[styles.summaryBanner, { backgroundColor: SUCCESS_COLOR }]}>
					<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
					<Text style={styles.summaryText}>{summary}</Text>
				</View>
				<TouchableOpacity
					id={ComponentIds.SHARE_IMPORT_DONE_BUTTON}
					style={[styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]}
					onPress={onClose}
					activeOpacity={0.8}
				>
					<Text style={styles.primaryButtonText}>Fertig</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// ─── Input state (nothing parsed yet) ─────────────────────────────────────

	if (!plan) {
		return (
			<View style={styles.container}>
				<Text style={[styles.hint, { color: theme.screen.placeholder }]}>{importHint(mode)}</Text>
				<TouchableOpacity
					id={ComponentIds.SHARE_IMPORT_CLIPBOARD_BUTTON}
					style={[styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]}
					onPress={handleLoadClipboard}
					activeOpacity={0.8}
				>
					<Ionicons name="clipboard-outline" size={18} color="#ffffff" />
					<Text style={styles.primaryButtonText}>Aus Zwischenablage laden</Text>
				</TouchableOpacity>
				<TextInput
					nativeID={ComponentIds.SHARE_IMPORT_TEXT_INPUT}
					style={[
						styles.textInput,
						{ color: theme.screen.text, borderColor: theme.screen.border, backgroundColor: theme.screen.background },
					]}
					placeholder="… oder Export hier einfügen"
					placeholderTextColor={theme.screen.placeholder}
					value={text}
					onChangeText={tryParse}
					multiline
					numberOfLines={4}
					textAlignVertical="top"
					autoCorrect={false}
					autoCapitalize="none"
				/>
				{error && <Text style={styles.errorText}>{error}</Text>}
			</View>
		);
	}

	// ─── Review state (parsed - show contents and conflict questions) ─────────

	return (
		<View style={styles.container}>
			{plan.matches.length > 0 && (
				<>
					<SettingsListGroupTitle title={plan.matches.length === 1 ? 'Partie' : `Partien (${plan.matches.length})`} />
					{plan.matches.map((match, index) => (
						<SettingsList
							key={match.id}
							label={`Partie vom ${formatDate(match.endedAt)}`}
							value={`${match.players.length === 1 ? '1 Spieler' : `${match.players.length} Spieler`} · ${
								match.roundsCount === 1 ? '1 Runde' : `${match.roundsCount} Runden`
							}`}
							stackedValue
							leftIcon={<Ionicons name="calendar-outline" size={20} color="#ffffff" />}
							iconBgColor={PRIMARY_COLOR}
							groupPosition={getGroupPosition(index, plan.matches.length)}
						/>
					))}
				</>
			)}

			{plan.games.length > 0 && (
				<>
					<SettingsListGroupTitle title={plan.games.length === 1 ? 'Spiel' : `Spiele (${plan.games.length})`} />
					{plan.games.map((resolution, index) => {
						const { game } = resolution;
						let value: string;
						if (resolution.kind === 'create') value = 'Wird neu angelegt';
						else if (resolution.kind === 'existing') value = `Bereits vorhanden (Version ${resolution.localGameType.version ?? 1})`;
						else value = `Version unterschiedlich: importiert ${resolution.importedVersion}, lokal ${resolution.localVersion}`;
						return (
							<View key={`${game.name}-${index}`}>
								<SettingsList
									nativeID={`${ComponentIds.SHARE_IMPORT_GAME_ROW_PREFIX}${index}`}
									label={`${game.icon} ${game.name}`}
									value={value}
									stackedValue
									leftIcon={<Ionicons name="dice-outline" size={20} color="#ffffff" />}
									iconBgColor={resolution.kind === 'versionConflict' ? WARNING_COLOR : PRIMARY_COLOR}
									groupPosition={resolution.kind === 'versionConflict' ? 'top' : 'single'}
								/>
								{resolution.kind === 'versionConflict' && (
									<>
										<SettingsListSelectOptionSingle
											nativeID={`${ComponentIds.SHARE_IMPORT_GAME_UPDATE_PREFIX}${index}`}
											label={`Spiel auf Version ${resolution.importedVersion} aktualisieren`}
											leftIcon={<Ionicons name="arrow-up-circle-outline" size={20} color="#ffffff" />}
											iconBgColor={PRIMARY_COLOR}
											isSelected={(gameChoices[index] ?? 'keepLocal') === 'updateLocal'}
											onPress={() => setGameChoices((choices) => ({ ...choices, [index]: 'updateLocal' }))}
											groupPosition="middle"
										/>
										<SettingsListSelectOptionSingle
											nativeID={`${ComponentIds.SHARE_IMPORT_GAME_KEEP_PREFIX}${index}`}
											label={`Lokale Version ${resolution.localVersion} behalten`}
											leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />}
											iconBgColor={PRIMARY_COLOR}
											isSelected={(gameChoices[index] ?? 'keepLocal') === 'keepLocal'}
											onPress={() => setGameChoices((choices) => ({ ...choices, [index]: 'keepLocal' }))}
											groupPosition="bottom"
										/>
									</>
								)}
							</View>
						);
					})}
				</>
			)}

			{plan.friends.length > 0 && (
				<>
					<SettingsListGroupTitle title={plan.friends.length === 1 ? 'Freund' : `Freunde (${plan.friends.length})`} />
					{plan.friends.map((resolution, index) => {
						const { friend } = resolution;
						let value: string;
						if (resolution.kind === 'existing') value = 'Bereits vorhanden - wird aktualisiert';
						else if (resolution.kind === 'new') value = 'Wird neu angelegt';
						else value = `Es gibt schon einen Freund namens „${resolution.localFriend.name}“ - gleiche Person?`;
						return (
							<View key={friend.id}>
								<SettingsList
									nativeID={`${ComponentIds.SHARE_IMPORT_FRIEND_ROW_PREFIX}${index}`}
									label={friend.name}
									value={value}
									stackedValue
									leftIcon={<Ionicons name="person-outline" size={20} color="#ffffff" />}
									iconBgColor={resolution.kind === 'nameConflict' ? WARNING_COLOR : PRIMARY_COLOR}
									groupPosition={resolution.kind === 'nameConflict' ? 'top' : 'single'}
								/>
								{resolution.kind === 'nameConflict' && (
									<>
										<SettingsListSelectOptionSingle
											nativeID={`${ComponentIds.SHARE_IMPORT_FRIEND_SAME_PREFIX}${index}`}
											label={`Gleiche Person wie „${resolution.localFriend.name}“`}
											leftIcon={<Ionicons name="git-merge-outline" size={20} color="#ffffff" />}
											iconBgColor={PRIMARY_COLOR}
											isSelected={(friendChoices[index] ?? 'samePerson') === 'samePerson'}
											onPress={() => setFriendChoices((choices) => ({ ...choices, [index]: 'samePerson' }))}
											groupPosition="middle"
										/>
										<SettingsListSelectOptionSingle
											nativeID={`${ComponentIds.SHARE_IMPORT_FRIEND_NEW_PREFIX}${index}`}
											label="Neue Person - Name behalten"
											leftIcon={<Ionicons name="person-add-outline" size={20} color="#ffffff" />}
											iconBgColor={PRIMARY_COLOR}
											isSelected={(friendChoices[index] ?? 'samePerson') === 'newPerson'}
											onPress={() => setFriendChoices((choices) => ({ ...choices, [index]: 'newPerson' }))}
											groupPosition="middle"
										/>
										<SettingsListSelectOptionSingle
											nativeID={`${ComponentIds.SHARE_IMPORT_FRIEND_RENAME_PREFIX}${index}`}
											label={`Neue Person - umbenennen in „${dedupedFriendName(friend.name, localFriends)}“`}
											leftIcon={<Ionicons name="pencil-outline" size={20} color="#ffffff" />}
											iconBgColor={PRIMARY_COLOR}
											isSelected={(friendChoices[index] ?? 'samePerson') === 'newPersonRenamed'}
											onPress={() => setFriendChoices((choices) => ({ ...choices, [index]: 'newPersonRenamed' }))}
											groupPosition="bottom"
										/>
									</>
								)}
							</View>
						);
					})}
				</>
			)}

			<TouchableOpacity
				id={ComponentIds.SHARE_IMPORT_SUBMIT_BUTTON}
				style={[styles.primaryButton, { backgroundColor: SUCCESS_COLOR }]}
				onPress={handleImport}
				activeOpacity={0.8}
			>
				<Ionicons name="download-outline" size={18} color="#ffffff" />
				<Text style={styles.primaryButtonText}>Importieren</Text>
			</TouchableOpacity>
			<TouchableOpacity id={ComponentIds.SHARE_IMPORT_RESET_BUTTON} style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.7}>
				<Text style={[styles.secondaryButtonText, { color: theme.screen.placeholder }]}>Anderen Export einfügen</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
		gap: 10,
	},
	hint: {
		fontSize: 13,
		lineHeight: 19,
		paddingHorizontal: 4,
	},
	primaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 46,
		borderRadius: 10,
	},
	primaryButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	secondaryButton: {
		alignItems: 'center',
		paddingVertical: 8,
	},
	secondaryButtonText: {
		fontSize: 13,
		fontWeight: '600',
	},
	textInput: {
		borderWidth: 1,
		borderRadius: 10,
		minHeight: 88,
		padding: 10,
		fontSize: 13,
	},
	errorText: {
		color: '#dc2626',
		fontSize: 13,
		paddingHorizontal: 4,
	},
	summaryBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	summaryText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
		flexShrink: 1,
	},
});
