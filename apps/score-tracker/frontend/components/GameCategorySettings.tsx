import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	SettingsListTextInput,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import {
	addGameCategory,
	addGameCategoryOption,
	moveGameCategory,
	removeGameCategory,
	removeGameCategoryOption,
	renameGameCategory,
	renameGameCategoryOption,
	setGameCategoryComputed,
	setGameCategoryOptionImage,
	setGameCategoryScope,
	setGameCategoryType,
} from '../store/gameTypesSlice';
import { ImagePickerUnavailableError, describeImageSize, pickGameImageAsDataUri } from '../helpers/GameImageUpload';
import type { PickImageSource } from '../helpers/GameImageUpload';
import type { AppDispatch, RootState } from '../store/store';
import type { GameCategory, GameCategoryScope, GameCategoryType } from '../helpers/GameCategories';
import {
	GAME_CATEGORY_SCOPES,
	GAME_CATEGORY_SCOPE_LABELS,
	GAME_CATEGORY_TYPES,
	GAME_CATEGORY_TYPE_HINTS,
	GAME_CATEGORY_TYPE_LABELS,
	durationSourceCandidates,
	isComputedCategory,
} from '../helpers/GameCategories';
import { ComponentIds } from '../constants/ComponentIds';
import { categoryTypeIcon, EnumOptionImage, EnumOptionsRawDataRow } from './CategoryValueRows';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';
const NEUTRAL_COLOR = '#6b7280';
const DEBUG_COLOR = '#7c3aed';

