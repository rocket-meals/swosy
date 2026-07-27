/**
 * Stable element identifiers for automated testing (Maestro).
 * Rendered as `nativeID` (HTML `id` attribute on web) so Maestro web tests can
 * locate elements without depending on visible text or component hierarchy.
 *
 * Prefix-style ids (ending in `_PREFIX`) are combined with a dynamic suffix
 * (e.g. a player/friend id) at the call site. Maestro's generated `tapOnId`/
 * `assertVisibleId` patterns always append `.*`, so a prefix alone matches any
 * element whose id starts with it.
 */
export const ComponentIds = {
	// Drawer navigation
	DRAWER_ITEM_GAME: 'drawer-item-game',
	DRAWER_ITEM_GAMES: 'drawer-item-games',
	DRAWER_ITEM_PLAYERS: 'drawer-item-players',
	DRAWER_ITEM_TIMER: 'drawer-item-timer',
	DRAWER_ITEM_DICE: 'drawer-item-dice',
	DRAWER_ITEM_SETTINGS: 'drawer-item-settings',

	// Game screen header
	GAME_HEADER_BACK_BUTTON: 'game-header-back-button',
	GAME_HEADER_EDIT_PLAYERS_BUTTON: 'game-header-edit-players-button',
	GAME_HEADER_SETTINGS_BUTTON: 'game-header-settings-button',

	// Round navigation (active game)
	GAME_ROUND_PREV_BUTTON: 'game-round-prev-button',
	GAME_ROUND_NEXT_BUTTON: 'game-round-next-button',
	GAME_ROUND_LABEL: 'game-round-label',
	GAME_FINISHED_BANNER: 'game-finished-banner',

	// Setup phase (round 0)
	GAME_START_BUTTON: 'game-start-button',
	GAME_SETUP_GAME_TYPE_ROW: 'game-setup-game-type-row',
	GAME_TYPE_SELECT_ROW_PREFIX: 'game-type-select-row-',
	GAME_TYPE_SELECT_NONE: 'game-type-select-none',
	GAME_TYPE_SELECT_CREATE: 'game-type-select-create',

	// Player list (shared between setup and edit-mode)
	GAME_PLAYER_TILE_PREFIX: 'game-player-tile-',
	GAME_PLAYER_ROW_PREFIX: 'game-player-row-',
	GAME_PLAYER_ROW_DELETE_PREFIX: 'game-player-row-delete-',
	GAME_PLAYER_ROW_SAVE_FRIEND_PREFIX: 'game-player-row-save-friend-',
	GAME_PLAYER_ROW_MOVE_UP_PREFIX: 'game-player-row-move-up-',
	GAME_PLAYER_ROW_MOVE_DOWN_PREFIX: 'game-player-row-move-down-',
	GAME_ADD_PLAYER_BUTTON: 'game-add-player-button',
	GAME_ADD_PLAYER_GUEST_BUTTON: 'game-add-player-guest-button',
	GAME_ADD_PLAYER_FRIEND_ROW_PREFIX: 'game-add-player-friend-row-',

	// Score entry modal
	GAME_SCORE_INPUT_SAVE_BUTTON: 'game-score-input-save-button',

	// Card-based score entry modal (custom game rules, see GameRules)
	GAME_CARD_SCORE_CARD_PREFIX: 'game-card-score-card-',
	GAME_CARD_SCORE_BONUS_BADGE: 'game-card-score-bonus-badge',
	GAME_CARD_SCORE_SAVE_BUTTON: 'game-card-score-save-button',

	// Settings modal (header gear)
	GAME_SETTINGS_COLUMNS_PORTRAIT_1: 'game-settings-columns-portrait-1',
	GAME_SETTINGS_COLUMNS_PORTRAIT_2: 'game-settings-columns-portrait-2',
	GAME_SETTINGS_COLUMNS_LANDSCAPE_1: 'game-settings-columns-landscape-1',
	GAME_SETTINGS_COLUMNS_LANDSCAPE_2: 'game-settings-columns-landscape-2',
	GAME_SETTINGS_RESET_SCORES: 'game-settings-reset-scores',
	GAME_SETTINGS_DELETE_MATCH: 'game-settings-delete-match',
	GAME_SETTINGS_PLAYER_ROW_PREFIX: 'game-settings-player-row-',
	GAME_SETTINGS_PLAYER_REMOVE_PREFIX: 'game-settings-player-remove-',
	GAME_SETTINGS_ADD_PLAYER: 'game-settings-add-player',
	GAME_SETTINGS_EDIT_PLAYERS: 'game-settings-edit-players',

	// Players (friends) screen
	PLAYERS_SCREEN_ADD_BUTTON: 'players-screen-add-button',
	PLAYERS_SCREEN_OPTIONS_BUTTON: 'players-screen-options-button',
	PLAYERS_SCREEN_SEARCH_INPUT: 'players-screen-search-input',
	PLAYERS_SCREEN_FRIEND_ROW_PREFIX: 'players-screen-friend-row-',
	PLAYERS_OPTIONS_EXPORT_ALL_ROW: 'players-options-export-all-row',
	PLAYERS_OPTIONS_IMPORT_ROW: 'players-options-import-row',
	PLAYER_DETAIL_EXPORT_ROW: 'player-detail-export-row',
	PLAYER_DETAIL_IMPORT_ROW: 'player-detail-import-row',
	PLAYER_DETAIL_AVATAR_ROW: 'player-detail-avatar-row',
	PLAYER_DETAIL_DELETE_BUTTON: 'player-detail-delete-button',
	PLAYER_DETAIL_ID_ROW: 'player-detail-id-row',

	// Games (game types) screen
	GAMES_SCREEN_SETTINGS_BUTTON: 'games-screen-settings-button',
	GAMES_SCREEN_CREATE_GAME_ROW: 'games-screen-create-game-row',
	GAMES_SETTINGS_CREATE_GAME_ROW: 'games-settings-create-game-row',
	GAMES_SETTINGS_EXPORT_ALL_ROW: 'games-settings-export-all-row',
	GAMES_SETTINGS_SORT_LAST_PLAYED: 'games-settings-sort-last-played',
	GAMES_SETTINGS_SORT_NAME: 'games-settings-sort-name',
	GAMES_SETTINGS_SORT_MATCH_COUNT: 'games-settings-sort-match-count',
	GAMES_SCREEN_SEARCH_INPUT: 'games-screen-search-input',
	GAMES_SCREEN_GAME_ROW_PREFIX: 'games-screen-game-row-',
	GAMES_IMPORT_LOAD_FLIP_SEVEN_ROW: 'games-import-load-flip-seven-row',
	GAMES_IMPORT_PRESET_ROW: 'games-import-preset-row',
	GAME_DETAIL_BACK_BUTTON: 'game-detail-back-button',
	GAME_DETAIL_EDIT_BUTTON: 'game-detail-edit-button',
	GAME_DETAIL_DELETE_BUTTON: 'game-detail-delete-button',
	GAME_DETAIL_ID_ROW: 'game-detail-id-row',
	GAME_DETAIL_SETTINGS_BUTTON: 'game-detail-settings-button',
	GAME_DETAIL_IMAGE_ROW: 'game-detail-image-row',
	GAME_DETAIL_NAME_ROW: 'game-detail-name-row',
	GAME_IMAGE_SEARCH_INPUT: 'game-image-search-input',
	GAME_IMAGE_RESULT_PREFIX: 'game-image-result-',
	GAME_IMAGE_ICON_PREFIX: 'game-image-icon-',
	GAME_IMAGE_REMOVE_ROW: 'game-image-remove-row',
	GAME_IMAGE_UPLOAD_ROW: 'game-image-upload-row',
	GAME_IMAGE_CAMERA_ROW: 'game-image-camera-row',
	GAME_DETAIL_SEARCH_INPUT: 'game-detail-search-input',
	GAME_DETAIL_START_MATCH_BUTTON: 'game-detail-start-match-button',
	GAME_DETAIL_MATCH_ROW_PREFIX: 'game-detail-match-row-',
	GAME_DETAIL_EXPORT_ROW: 'game-detail-export-row',
	GAME_DETAIL_VERSION_ROW: 'game-detail-version-row',
	GAME_DETAIL_CODE_EDIT_ROW: 'game-detail-code-edit-row',
	GAME_DETAIL_STARTING_PLAYER_ROW: 'game-detail-starting-player-row',
	GAME_STARTING_PLAYER_MODE_ROW_PREFIX: 'game-starting-player-mode-row-',

	// Custom categories: value entry (game screen) and definition (game detail)
	CATEGORY_VALUE_ROW_PREFIX: 'category-value-row-',
	CATEGORY_VALUE_ENUM_OPTION_PREFIX: 'category-value-enum-option-',
	GAME_CATEGORY_ROW_PREFIX: 'game-category-row-',
	GAME_CATEGORY_MOVE_UP_PREFIX: 'game-category-move-up-',
	GAME_CATEGORY_MOVE_DOWN_PREFIX: 'game-category-move-down-',
	GAME_CATEGORY_ADD_ROW: 'game-category-add-row',
	GAME_CATEGORY_NAME_ROW: 'game-category-name-row',
	GAME_CATEGORY_TYPE_ROW_PREFIX: 'game-category-type-row-',
	GAME_CATEGORY_SCOPE_ROW_PREFIX: 'game-category-scope-row-',
	GAME_CATEGORY_ADD_OPTION_ROW: 'game-category-add-option-row',
	GAME_CATEGORY_COMPUTED_TOGGLE: 'game-category-computed-toggle',
	GAME_CATEGORY_DELETE_BUTTON: 'game-category-delete-button',
	GAME_CATEGORY_ID_ROW: 'game-category-id-row',
	GAME_DETAIL_TRACK_SCORES_ROW: 'game-detail-track-scores-row',
	GAMES_IMPORT_LOAD_MANSIONS_ROW: 'games-import-load-mansions-row',

	// Match list: sorting and filtering (game detail screen)
	GAME_DETAIL_FILTER_TOGGLE: 'game-detail-filter-toggle',
	GAME_DETAIL_FILTER_RESET: 'game-detail-filter-reset',
	GAME_DETAIL_SORT_CHIP_PREFIX: 'game-detail-sort-chip-',
	GAME_DETAIL_SORT_DIRECTION_BUTTON: 'game-detail-sort-direction-button',
	GAME_DETAIL_FILTER_CHIP_PREFIX: 'game-detail-filter-chip-',
	GAME_DETAIL_FILTER_TEXT_INPUT_PREFIX: 'game-detail-filter-text-input-',
	GAME_DETAIL_FILTER_MIN_PREFIX: 'game-detail-filter-min-',
	GAME_DETAIL_FILTER_MAX_PREFIX: 'game-detail-filter-max-',

	// Timer screen
	TIMER_START_PAUSE_BUTTON: 'timer-start-pause-button',
	TIMER_RESET_BUTTON: 'timer-reset-button',

	// Dice screen
	DICE_TYPE_BUTTON_PREFIX: 'dice-type-button-',
	DICE_CUSTOM_INPUT: 'dice-custom-input',
	DICE_CUSTOM_ADD_BUTTON: 'dice-custom-add-button',
	DICE_POOL_ITEM_PREFIX: 'dice-pool-item-',
	DICE_POOL_CLEAR_BUTTON: 'dice-pool-clear-button',
	DICE_MODE_BUTTON_PREFIX: 'dice-mode-button-',
	DICE_ROLL_BUTTON: 'dice-roll-button',

	// Settings screen: debug mode
	SETTINGS_VERSION_ROW: 'settings-version-row',
	SETTINGS_FOOTER: 'settings-footer',
	SETTINGS_DEBUG_MODE_TOGGLE: 'settings-debug-mode-toggle',
	SETTINGS_DEBUG_COPY_LOGS: 'settings-debug-copy-logs',
	SETTINGS_DEBUG_CLEAR_LOGS: 'settings-debug-clear-logs',
} as const;
