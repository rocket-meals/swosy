import React from 'react';
import { SettingsList as CommonSettingsList } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import useAccountRequiredModal from '@/hooks/useAccountRequiredModal';
import { SettingsListProps } from './types';

const SettingsList: React.FC<SettingsListProps> = (props) => {
	const { primaryColor } = useAppSelector((state) => state.settings);
	const { openAccountRequiredModal } = useAccountRequiredModal();

	return (
		<CommonSettingsList
			{...props}
			primaryColor={props.primaryColor ?? primaryColor}
			onAccountRequired={props.onAccountRequired ?? openAccountRequiredModal}
		/>
	);
};

export default SettingsList;
