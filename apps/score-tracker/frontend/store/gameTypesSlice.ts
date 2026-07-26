import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameType, ScoringMode } from '../helpers/GameTypesStorage';
import { DEFAULT_GAME_TYPE_ICON } from '../helpers/GameTypesStorage';
import type { GamePreset, GameRules, StartingPlayerMode } from '../helpers/GameRules';
import type { GameCategory, GameCategoryScope, GameCategoryType } from '../helpers/GameCategories';
import { cloneGameCategories } from '../helpers/GameCategories';
import { generateId } from '../helpers/RandomHelper';
export type { GameType, ScoringMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type GameTypesSliceState = {
	gameTypes: GameType[];
};

const initialState: GameTypesSliceState = {
	gameTypes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCategory(state: GameTypesSliceState, gameTypeId: string, categoryId: string): GameCategory | undefined {
	const gameType = state.gameTypes.find((g) => g.id === gameTypeId);
	return gameType?.categories?.find((c) => c.id === categoryId);
}

/** Starting options of a freshly created `enum` category - the most common win/loss pair. */
function defaultEnumOptions(): { id: string; label: string }[] {
	return [
		{ id: generateId(), label: 'Gewonnen' },
		{ id: generateId(), label: 'Verloren' },
	];
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const gameTypesSlice = createSlice({
	name: 'gameTypes',
	initialState,
	reducers: {
		/** Load persisted game types from disk. Called once at startup. */
		loadGameTypes(state, action: PayloadAction<GameType[]>) {
			state.gameTypes = action.payload;
		},

		/** Create a new game type with a default icon and "high score wins" scoring. */
		addGameType: {
			reducer(state, action: PayloadAction<GameType>) {
				state.gameTypes.push(action.payload);
			},
			prepare(name: string) {
				const gameType: GameType = {
					id: generateId(),
					name,
					icon: DEFAULT_GAME_TYPE_ICON,
					scoringMode: 'highWins',
					maxRounds: null,
					maxScore: null,
					rules: null,
					categories: null,
					trackScores: true,
					startingPlayerMode: 'fixed',
					version: 1,
					createdAt: Date.now(),
				};
				return { payload: gameType };
			},
		},

		/** Create a new game type from an imported/preset template (e.g. "Flip Seven laden"). */
		addGameTypeFromPreset: {
			reducer(state, action: PayloadAction<GameType>) {
				state.gameTypes.push(action.payload);
			},
			prepare(preset: GamePreset) {
				const gameType: GameType = {
					id: generateId(),
					name: preset.name,
					icon: preset.icon,
					scoringMode: preset.scoringMode,
					maxRounds: preset.maxRounds ?? null,
					maxScore: preset.maxScore ?? null,
					rules: preset.rules ?? null,
					// Deep copy: a preset can be a shared module-level constant
					// (or be imported twice), and each game type must own its
					// categories - their ids are what recorded matches point at.
					categories: cloneGameCategories(preset.categories),
					trackScores: preset.trackScores ?? true,
					startingPlayerMode: preset.startingPlayerMode ?? 'fixed',
					version: preset.version ?? 1,
					createdAt: Date.now(),
				};
				return { payload: gameType };
			},
		},

		renameGameType(state, action: PayloadAction<{ gameTypeId: string; name: string }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.name = action.payload.name;
		},

		setGameTypeIcon(state, action: PayloadAction<{ gameTypeId: string; icon: string }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.icon = action.payload.icon;
		},

		setGameTypeScoringMode(state, action: PayloadAction<{ gameTypeId: string; scoringMode: ScoringMode }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.scoringMode = action.payload.scoringMode;
		},

		setGameTypeMaxRounds(state, action: PayloadAction<{ gameTypeId: string; maxRounds: number | null }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.maxRounds = action.payload.maxRounds;
		},

		setGameTypeMaxScore(state, action: PayloadAction<{ gameTypeId: string; maxScore: number | null }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.maxScore = action.payload.maxScore;
		},

		setGameTypeRules(state, action: PayloadAction<{ gameTypeId: string; rules: GameRules | null }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.rules = action.payload.rules;
		},

		setGameTypeStartingPlayerMode(
			state,
			action: PayloadAction<{ gameTypeId: string; startingPlayerMode: StartingPlayerMode }>,
		) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.startingPlayerMode = action.payload.startingPlayerMode;
		},

		setGameTypeVersion(state, action: PayloadAction<{ gameTypeId: string; version: number }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.version = action.payload.version;
		},

		/**
		 * Overwrite an existing game type's content (everything but its id/
		 * createdAt) from a parsed preset - used by the "Code bearbeiten" JSON
		 * editor to apply hand-edited JSON in place.
		 */
		updateGameTypeFromPreset(state, action: PayloadAction<{ gameTypeId: string; preset: GamePreset }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (!gameType) return;
			const { preset } = action.payload;
			gameType.name = preset.name;
			gameType.icon = preset.icon;
			gameType.scoringMode = preset.scoringMode;
			gameType.maxRounds = preset.maxRounds ?? null;
			gameType.maxScore = preset.maxScore ?? null;
			gameType.rules = preset.rules ?? null;
			gameType.categories = cloneGameCategories(preset.categories);
			gameType.trackScores = preset.trackScores ?? true;
			gameType.startingPlayerMode = preset.startingPlayerMode ?? 'fixed';
			gameType.version = preset.version ?? 1;
		},

		/** Toggle whether players are scored with points at all (see `GameTypeDefinition.trackScores`). */
		setGameTypeTrackScores(state, action: PayloadAction<{ gameTypeId: string; trackScores: boolean }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.trackScores = action.payload.trackScores;
		},

		// ─── Custom categories (see helpers/GameCategories) ───────────────────

		/** Append a new category. `enum` categories start with a usable win/loss option pair. */
		addGameCategory: {
			reducer(state, action: PayloadAction<{ gameTypeId: string; category: GameCategory }>) {
				const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
				if (!gameType) return;
				if (!gameType.categories) gameType.categories = [];
				gameType.categories.push(action.payload.category);
			},
			prepare(params: { gameTypeId: string; name: string; type: GameCategoryType; scope: GameCategoryScope }) {
				const category: GameCategory = {
					id: generateId(),
					name: params.name,
					type: params.type,
					scope: params.scope,
					options: params.type === 'enum' ? defaultEnumOptions() : undefined,
					computed: null,
				};
				return { payload: { gameTypeId: params.gameTypeId, category } };
			},
		},

		renameGameCategory(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; name: string }>) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			if (category) category.name = action.payload.name;
		},

		/**
		 * Change a category's value type. Switching *to* `enum` seeds a usable
		 * option pair; switching away keeps the existing options untouched, so
		 * their ids - and with them every already recorded match value - survive
		 * a round trip through another type. A computed-duration link only means
		 * anything for `duration` and is dropped otherwise.
		 */
		setGameCategoryType(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; type: GameCategoryType }>) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			if (!category) return;
			category.type = action.payload.type;
			if (action.payload.type === 'enum' && (!category.options || category.options.length === 0)) {
				category.options = defaultEnumOptions();
			}
			if (action.payload.type !== 'duration') category.computed = null;
		},

		setGameCategoryScope(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; scope: GameCategoryScope }>) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			if (!category) return;
			category.scope = action.payload.scope;
			// A computed duration can only reference categories of its own
			// scope, so a scope change invalidates the link.
			category.computed = null;
		},

		/** Set (or clear) the two categories a computed `duration` is derived from. */
		setGameCategoryComputed(
			state,
			action: PayloadAction<{ gameTypeId: string; categoryId: string; computed: { fromCategoryId: string; toCategoryId: string } | null }>,
		) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			if (category) category.computed = action.payload.computed;
		},

		/** Move a category one position up/down in the list. No-op at either edge. */
		moveGameCategory(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; direction: 'up' | 'down' }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			const categories = gameType?.categories;
			if (!categories) return;
			const index = categories.findIndex((c) => c.id === action.payload.categoryId);
			if (index === -1) return;
			const targetIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= categories.length) return;
			const [category] = categories.splice(index, 1);
			categories.splice(targetIndex, 0, category);
		},

		/** Delete a category, together with any computed link pointing at it. */
		removeGameCategory(state, action: PayloadAction<{ gameTypeId: string; categoryId: string }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (!gameType?.categories) return;
			gameType.categories = gameType.categories.filter((c) => c.id !== action.payload.categoryId);
			for (const category of gameType.categories) {
				const computed = category.computed;
				if (computed && (computed.fromCategoryId === action.payload.categoryId || computed.toCategoryId === action.payload.categoryId)) {
					category.computed = null;
				}
			}
		},

		addGameCategoryOption: {
			reducer(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; option: { id: string; label: string } }>) {
				const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
				if (!category) return;
				if (!category.options) category.options = [];
				category.options.push(action.payload.option);
			},
			prepare(params: { gameTypeId: string; categoryId: string; label: string }) {
				return {
					payload: {
						gameTypeId: params.gameTypeId,
						categoryId: params.categoryId,
						option: { id: generateId(), label: params.label },
					},
				};
			},
		},

		renameGameCategoryOption(
			state,
			action: PayloadAction<{ gameTypeId: string; categoryId: string; optionId: string; label: string }>,
		) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			const option = category?.options?.find((o) => o.id === action.payload.optionId);
			if (option) option.label = action.payload.label;
		},

		removeGameCategoryOption(state, action: PayloadAction<{ gameTypeId: string; categoryId: string; optionId: string }>) {
			const category = findCategory(state, action.payload.gameTypeId, action.payload.categoryId);
			if (!category?.options) return;
			category.options = category.options.filter((o) => o.id !== action.payload.optionId);
		},

		removeGameType(state, action: PayloadAction<string>) {
			state.gameTypes = state.gameTypes.filter((g) => g.id !== action.payload);
		},
	},
});

export const {
	loadGameTypes,
	addGameType,
	addGameTypeFromPreset,
	renameGameType,
	setGameTypeIcon,
	setGameTypeScoringMode,
	setGameTypeMaxRounds,
	setGameTypeMaxScore,
	setGameTypeRules,
	setGameTypeStartingPlayerMode,
	setGameTypeVersion,
	setGameTypeTrackScores,
	addGameCategory,
	renameGameCategory,
	setGameCategoryType,
	setGameCategoryScope,
	setGameCategoryComputed,
	moveGameCategory,
	removeGameCategory,
	addGameCategoryOption,
	renameGameCategoryOption,
	removeGameCategoryOption,
	updateGameTypeFromPreset,
	removeGameType,
} = gameTypesSlice.actions;
export default gameTypesSlice.reducer;
