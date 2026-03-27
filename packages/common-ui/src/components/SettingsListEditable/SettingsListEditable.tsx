import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';
import type { PropsWithChildren } from 'react';

type SettingsListEditablePropsOwn = {
	editable?: boolean;
};

export type SettingsListEditableProps = PropsWithChildren<SettingsListProps & SettingsListEditablePropsOwn>;

const SettingsListEditable: React.FC<SettingsListEditableProps> = ({
	editable = true,
	rightElement,
	rightIcon,
	...props
}) => {
	const { theme } = useTheme();
	const resolvedRightIcon =
		editable && !rightElement && !rightIcon ? (
			<MaterialCommunityIcons name="pencil" size={24} color={theme.screen.icon} />
		) : (
			rightIcon
		);

	return <SettingsList {...props} rightElement={rightElement} rightIcon={resolvedRightIcon} />;
};

export default SettingsListEditable;
