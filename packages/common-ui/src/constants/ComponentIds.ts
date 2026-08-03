/**
 * CommonUiComponentIds – stable identifiers for UI elements in the common-ui package
 * that can be targeted by Maestro E2E tests or other test frameworks.
 *
 * IMPORTANT: Always use `nativeID={CommonUiComponentIds.XXX}`, NOT `testID`.
 * - `nativeID` renders as `id="..."` in HTML → Maestro locates elements by `id`
 * - `testID` renders as `data-testid="..."` → Maestro cannot find this on web
 */
export enum CommonUiComponentIds {
	// Modal
	MODAL_CLOSE_BUTTON = 'modal-close-button',

	// Toast (see components/Toast) - the currently visible toast message.
	TOAST = 'common-ui-toast',

	// Avatar editor (see MyAvatarEditor). The quick-start grid is only shown
	// while no avatar exists yet, so its presence/absence is what tells an E2E
	// test whether an avatar was actually stored.
	AVATAR_EDITOR_PRESET_PREFIX = 'avatar-editor-preset-',
	/** Debug-only text fallback tiles, shown next to the grid in debug mode. */
	AVATAR_EDITOR_DEBUG_PRESET_PREFIX = 'avatar-editor-debug-preset-',
	AVATAR_EDITOR_CUSTOMIZE_ROW = 'avatar-editor-customize-row',
	AVATAR_EDITOR_CATEGORY_LIST = 'avatar-editor-category-list',

	// Component playbook (see src/playbook). The wrapper around the component
	// under test plus the prefixes for list items, knob rows and variant rows.
	PLAYBOOK_TARGET = 'playbook-target',
	PLAYBOOK_ITEM_PREFIX = 'playbook-item-',
	PLAYBOOK_KNOB_PREFIX = 'playbook-knob-',
	PLAYBOOK_VARIANT_PREFIX = 'playbook-variant-',
}
