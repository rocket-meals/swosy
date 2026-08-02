import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import type {
	CategoryFilter,
	CategoryFilters,
	GameCategory,
	GameCategoryValue,
	MatchSort,
} from '../helpers/GameCategories';
import { GAME_CATEGORY_SCOPE_LABELS, filterKindForType } from '../helpers/GameCategories';
import { BUILTIN_DURATION_SORT_ID } from '../helpers/MatchTimes';
import { ComponentIds } from '../constants/ComponentIds';
import { CategoryValueRow } from './CategoryValueRows';

const PRIMARY_COLOR = '#2563eb';

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
	label,
	isActive,
	onPress,
	nativeID,
}: Readonly<{ label: string; isActive: boolean; onPress: () => void; nativeID?: string }>) {
	const { theme } = useTheme();
	return (
		<TouchableOpacity
			nativeID={nativeID}
			onPress={onPress}
			activeOpacity={0.7}
			style={[
				styles.chip,
				{
					backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
					borderColor: isActive ? PRIMARY_COLOR : theme.screen.border,
				},
			]}
		>
			<Text style={[styles.chipText, { color: isActive ? '#ffffff' : theme.screen.text }]}>{label}</Text>
		</TouchableOpacity>
	);
}

// ─── Per-category filter controls ─────────────────────────────────────────────

function EnumFilterChips({
	category,
	filter,
	onChange,
}: Readonly<{ category: GameCategory; filter: CategoryFilter | undefined; onChange: (filter: CategoryFilter | undefined) => void }>) {
	const selected = filter?.kind === 'enum' ? filter.optionIds : [];
	return (
		<View style={styles.chipRow}>
			{(category.options ?? []).map((option) => {
				const isActive = selected.includes(option.id);
				return (
					<Chip
						key={option.id}
						nativeID={`${ComponentIds.GAME_DETAIL_FILTER_CHIP_PREFIX}${category.id}-${option.id}`}
						label={option.label}
						isActive={isActive}
						onPress={() => {
							const next = isActive ? selected.filter((id) => id !== option.id) : [...selected, option.id];
							onChange(next.length === 0 ? undefined : { kind: 'enum', optionIds: next });
						}}
					/>
				);
			})}
		</View>
	);
}

function BooleanFilterChips({
	category,
	filter,
	onChange,
}: Readonly<{ category: GameCategory; filter: CategoryFilter | undefined; onChange: (filter: CategoryFilter | undefined) => void }>) {
	// `undefined` = no filter at all; `null` = filter for "keine Angabe"
	// (booleans are tri-state, see GameCategories).
	const value = filter?.kind === 'boolean' ? filter.value : undefined;
	return (
		<View style={styles.chipRow}>
			<Chip label="Alle" isActive={value === undefined} onPress={() => onChange(undefined)} />
			<Chip
				nativeID={`${ComponentIds.GAME_DETAIL_FILTER_CHIP_PREFIX}${category.id}-yes`}
				label="Ja"
				isActive={value === true}
				onPress={() => onChange(value === true ? undefined : { kind: 'boolean', value: true })}
			/>
			<Chip
				nativeID={`${ComponentIds.GAME_DETAIL_FILTER_CHIP_PREFIX}${category.id}-no`}
				label="Nein"
				isActive={value === false}
				onPress={() => onChange(value === false ? undefined : { kind: 'boolean', value: false })}
			/>
			<Chip
				nativeID={`${ComponentIds.GAME_DETAIL_FILTER_CHIP_PREFIX}${category.id}-unset`}
				label="Keine Angabe"
				isActive={value === null}
				onPress={() => onChange(value === null ? undefined : { kind: 'boolean', value: null })}
			/>
		</View>
	);
}

function TextFilterInput({
	category,
	filter,
	onChange,
}: Readonly<{ category: GameCategory; filter: CategoryFilter | undefined; onChange: (filter: CategoryFilter | undefined) => void }>) {
	const { theme } = useTheme();
	const contains = filter?.kind === 'text' ? filter.contains : '';
	return (
		<View style={[styles.textFilterWrapper, { backgroundColor: theme.screen.iconBg }]}>
			<Ionicons name="search-outline" size={16} color={theme.screen.icon} />
			<TextInput
				nativeID={`${ComponentIds.GAME_DETAIL_FILTER_TEXT_INPUT_PREFIX}${category.id}`}
				style={[styles.textFilterInput, { color: theme.screen.text }]}
				placeholder={`${category.name} enthält …`}
				placeholderTextColor={theme.screen.placeholder}
				value={contains}
				onChangeText={(next) => onChange(next.trim() === '' ? undefined : { kind: 'text', contains: next })}
				autoCorrect={false}
			/>
			{contains.length > 0 && (
				<TouchableOpacity onPress={() => onChange(undefined)} hitSlop={8}>
					<Ionicons name="close-circle" size={16} color={theme.screen.icon} />
				</TouchableOpacity>
			)}
		</View>
	);
}

/**
 * Lower/upper bound of an ordinal category (number, duration, date, time),
 * reusing the very same input row as regular value entry - only relabelled and
 * with any computed-duration link stripped, so a derived duration can still be
 * bounded by hand.
 */
function RangeFilterRows({
	category,
	filter,
	onChange,
}: Readonly<{ category: GameCategory; filter: CategoryFilter | undefined; onChange: (filter: CategoryFilter | undefined) => void }>) {
	const min = filter?.kind === 'range' ? filter.min : null;
	const max = filter?.kind === 'range' ? filter.max : null;

	const update = (nextMin: GameCategoryValue, nextMax: GameCategoryValue) => {
		if (nextMin == null && nextMax == null) {
			onChange(undefined);
			return;
		}
		onChange({ kind: 'range', min: nextMin, max: nextMax });
	};

	return (
		<>
			<CategoryValueRow
				category={{ ...category, name: `${category.name} ab`, computed: null }}
				value={min}
				allCategories={[]}
				onChange={(value) => update(value, max)}
				groupPosition="top"
			/>
			<CategoryValueRow
				category={{ ...category, name: `${category.name} bis`, computed: null }}
				value={max}
				allCategories={[]}
				onChange={(value) => update(min, value)}
				groupPosition="bottom"
			/>
		</>
	);
}

