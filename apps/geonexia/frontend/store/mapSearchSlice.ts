import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single saved search configuration.
 * `enabledKeys` stores "class/subclass" strings that are active filters.
 */
export interface MapSearchStateEntry {
	name: string;
	enabledKeys: string[];
}

interface MapSearchSliceState {
	searchState: MapSearchStateEntry | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: MapSearchSliceState = {
	searchState: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const mapSearchSlice = createSlice({
	name: 'mapSearch',
	initialState,
	reducers: {
		setMapSearchState(state, action: PayloadAction<MapSearchStateEntry | null>) {
			state.searchState = action.payload;
		},
		resetMapSearchState(state) {
			state.searchState = null;
		},
		setMapSearchName(state, action: PayloadAction<string>) {
			if (state.searchState) {
				state.searchState.name = action.payload;
			} else {
				state.searchState = { name: action.payload, enabledKeys: [] };
			}
		},
		toggleMapSearchKey(state, action: PayloadAction<string>) {
			if (!state.searchState) {
				state.searchState = { name: '', enabledKeys: [action.payload] };
				return;
			}
			const idx = state.searchState.enabledKeys.indexOf(action.payload);
			if (idx >= 0) {
				state.searchState.enabledKeys.splice(idx, 1);
			} else {
				state.searchState.enabledKeys.push(action.payload);
			}
		},
	},
});

export const { setMapSearchState, resetMapSearchState, setMapSearchName, toggleMapSearchKey } =
	mapSearchSlice.actions;
export default mapSearchSlice.reducer;
