import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
	SettingsList,
	SettingsListBoolean,
	SettingsListDate,
	SettingsListNumberInput,
	SettingsListSelectOptionSingle,
	SettingsListTextInput,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import type { GameCategory, GameCategoryType, GameCategoryValue, GameCategoryValues } from '../helpers/GameCategories';
import {
	displayDateToIso,
	enumOptionsToRawData,
	formatCategoryValue,
	formatDuration,
	isComputedCategory,
	isoDateToDisplay,
	parseEnumOptionsRawData,
	parseTimeToMinutes,
	timeFromTimestamp,
} from '../helpers/GameCategories';
import { addGameCategoryOption, setGameCategoryOptions } from '../store/gameTypesSlice';
import type { AppDispatch, RootState } from '../store/store';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';

/** Icon shown next to a category row, picked by its value type. */
export function categoryTypeIcon(type: GameCategoryType): React.ReactNode {
	switch (type) {
		case 'enum':
			return <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#ffffff" />;
		case 'boolean':
			return <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />;
		case 'number':
			return <MaterialCommunityIcons name="numeric" size={20} color="#ffffff" />;
		case 'date':
			return <Ionicons name="calendar-outline" size={20} color="#ffffff" />;
		case 'time':
			return <Ionicons name="time-outline" size={20} color="#ffffff" />;
		case 'duration':
			return <Ionicons name="hourglass-outline" size={20} color="#ffffff" />;
		case 'text':
			return <MaterialCommunityIcons name="text" size={20} color="#ffffff" />;
	}
}