function CategoryFilterControls({
	category,
	filter,
	onChange,
}: Readonly<{ category: GameCategory; filter: CategoryFilter | undefined; onChange: (filter: CategoryFilter | undefined) => void }>) {
	switch (filterKindForType(category.type)) {
		case 'enum':
			return <EnumFilterChips category={category} filter={filter} onChange={onChange} />;
		case 'boolean':
			return <BooleanFilterChips category={category} filter={filter} onChange={onChange} />;
		case 'text':
			return <TextFilterInput category={category} filter={filter} onChange={onChange} />;
		case 'range':
			return <RangeFilterRows category={category} filter={filter} onChange={onChange} />;
	}
}

// ─── Section ──────────────────────────────────────────────────────────────────

/**
 * Sorting and filtering of a game's match list by its own custom categories
 * (see helpers/GameCategories). Rendered inline on the game detail screen
 * rather than in a modal so every control updates live as it is used.
 *
 * Only match-scope categories can be sorted by - a player-scope value exists
 * once per participant, so there is no single value to order a match by. Those
 * categories can still be filtered on: a match passes as soon as any one
 * participant matches.
 */
export default function MatchFilterSort({
	categories,
	filters,
	onFiltersChange,
	sort,
	onSortChange,
}: Readonly<{
	categories: GameCategory[];
	filters: CategoryFilters;
	onFiltersChange: (filters: CategoryFilters) => void;
	sort: MatchSort;
	onSortChange: (sort: MatchSort) => void;
}>) {
	const { theme } = useTheme();
	const sortableCategories = categories.filter((category) => category.scope === 'match');

	const setFilter = (categoryId: string, filter: CategoryFilter | undefined) => {
		const next = { ...filters };
		if (filter) {
			next[categoryId] = filter;
		} else {
			delete next[categoryId];
		}
		onFiltersChange(next);
	};

	return (
		<View style={styles.container}>
			<SettingsListGroupTitle title="Sortieren nach" />
			<View style={styles.chipRow}>
				<Chip
					nativeID={`${ComponentIds.GAME_DETAIL_SORT_CHIP_PREFIX}date`}
					label="Datum"
					isActive={sort.categoryId === null}
					onPress={() => onSortChange({ ...sort, categoryId: null })}
				/>
				{/* Built-in duration of every match (see helpers/MatchTimes). */}
				<Chip
					nativeID={`${ComponentIds.GAME_DETAIL_SORT_CHIP_PREFIX}duration`}
					label="Dauer"
					isActive={sort.categoryId === BUILTIN_DURATION_SORT_ID}
					onPress={() => onSortChange({ ...sort, categoryId: BUILTIN_DURATION_SORT_ID })}
				/>
				{sortableCategories.map((category) => (
					<Chip
						key={category.id}
						nativeID={`${ComponentIds.GAME_DETAIL_SORT_CHIP_PREFIX}${category.id}`}
						label={category.name}
						isActive={sort.categoryId === category.id}
						onPress={() => onSortChange({ ...sort, categoryId: category.id })}
					/>
				))}
				<TouchableOpacity
					nativeID={ComponentIds.GAME_DETAIL_SORT_DIRECTION_BUTTON}
					onPress={() => onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
					activeOpacity={0.7}
					style={[styles.chip, styles.directionChip, { borderColor: theme.screen.border }]}
				>
					<Ionicons
						name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
						size={14}
						color={theme.screen.text}
					/>
					<Text style={[styles.chipText, { color: theme.screen.text }]}>
						{sort.direction === 'asc' ? 'Aufsteigend' : 'Absteigend'}
					</Text>
				</TouchableOpacity>
			</View>

			{categories.map((category) => (
				<View key={category.id} style={styles.filterBlock}>
					<Text style={[styles.filterLabel, { color: theme.screen.placeholder }]}>
						{category.name}
						{category.scope === 'player' ? ` (${GAME_CATEGORY_SCOPE_LABELS.player}: mindestens einer)` : ''}
					</Text>
					<CategoryFilterControls
						category={category}
						filter={filters[category.id]}
						onChange={(filter) => setFilter(category.id, filter)}
					/>
				</View>
			))}

			{Object.keys(filters).length > 0 && (
				<TouchableOpacity
					nativeID={ComponentIds.GAME_DETAIL_FILTER_RESET}
					onPress={() => onFiltersChange({})}
					activeOpacity={0.7}
					style={[styles.resetButton, { borderColor: theme.screen.border }]}
				>
					<Ionicons name="close-circle-outline" size={16} color={theme.screen.text} />
					<Text style={[styles.chipText, { color: theme.screen.text }]}>Filter zurücksetzen</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingBottom: 8,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
	chip: {
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	directionChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	chipText: {
		fontSize: 13,
		fontWeight: '600',
	},
	filterBlock: {
		marginTop: 12,
	},
	filterLabel: {
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 6,
		paddingBottom: 4,
	},
	textFilterWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 12,
		height: 40,
		marginHorizontal: 4,
	},
	textFilterInput: {
		flex: 1,
		fontSize: 14,
		height: '100%',
	},
	resetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		gap: 6,
		marginTop: 14,
		marginHorizontal: 4,
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
});
