import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';
import MyAvatar, { AvatarConfig, AvatarSize } from '../MyAvatar';
import { useAvatarEditorModal, UseAvatarEditorModalOptions } from '../MyAvatarEditor';

export type SettingsListAvatarProps = {
	/** Current avatar config, or null/undefined when no avatar has been set yet. */
	config?: AvatarConfig | null;
	/** Called with the new config once the user confirms changes in the avatar editor. */
	onChange: (config: AvatarConfig) => void;
	/** Called when the user confirms deletion. Only invoked when `options.allowDelete` is true. */
	onDelete?: () => void;
	label: string;
	/** Preview size of the avatar shown in the row. Defaults to a compact row-sized preview. */
	previewSize?: AvatarSize | number;
	avatarBackgroundColor?: string;
	nativeID?: string;
	groupPosition?: SettingsListProps['groupPosition'];
	editorOptions?: UseAvatarEditorModalOptions;
};

const DEFAULT_PREVIEW_SIZE = 40;
const DEFAULT_AVATAR_BACKGROUND = '#ffffff';

/**
 * A `SettingsList` row that previews an avatar and opens the shared avatar editor
 * (`useAvatarEditorModal`) on press. Formalizes the row+editor pairing used by the
 * Rocket Meals profile screen (avatar preview as `leftIconComponent`, pencil `rightIcon`,
 * `handleFunction` opening the editor) as a single reusable component.
 */
const SettingsListAvatar: React.FC<SettingsListAvatarProps> = ({
	config,
	onChange,
	onDelete,
	label,
	previewSize = DEFAULT_PREVIEW_SIZE,
	avatarBackgroundColor = DEFAULT_AVATAR_BACKGROUND,
	nativeID,
	groupPosition,
	editorOptions,
}) => {
	const { openAvatarEditor } = useAvatarEditorModal();

	const handlePress = () => {
		openAvatarEditor({
			currentAvatar: config,
			onDone: onChange,
			onDelete,
			options: editorOptions,
		});
	};

	return (
		<SettingsList
			nativeID={nativeID}
			label={label}
			leftIconComponent={
				// Decomposed style/options (rather than the `config` prop) so `previewSize`
				// always wins - `config.size` (the size the config was authored at) would
				// otherwise take precedence over `previewSize` inside MyAvatar.
				<MyAvatar
					style={config?.style}
					options={config?.options}
					size={previewSize}
					rounded
					backgroundColor={avatarBackgroundColor}
				/>
			}
			rightIcon={<MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />}
			handleFunction={handlePress}
			groupPosition={groupPosition}
		/>
	);
};

export default SettingsListAvatar;
