import { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AvatarConfig, AvatarStyle, AvatarPropKey, useAvatarEditorModal } from 'repo-depkit-common-ui';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useDebugMode from '@/hooks/useDebugMode';

const profileHelper = new ProfileHelper();

const AVATAR_BACKGROUND_COLOR = '#ffffff';
const COLOR_BLACK = '000000';
const COLOR_WHITE = 'ffffff';

const MICAH_HIDDEN_PROPS = {
	[AvatarPropKey.Micah.EYES_COLOR]: COLOR_BLACK,
	[AvatarPropKey.Micah.EYE_SHADOW_COLOR]: COLOR_WHITE,
	[AvatarPropKey.Micah.GLASSES_COLOR]: COLOR_BLACK,
};

export const AVATAR_BACKGROUND = AVATAR_BACKGROUND_COLOR;
export const AVATAR_SETTINGS_ROW_SIZE = 64;

export function parseProfileAvatar(profileAvatar: unknown): AvatarConfig | null {
	if (!profileAvatar) return null;
	if (typeof profileAvatar === 'object') return profileAvatar as AvatarConfig;
	if (typeof profileAvatar === 'string') {
		try {
			return JSON.parse(profileAvatar) as AvatarConfig;
		} catch {
			return null;
		}
	}
	return null;
}

export function useAvatarProfileEditor() {
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const { profile } = useAppSelector((state) => state.authReducer);
	const debugMode = useDebugMode();
	const { openAvatarEditor } = useAvatarEditorModal();

	const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(() =>
		parseProfileAvatar(profile?.avatar),
	);

	const saveAvatarToProfile = useCallback(
		async (config: AvatarConfig | null) => {
			if (!profile?.id) return;
			try {
				const result = await profileHelper.updateProfile({
					...profile,
					avatar: config,
				});
				if (result) {
					dispatch({ type: UPDATE_PROFILE, payload: result });
				}
			} catch (error) {
				console.error('[useAvatarProfileEditor] Failed to save avatar:', error);
			}
		},
		[dispatch, profile],
	);

	const editorOptions = useMemo(() => ({
		title: translate(TranslationKeys.avatars),
		accentColor: primaryColor,
		debugMode,
		allowedStyles: [AvatarStyle.MICAH],
		hiddenProps: MICAH_HIDDEN_PROPS,
		translate,
	}), [translate, primaryColor, debugMode]);

	const openEditor = useCallback(
		(forceNew = false) => {
			openAvatarEditor({
				currentAvatar: forceNew ? null : avatarConfig,
				onDone: async (config) => {
					setAvatarConfig(config);
					await saveAvatarToProfile(config);
				},
				onDelete: async () => {
					setAvatarConfig(null);
					await saveAvatarToProfile(null);
				},
				options: editorOptions,
			});
		},
		[openAvatarEditor, avatarConfig, editorOptions, saveAvatarToProfile],
	);

	const deleteAvatar = useCallback(async () => {
		setAvatarConfig(null);
		await saveAvatarToProfile(null);
	}, [saveAvatarToProfile]);

	return {
		avatarConfig,
		setAvatarConfig,
		openEditor,
		deleteAvatar,
		saveAvatarToProfile,
	};
}