function groupPositionFor(index: number, total: number): 'top' | 'middle' | 'bottom' | 'single' {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/** Short "Auswahl · Spieler" summary shown on a category row. */
function describeCategory(category: GameCategory): string {
	const parts = [GAME_CATEGORY_TYPE_LABELS[category.type], GAME_CATEGORY_SCOPE_LABELS[category.scope]];
	if (isComputedCategory(category)) parts.push('berechnet');
	if (category.type === 'enum') parts.push(`${(category.options ?? []).length} Optionen`);
	return parts.join(' · ');
}

// ─── Duration source picker (nested modal content) ────────────────────────────

function DurationSourceContent({
	candidates,
	selectedId,
	onSelect,
}: Readonly<{ candidates: GameCategory[]; selectedId: string | undefined; onSelect: (categoryId: string) => void }>) {
	const { theme } = useTheme();
	if (candidates.length === 0) {
		return (
			<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
				Keine passende Kategorie vorhanden. Lege zuerst zwei Kategorien vom Typ „Uhrzeit“, „Datum“ oder „Zahl“ im selben Bereich an.
			</Text>
		);
	}
	return (
		<View style={styles.modalContent}>
			{candidates.map((candidate, index) => (
				<SettingsListSelectOptionSingle
					key={candidate.id}
					label={candidate.name}
					leftIcon={categoryTypeIcon(candidate.type)}
					iconBgColor={PRIMARY_COLOR}
					isSelected={selectedId === candidate.id}
					onPress={() => onSelect(candidate.id)}
					groupPosition={groupPositionFor(index, candidates.length)}
				/>
			))}
		</View>
	);
}

// ─── Enum option image (nested modal content, live-updating) ──────────────────
//
// Each enum option can carry its own small picture (e.g. the portrait of a
// "Villen des Wahnsinns" investigator), stored inline as base64 like the
// game's own uploaded image - see `GameCategoryOption.imageBase64`.

function EnumOptionImageContent({
	gameTypeId,
	categoryId,
	optionId,
	onDone,
}: Readonly<{ gameTypeId: string; categoryId: string; optionId: string; onDone: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const option = useSelector((state: RootState) =>
		state.gameTypes.gameTypes
			.find((g) => g.id === gameTypeId)
			?.categories?.find((c) => c.id === categoryId)
			?.options?.find((o) => o.id === optionId),
	);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const handlePick = useCallback(
		async (source: PickImageSource) => {
			setUploadError(null);
			setIsUploading(true);
			try {
				const dataUri = await pickGameImageAsDataUri(source);
				if (dataUri) {
					dispatch(setGameCategoryOptionImage({ gameTypeId, categoryId, optionId, imageBase64: dataUri }));
					onDone();
				}
			} catch (err) {
				console.warn('[GameCategorySettings] option image failed:', err);
				setUploadError(err instanceof ImagePickerUnavailableError ? err.message : 'Das Bild konnte nicht übernommen werden.');
			} finally {
				setIsUploading(false);
			}
		},
		[dispatch, gameTypeId, categoryId, optionId, onDone],
	);

	if (!option) return null;
	const imageBase64 = option.imageBase64 ?? null;

	return (
		<View style={styles.modalContent}>
			<SettingsList
				nativeID={ComponentIds.GAME_CATEGORY_OPTION_IMAGE_PICK_ROW}
				label="Bild auswählen"
				value={
					imageBase64
						? `Eigenes Bild gespeichert (${describeImageSize(imageBase64)})`
						: 'Aus der Galerie, wird verkleinert gespeichert'
				}
				stackedValue
				leftIcon={imageBase64 ? <EnumOptionImage imageBase64={imageBase64} /> : <Ionicons name="image-outline" size={20} color="#ffffff" />}
				iconBgColor={imageBase64 ? '#ffffff' : PRIMARY_COLOR}
				rightElement={isUploading ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : undefined}
				handleFunction={isUploading ? undefined : () => handlePick('library')}
				groupPosition="top"
			/>
			<SettingsList
				nativeID={ComponentIds.GAME_CATEGORY_OPTION_IMAGE_CAMERA_ROW}
				label="Foto aufnehmen"
				leftIcon={<Ionicons name="camera-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				handleFunction={isUploading ? undefined : () => handlePick('camera')}
				groupPosition={imageBase64 ? 'middle' : 'bottom'}
			/>
			{imageBase64 && (
				<SettingsList
					nativeID={ComponentIds.GAME_CATEGORY_OPTION_IMAGE_REMOVE_ROW}
					label="Bild entfernen"
					leftIcon={<Ionicons name="close-circle-outline" size={20} color="#ffffff" />}
					iconBgColor={DANGER_COLOR}
					handleFunction={() => {
						dispatch(setGameCategoryOptionImage({ gameTypeId, categoryId, optionId, imageBase64: null }));
						onDone();
					}}
					groupPosition="bottom"
				/>
			)}
			{uploadError !== null && <Text style={[styles.hint, { color: DANGER_COLOR }]}>{uploadError}</Text>}
		</View>
	);
}

// ─── Enum option list (part of the editor modal) ──────────────────────────────

function EnumOptionsEditor({ gameTypeId, category }: Readonly<{ gameTypeId: string; category: GameCategory }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { show, close } = useMyScrollViewModal();
	const options = category.options ?? [];

	const handleOpenImageModal = useCallback(
		(optionId: string, optionLabel: string) => {
			show({
				title: `Bild: ${optionLabel}`,
				children: <EnumOptionImageContent gameTypeId={gameTypeId} categoryId={category.id} optionId={optionId} onDone={close} />,
			});
		},
		[show, close, gameTypeId, category.id],
	);

	return (
		<>
			<SettingsListGroupTitle title="Optionen" />
			{options.map((option, index) => (
				<SettingsListTextInput
					key={option.id}
					label={option.label}
					value=""
					leftIcon={
						option.imageBase64 ? (
							<EnumOptionImage imageBase64={option.imageBase64} />
						) : (
							<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#ffffff" />
						)
					}
					iconBgColor={option.imageBase64 ? '#ffffff' : PRIMARY_COLOR}
					modalTitle="Option"
					placeholder="Name der Option"
					saveLabel="Übernehmen"
					initialValue={option.label}
					onSave={(label) => {
						dispatch(renameGameCategoryOption({ gameTypeId, categoryId: category.id, optionId: option.id, label }));
					}}
					rightElement={
						<View style={styles.optionActions}>
							<TouchableOpacity
								nativeID={`${ComponentIds.GAME_CATEGORY_OPTION_IMAGE_BUTTON_PREFIX}${option.id}`}
								onPress={() => handleOpenImageModal(option.id, option.label)}
								hitSlop={8}
							>
								<Ionicons name="image-outline" size={20} color={option.imageBase64 ? PRIMARY_COLOR : NEUTRAL_COLOR} />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => dispatch(removeGameCategoryOption({ gameTypeId, categoryId: category.id, optionId: option.id }))}
								hitSlop={8}
							>
								<Ionicons name="trash-outline" size={20} color={DANGER_COLOR} />
							</TouchableOpacity>
						</View>
					}
					groupPosition={index === 0 ? 'top' : 'middle'}
				/>
			))}
			<SettingsListTextInput
				nativeID={ComponentIds.GAME_CATEGORY_ADD_OPTION_ROW}
				label="Option hinzufügen"
				leftIcon={<Ionicons name="add-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Neue Option"
				placeholder="z.B. Unentschieden"
				saveLabel="Hinzufügen"
				checkTextInput={(value) => ({ isValid: value.trim() !== '', value })}
				onSave={(label) => {
					dispatch(addGameCategoryOption({ gameTypeId, categoryId: category.id, label: label.trim() }));
				}}
				groupPosition="middle"
			/>
			{/* The whole option list as copy/paste JSON, e.g. to let an AI
			    generate the remaining options - see EnumOptionsRawDataRow. */}
			<EnumOptionsRawDataRow gameTypeId={gameTypeId} category={category} groupPosition="bottom" />
		</>
	);
}

// ─── Computed duration settings (part of the editor modal) ────────────────────

function ComputedDurationEditor({
	gameTypeId,
	category,
	categories,
}: Readonly<{ gameTypeId: string; category: GameCategory; categories: GameCategory[] }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { show, close } = useMyScrollViewModal();
	const candidates = durationSourceCandidates(categories, category);
	const computed = category.computed ?? null;
	const from = categories.find((c) => c.id === computed?.fromCategoryId);
	const to = categories.find((c) => c.id === computed?.toCategoryId);

	const handlePick = useCallback(
		(edge: 'from' | 'to') => {
			show({
				title: edge === 'from' ? 'Startet mit' : 'Endet mit',
				children: (
					<DurationSourceContent
						candidates={candidates}
						selectedId={edge === 'from' ? computed?.fromCategoryId : computed?.toCategoryId}
						onSelect={(categoryId) => {
							dispatch(
								setGameCategoryComputed({
									gameTypeId,
									categoryId: category.id,
									computed: {
										fromCategoryId: edge === 'from' ? categoryId : computed?.fromCategoryId ?? categoryId,
										toCategoryId: edge === 'to' ? categoryId : computed?.toCategoryId ?? categoryId,
									},
								}),
							);
							close();
						}}
					/>
				),
			});
		},
		[show, close, dispatch, gameTypeId, category.id, candidates, computed],
	);

	const handleToggleComputed = useCallback(() => {
		if (computed) {
			dispatch(setGameCategoryComputed({ gameTypeId, categoryId: category.id, computed: null }));
			return;
		}
		if (candidates.length < 2) return;
		dispatch(
			setGameCategoryComputed({
				gameTypeId,
				categoryId: category.id,
				computed: { fromCategoryId: candidates[0].id, toCategoryId: candidates[1].id },
			}),
		);
	}, [computed, candidates, dispatch, gameTypeId, category.id]);

	return (
		<>
			<SettingsListGroupTitle title="Berechnung" />
			<SettingsList
				nativeID={ComponentIds.GAME_CATEGORY_COMPUTED_TOGGLE}
				label={computed ? 'Berechnung entfernen' : 'Automatisch berechnen'}
				value={
					computed
						? 'Dauer ergibt sich aus zwei Kategorien'
						: candidates.length < 2
							? 'Benötigt zwei Kategorien vom Typ Uhrzeit/Datum/Zahl'
							: 'Dauer aus Start und Ende berechnen'
				}
				stackedValue
				leftIcon={<Ionicons name={computed ? 'close-circle-outline' : 'calculator-outline'} size={20} color="#ffffff" />}
				iconBgColor={computed ? DANGER_COLOR : PRIMARY_COLOR}
				handleFunction={candidates.length < 2 && !computed ? undefined : handleToggleComputed}
				groupPosition={computed ? 'top' : 'single'}
			/>
			{computed && (
				<>
					<SettingsList
						label="Startet mit"
						value={from?.name ?? 'Nicht gewählt'}
						leftIcon={<Ionicons name="play-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={() => handlePick('from')}
						groupPosition="middle"
					/>
					<SettingsList
						label="Endet mit"
						value={to?.name ?? 'Nicht gewählt'}
						leftIcon={<Ionicons name="stop-outline" size={20} color="#ffffff" />}
						iconBgColor={PRIMARY_COLOR}
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={() => handlePick('to')}
						groupPosition="bottom"
					/>
				</>
			)}
		</>
	);
}

// ─── Category editor (modal content, live-updating) ───────────────────────────
//
// Subscribes to the store itself (rather than closing over the category it was
// opened with) so every edit is reflected immediately while the modal stays
// open - same pattern as the scoring-mode/starting-player sections.

export function GameCategoryEditorContent({
	gameTypeId,
	categoryId,
	onDeleted,
}: Readonly<{ gameTypeId: string; categoryId: string; onDeleted: () => void }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const categories = useSelector(
		(state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId)?.categories ?? [],
	);
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const category = categories.find((c) => c.id === categoryId);

	if (!category) return null;

	return (
		<View style={styles.modalContent}>
			<SettingsListTextInput
				nativeID={ComponentIds.GAME_CATEGORY_NAME_ROW}
				label="Name"
				value={category.name}
				leftIcon={<MaterialCommunityIcons name="rename-box" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Name der Kategorie"
				placeholder="z.B. Startzeit"
				saveLabel="Übernehmen"
				initialValue={category.name}
				checkTextInput={(value) => ({ isValid: value.trim() !== '', value })}
				onSave={(name) => {
					dispatch(renameGameCategory({ gameTypeId, categoryId, name: name.trim() }));
				}}
				groupPosition="single"
			/>

			<SettingsListGroupTitle title="Typ" />
			{GAME_CATEGORY_TYPES.map((type, index) => (
				<SettingsListSelectOptionSingle
					key={type}
					nativeID={`${ComponentIds.GAME_CATEGORY_TYPE_ROW_PREFIX}${type}`}
					label={`${GAME_CATEGORY_TYPE_LABELS[type]} — ${GAME_CATEGORY_TYPE_HINTS[type]}`}
					leftIcon={categoryTypeIcon(type)}
					iconBgColor={PRIMARY_COLOR}
					isSelected={category.type === type}
					onPress={() => dispatch(setGameCategoryType({ gameTypeId, categoryId, type: type as GameCategoryType }))}
					groupPosition={groupPositionFor(index, GAME_CATEGORY_TYPES.length)}
				/>
			))}

			<SettingsListGroupTitle title="Wird erfasst für" />
			{GAME_CATEGORY_SCOPES.map((scope, index) => (
				<SettingsListSelectOptionSingle
					key={scope}
					nativeID={`${ComponentIds.GAME_CATEGORY_SCOPE_ROW_PREFIX}${scope}`}
					label={scope === 'match' ? 'Die ganze Partie (einmal pro Spiel)' : 'Jeden Spieler einzeln'}
					leftIcon={<Ionicons name={scope === 'match' ? 'game-controller-outline' : 'people-outline'} size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					isSelected={category.scope === scope}
					onPress={() => dispatch(setGameCategoryScope({ gameTypeId, categoryId, scope: scope as GameCategoryScope }))}
					groupPosition={groupPositionFor(index, GAME_CATEGORY_SCOPES.length)}
				/>
			))}

			{category.type === 'enum' && <EnumOptionsEditor gameTypeId={gameTypeId} category={category} />}
			{category.type === 'duration' && (
				<ComputedDurationEditor gameTypeId={gameTypeId} category={category} categories={categories} />
			)}

			{/* Recorded matches only ever store ids (category id, and for an
			    enum the option id), never the texts - so renaming here rewrites
			    what every past match displays, without touching its data. */}
			<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
				Namen und Optionen können jederzeit umbenannt werden: Partien speichern nur die ID der Kategorie (und bei einer Auswahl die ID der
				Option), der Text kommt immer aus dem Spiel. Wird eine Option gelöscht, verlieren bereits erfasste Partien nur deren Anzeige.
			</Text>

			{debugMode && (
				<>
					<SettingsListGroupTitle title="Debug" />
					<SettingsList
						nativeID={ComponentIds.GAME_CATEGORY_ID_ROW}
						label="ID"
						value={category.id}
						leftIcon={<MaterialCommunityIcons name="identifier" size={20} color="#ffffff" />}
						iconBgColor={DEBUG_COLOR}
						groupPosition={category.type === 'enum' ? 'top' : 'single'}
					/>
					{category.type === 'enum' &&
						(category.options ?? []).map((option, index, all) => (
							<SettingsList
								key={option.id}
								label={option.label}
								value={option.id}
								leftIcon={<MaterialCommunityIcons name="identifier" size={20} color="#ffffff" />}
								iconBgColor={DEBUG_COLOR}
								groupPosition={index === all.length - 1 ? 'bottom' : 'middle'}
							/>
						))}
				</>
			)}

			<SettingsListGroupTitle title="Entfernen" />
			<SettingsList
				nativeID={ComponentIds.GAME_CATEGORY_DELETE_BUTTON}
				label="Kategorie löschen"
				leftIcon={<Ionicons name="trash-outline" size={20} color="#ffffff" />}
				iconBgColor={DANGER_COLOR}
				handleFunction={() => {
					dispatch(removeGameCategory({ gameTypeId, categoryId }));
					onDeleted();
				}}
				groupPosition="single"
			/>
		</View>
	);
}

// ─── Category list (game detail screen section) ───────────────────────────────

/**
 * The "Kategorien" section of the game detail screen: everything a game tracks
 * beyond the points (see helpers/GameCategories), with reordering, an editor
 * per category and an add row.
 */
export default function GameCategorySettings({ gameTypeId }: Readonly<{ gameTypeId: string }>) {
	const dispatch = useDispatch<AppDispatch>();
	const { theme } = useTheme();
	const { show, close } = useMyScrollViewModal();
	const categories = useSelector(
		(state: RootState) => state.gameTypes.gameTypes.find((g) => g.id === gameTypeId)?.categories ?? [],
	);

	const handleOpenEditor = useCallback(
		(category: GameCategory) => {
			show({
				title: category.name,
				children: <GameCategoryEditorContent gameTypeId={gameTypeId} categoryId={category.id} onDeleted={close} />,
			});
		},
		[show, close, gameTypeId],
	);

	// New categories start as a plain match-scope text field; type and scope are
	// then set in the editor. (The editor deliberately isn't opened right away:
	// the add row's own input sheet closes itself *after* onSave returns, which
	// would immediately pop a modal opened from here again.)
	const handleAddCategory = useCallback(
		(name: string) => {
			const trimmed = name.trim();
			if (trimmed === '') return;
			dispatch(addGameCategory({ gameTypeId, name: trimmed, type: 'text', scope: 'match' }));
		},
		[dispatch, gameTypeId],
	);

	return (
		<>
			{categories.length === 0 && (
				<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
					Noch keine Kategorien. Lege z.B. „Startzeit“, „Gespielte Karte“ oder „Spielstatus“ an, um mehr als nur Punkte festzuhalten.
				</Text>
			)}
			{categories.map((category, index) => (
				<SettingsList
					key={category.id}
					nativeID={`${ComponentIds.GAME_CATEGORY_ROW_PREFIX}${category.id}`}
					label={category.name}
					value={describeCategory(category)}
					stackedValue
					leftIcon={categoryTypeIcon(category.type)}
					iconBgColor={category.scope === 'player' ? NEUTRAL_COLOR : PRIMARY_COLOR}
					rightElement={
						<View style={styles.reorderButtons}>
							<TouchableOpacity
								nativeID={`${ComponentIds.GAME_CATEGORY_MOVE_UP_PREFIX}${category.id}`}
								onPress={() => dispatch(moveGameCategory({ gameTypeId, categoryId: category.id, direction: 'up' }))}
								disabled={index === 0}
								hitSlop={8}
								style={styles.reorderButton}
							>
								<Ionicons name="chevron-up" size={18} color={index === 0 ? theme.screen.border : theme.screen.text} />
							</TouchableOpacity>
							<TouchableOpacity
								nativeID={`${ComponentIds.GAME_CATEGORY_MOVE_DOWN_PREFIX}${category.id}`}
								onPress={() => dispatch(moveGameCategory({ gameTypeId, categoryId: category.id, direction: 'down' }))}
								disabled={index === categories.length - 1}
								hitSlop={8}
								style={styles.reorderButton}
							>
								<Ionicons
									name="chevron-down"
									size={18}
									color={index === categories.length - 1 ? theme.screen.border : theme.screen.text}
								/>
							</TouchableOpacity>
							<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
						</View>
					}
					handleFunction={() => handleOpenEditor(category)}
					groupPosition={index === 0 ? 'top' : 'middle'}
				/>
			))}
			<SettingsListTextInput
				nativeID={ComponentIds.GAME_CATEGORY_ADD_ROW}
				label="Kategorie hinzufügen"
				leftIcon={<Ionicons name="add-circle-outline" size={20} color="#ffffff" />}
				iconBgColor={PRIMARY_COLOR}
				modalTitle="Neue Kategorie"
				placeholder="z.B. Startzeit"
				saveLabel="Hinzufügen"
				checkTextInput={(value) => ({ isValid: value.trim() !== '', value })}
				onSave={handleAddCategory}
				groupPosition={categories.length === 0 ? 'single' : 'bottom'}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	modalContent: {
		padding: 10,
	},
	hint: {
		fontSize: 13,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	reorderButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	reorderButton: {
		padding: 2,
	},
	optionActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});