function groupPositionFor(index: number, total: number): 'top' | 'middle' | 'bottom' | 'single' {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

// ─── Enum option raw data (shared "Rohdaten" row) ─────────────────────────────
//
// Sits at the bottom of every place enum options can be managed (the category
// editor in the game settings and the entry-time picker): the whole option
// list as JSON. Copy it out (the copy button puts it on the clipboard), let
// e.g. an AI generate the remaining investigators/scenarios based on what is
// already there, and paste the full list back in - entries pasted with their
// exported id keep it, so recorded matches keep their reference, while plain
// strings or id-less entries become new options.

export function EnumOptionsRawDataRow({
	gameTypeId,
	category,
	groupPosition,
}: Readonly<{
	gameTypeId: string;
	category: GameCategory;
	groupPosition: 'top' | 'middle' | 'bottom' | 'single';
}>) {
	const dispatch = useDispatch<AppDispatch>();
	const options = category.options ?? [];

	const handleCopy = useCallback(async () => {
		await Clipboard.setStringAsync(enumOptionsToRawData(options));
	}, [options]);

	const handleApply = useCallback(
		(value: string) => {
			const parsed = parseEnumOptionsRawData(value);
			if (!parsed) return;
			dispatch(setGameCategoryOptions({ gameTypeId, categoryId: category.id, options: parsed }));
		},
		[dispatch, gameTypeId, category.id],
	);

	return (
		<SettingsListTextInput
			nativeID={`${ComponentIds.CATEGORY_OPTIONS_RAW_DATA_PREFIX}${category.id}`}
			label="Rohdaten"
			value={options.length === 1 ? '1 Option als JSON' : `${options.length} Optionen als JSON`}
			leftIcon={<MaterialCommunityIcons name="code-json" size={20} color="#ffffff" />}
			iconBgColor="#6b7280"
			modalTitle={`Rohdaten: ${category.name}`}
			placeholder='[{"id": "...", "label": "Gewonnen"}, "Neue Option"]'
			saveLabel="Übernehmen"
			initialValue={enumOptionsToRawData(options)}
			multiline
			numberOfLines={12}
			textAlignVertical="top"
			checkTextInput={(value) => ({ isValid: parseEnumOptionsRawData(value) !== null, value })}
			onSave={handleApply}
			rightElement={
				<TouchableOpacity onPress={handleCopy} hitSlop={8}>
					<MaterialCommunityIcons name="content-copy" size={20} color="#9ca3af" />
				</TouchableOpacity>
			}
			groupPosition={groupPosition}
		/>
	);
}

// ─── Enum picker (modal content) ──────────────────────────────────────────────
//
// When the category belongs to a known game type (`gameTypeId` set), the picker
// subscribes to the store so it always shows the live option list - and offers
// creating a new option right here, so a missing value (e.g. a new "Typ
// gewonnen" outcome) can be added during entry without a detour through the
// game's settings. The new option is selected immediately.

function EnumOptionsContent({
	category: categoryProp,
	gameTypeId,
	selectedOptionId,
	onSelect,
}: Readonly<{
	category: GameCategory;
	/** Game type owning the category - enables adding new options in place. */
	gameTypeId?: string;
	selectedOptionId: string | null;
	onSelect: (optionId: string | null) => void;
}>) {
	const dispatch = useDispatch<AppDispatch>();
	const liveCategory = useSelector((state: RootState) =>
		gameTypeId
			? state.gameTypes.gameTypes.find((g) => g.id === gameTypeId)?.categories?.find((c) => c.id === categoryProp.id)
			: undefined,
	);
	const category = liveCategory ?? categoryProp;
	const options = category.options ?? [];
	return (
		<View style={styles.modalContent}>
			{options.map((option, index) => (
				<SettingsListSelectOptionSingle
					key={option.id}
					nativeID={`${ComponentIds.CATEGORY_VALUE_ENUM_OPTION_PREFIX}${category.id}-${option.id}`}
					label={option.label}
					leftIcon={<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					isSelected={selectedOptionId === option.id}
					onPress={() => onSelect(option.id)}
					groupPosition={groupPositionFor(index, options.length)}
				/>
			))}
			{gameTypeId && (
				<SettingsListTextInput
					nativeID={`${ComponentIds.CATEGORY_VALUE_ENUM_ADD_OPTION_PREFIX}${category.id}`}
					label="Neue Option hinzufügen"
					leftIcon={<Ionicons name="add-outline" size={20} color="#ffffff" />}
					iconBgColor={PRIMARY_COLOR}
					modalTitle="Neue Option"
					placeholder="z.B. Unentschieden"
					saveLabel="Hinzufügen"
					checkTextInput={(value) => ({ isValid: value.trim() !== '', value })}
					onSave={(label) => {
						const action = dispatch(addGameCategoryOption({ gameTypeId, categoryId: category.id, label: label.trim() }));
						onSelect(action.payload.option.id);
					}}
					groupPosition="single"
				/>
			)}
			<SettingsList
				label="Keine Angabe"
				leftIcon={<Ionicons name="close-circle-outline" size={20} color="#ffffff" />}
				iconBgColor="#6b7280"
				handleFunction={() => onSelect(null)}
				groupPosition="single"
			/>
			{gameTypeId && <EnumOptionsRawDataRow gameTypeId={gameTypeId} category={category} groupPosition="single" />}
		</View>
	);
}

// ─── Single value row ─────────────────────────────────────────────────────────

export function CategoryValueRow({
	category,
	value,
	allCategories,
	onChange,
	groupPosition,
	gameTypeId,
	readOnly,
}: Readonly<{
	category: GameCategory;
	value: GameCategoryValue | undefined;
	allCategories: GameCategory[];
	onChange: (value: GameCategoryValue) => void;
	groupPosition: 'top' | 'middle' | 'bottom' | 'single';
	/** Game type owning the categories - lets the enum picker add new options in place. */
	gameTypeId?: string;
	/** Render the recorded value without any way to change it (viewing a finished match). */
	readOnly?: boolean;
}>) {
	const { show, close } = useMyScrollViewModal();
	const nativeID = `${ComponentIds.CATEGORY_VALUE_ROW_PREFIX}${category.id}`;
	const leftIcon = categoryTypeIcon(category.type);

	const handleOpenEnumModal = useCallback(() => {
		show({
			title: category.name,
			children: (
				<EnumOptionsContent
					category={category}
					gameTypeId={gameTypeId}
					selectedOptionId={typeof value === 'string' ? value : null}
					onSelect={(optionId) => {
						onChange(optionId);
						close();
					}}
				/>
			),
		});
	}, [show, close, category, gameTypeId, value, onChange]);

	// Viewing a finished match: every category renders as a plain value row.
	if (readOnly && !isComputedCategory(category)) {
		return (
			<SettingsList
				nativeID={nativeID}
				label={category.name}
				value={formatCategoryValue(category, value)}
				leftIcon={leftIcon}
				iconBgColor="#6b7280"
				groupPosition={groupPosition}
			/>
		);
	}

	// A computed duration is derived from two other categories and can only be
	// changed by changing those, so it renders as a plain read-only row.
	if (isComputedCategory(category)) {
		const from = allCategories.find((c) => c.id === category.computed?.fromCategoryId);
		const to = allCategories.find((c) => c.id === category.computed?.toCategoryId);
		return (
			<SettingsList
				nativeID={nativeID}
				label={category.name}
				value={
					typeof value === 'number'
						? formatDuration(value)
						: `Ergibt sich aus ${from?.name ?? '?'} → ${to?.name ?? '?'}`
				}
				leftIcon={leftIcon}
				iconBgColor="#6b7280"
				groupPosition={groupPosition}
			/>
		);
	}

	switch (category.type) {
		case 'enum':
			return (
				<SettingsList
					nativeID={nativeID}
					label={category.name}
					value={formatCategoryValue(category, value)}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenEnumModal}
					groupPosition={groupPosition}
				/>
			);
		case 'boolean':
			return (
				<SettingsListBoolean
					nativeID={nativeID}
					label={category.name}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					isEnabled={value === true}
					valueActive="Ja"
					valueInactive="Nein"
					onToggle={() => onChange(value !== true)}
					groupPosition={groupPosition}
				/>
			);
		case 'number':
			return (
				<SettingsListNumberInput
					nativeID={nativeID}
					label={category.name}
					value={formatCategoryValue(category, value)}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					modalTitle={category.name}
					placeholder="z.B. 3"
					initialValue={typeof value === 'number' ? value : undefined}
					onSave={(next) => onChange(next)}
					allowDisable
					disableLabel="Leeren"
					onDisable={() => onChange(null)}
					groupPosition={groupPosition}
				/>
			);
		case 'duration':
			return (
				<SettingsListNumberInput
					nativeID={nativeID}
					label={category.name}
					value={formatCategoryValue(category, value)}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					modalTitle={`${category.name} (Minuten)`}
					placeholder="z.B. 90"
					suffix=" min"
					min={0}
					max={100000}
					initialValue={typeof value === 'number' ? value : undefined}
					onSave={(next) => onChange(next)}
					allowDisable
					disableLabel="Leeren"
					onDisable={() => onChange(null)}
					groupPosition={groupPosition}
				/>
			);
		case 'date':
			return (
				<SettingsListDate
					nativeID={nativeID}
					id={category.id}
					label={category.name}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					value={typeof value === 'string' ? isoDateToDisplay(value) : ''}
					saveLabel="Übernehmen"
					onChange={(_id, next) => onChange(displayDateToIso(next))}
					onError={() => undefined}
					groupPosition={groupPosition}
				/>
			);
		case 'time':
			return (
				<SettingsListTextInput
					nativeID={nativeID}
					label={category.name}
					value={formatCategoryValue(category, value)}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					modalTitle={category.name}
					placeholder="HH:MM"
					keyboardType="numbers-and-punctuation"
					saveLabel="Übernehmen"
					initialValue={typeof value === 'string' ? value : ''}
					// An empty input clears the value again; anything else has to
					// be a real HH:MM time before it can be saved.
					checkTextInput={(next) => ({ isValid: next.trim() === '' || parseTimeToMinutes(next.trim()) != null, value: next })}
					suggestions={[{ key: 'now', value: timeFromTimestamp(Date.now()), label: `Jetzt (${timeFromTimestamp(Date.now())})` }]}
					onSave={(next) => onChange(next.trim() === '' ? null : next.trim())}
					groupPosition={groupPosition}
				/>
			);
		case 'text':
			return (
				<SettingsListTextInput
					nativeID={nativeID}
					label={category.name}
					value={formatCategoryValue(category, value)}
					leftIcon={leftIcon}
					iconBgColor={PRIMARY_COLOR}
					modalTitle={category.name}
					placeholder="Text eingeben"
					saveLabel="Übernehmen"
					initialValue={typeof value === 'string' ? value : ''}
					multiline
					numberOfLines={3}
					textAlignVertical="top"
					onSave={(next) => onChange(next.trim() === '' ? null : next)}
					groupPosition={groupPosition}
				/>
			);
	}
}

/**
 * Renders one input row per category, using the shared settings-list form
 * components (see helpers/GameCategories for the value types). `values` should
 * already be run through `resolveCategoryValues` so computed durations show
 * their derived result.
 */
export default function CategoryValueRows({
	categories,
	values,
	allCategories,
	onChange,
	emptyHint,
	gameTypeId,
	readOnly,
}: Readonly<{
	categories: GameCategory[];
	values: GameCategoryValues;
	/** All categories of the game type, needed to describe computed durations. */
	allCategories: GameCategory[];
	onChange: (categoryId: string, value: GameCategoryValue) => void;
	/** Shown instead of the rows when the game type has no matching categories. */
	emptyHint?: string;
	/** Game type owning the categories - lets the enum picker add new options in place. */
	gameTypeId?: string;
	/** Render the recorded values without any way to change them (viewing a finished match). */
	readOnly?: boolean;
}>) {
	const { theme } = useTheme();

	if (categories.length === 0) {
		if (!emptyHint) return null;
		return <Text style={[styles.emptyHint, { color: theme.screen.placeholder }]}>{emptyHint}</Text>;
	}

	return (
		<>
			{categories.map((category, index) => (
				<CategoryValueRow
					key={category.id}
					category={category}
					value={values[category.id]}
					allCategories={allCategories}
					onChange={(value) => onChange(category.id, value)}
					groupPosition={groupPositionFor(index, categories.length)}
					gameTypeId={gameTypeId}
					readOnly={readOnly}
				/>
			))}
		</>
	);
}

const styles = StyleSheet.create({
	modalContent: {
		padding: 10,
	},
	emptyHint: {
		fontSize: 13,
		textAlign: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
});
