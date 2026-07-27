/**
 * players-avatar-test.ts – Regression test for "the avatar of a friend isn't
 * saved".
 *
 * The friend editor is itself a modal, so the avatar editor opens *stacked* on
 * top of it. Closing it only pops back one level, which used to skip the
 * editor's save-on-close entirely (the modal stack renders every item at the
 * same tree position, so the popped content re-renders instead of unmounting -
 * and the save hung off that unmount). The avatar was silently discarded.
 *
 * What proves it here: the avatar editor opens its quick-start preset grid
 * only while no avatar exists yet, and jumps straight into the category editor
 * once one is stored. So re-opening the editor after picking a preset must show
 * the category list and must NOT show the preset grid again.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { CommonUiComponentIds } from 'repo-depkit-common-ui/src/constants/ComponentIds';
import { ComponentIds } from '../../../frontend/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.scoretracker.web',
	tags: ['web', 'players-screen', 'avatar'],
	outputFileName: 'players-avatar-test',
});

test
	.openPage('http://localhost:8082/players')
	.waitForAnimationToEnd()

	// Create a friend - opens the friend edit modal right away
	.tapOnId(ComponentIds.PLAYERS_SCREEN_ADD_BUTTON)
	.waitForAnimationToEnd()
	.assertVisibleId(ComponentIds.PLAYER_DETAIL_AVATAR_ROW)

	// Open the avatar editor. A fresh friend has no avatar, so the quick-start
	// preset grid is shown.
	.tapOnId(ComponentIds.PLAYER_DETAIL_AVATAR_ROW)
	.waitForAnimationToEnd()
	.assertVisibleId(`${CommonUiComponentIds.AVATAR_EDITOR_PRESET_PREFIX}0`)
	.takeScreenshot('avatar-quickstart')

	// Pick a preset - this switches the editor into its category view
	.tapOnId(`${CommonUiComponentIds.AVATAR_EDITOR_PRESET_PREFIX}0`)
	.waitForAnimationToEnd()
	.assertVisibleId(CommonUiComponentIds.AVATAR_EDITOR_CATEGORY_LIST)
	.takeScreenshot('avatar-editor')

	// Close the avatar editor - pops back to the friend edit modal, and this is
	// the moment the avatar has to be saved.
	.tapOnId(CommonUiComponentIds.MODAL_CLOSE_BUTTON)
	.waitForAnimationToEnd()
	.assertVisibleId(ComponentIds.PLAYER_DETAIL_DELETE_BUTTON)
	.takeScreenshot('friend-after-avatar')

	// Re-open the avatar editor: with the avatar stored it must open the
	// category editor directly. If it falls back to the preset grid, nothing was
	// saved - which is exactly the bug this test guards.
	.tapOnId(ComponentIds.PLAYER_DETAIL_AVATAR_ROW)
	.waitForAnimationToEnd()
	.assertVisibleId(CommonUiComponentIds.AVATAR_EDITOR_CATEGORY_LIST)
	.assertNotVisibleId(`${CommonUiComponentIds.AVATAR_EDITOR_PRESET_PREFIX}0`)
	.takeScreenshot('avatar-editor-reopened')

	// Clean up: back to the friend modal, then delete the friend so the friends
	// list is empty again for the following tests.
	.tapOnId(CommonUiComponentIds.MODAL_CLOSE_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.PLAYER_DETAIL_DELETE_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('players-after-cleanup');

export default test;
