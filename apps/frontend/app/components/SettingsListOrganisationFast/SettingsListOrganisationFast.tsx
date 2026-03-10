import React, { useMemo } from 'react';
import { createSelector } from 'reselect';
import { useAppSelector } from '@/redux/hooks';
import { DatabaseTypes } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { SettingsListProps } from '@/components/SettingsList/types';
import SettingsListLikeDislikeFast from '@/components/SettingsListLikeDislikeFast';
import { RootState } from '@/redux/reducer';

export interface SettingsListOrganisationFastProps {
	organisationId: string;
	like: boolean | null | undefined;
	onPressLike: (organisationId: string) => void;
	onPressDislike: (organisationId: string) => void;
	groupPosition?: SettingsListProps['groupPosition'];
}

const makeSelectOrganisation = (organisationId: string) =>
	createSelector(
		[(state: RootState) => state.canteenReducer.organisations],
		(organisations) => organisations?.find((o: DatabaseTypes.Organizations) => o.id === organisationId)
	);

const SettingsListOrganisationFast: React.FC<SettingsListOrganisationFastProps> = ({
	organisationId,
	like,
	onPressLike,
	onPressDislike,
	groupPosition,
}) => {
	const selectOrganisation = useMemo(() => makeSelectOrganisation(organisationId), [organisationId]);
	const organisation = useAppSelector(selectOrganisation);

	const handlePressLike = useMemo(() => () => onPressLike(organisationId), [onPressLike, organisationId]);
	const handlePressDislike = useMemo(() => () => onPressDislike(organisationId), [onPressDislike, organisationId]);

	const rightElement = useMemo(
		() => (
			<SettingsListLikeDislikeFast
				like={like}
				onPressLike={handlePressLike}
				onPressDislike={handlePressDislike}
			/>
		),
		[like, handlePressLike, handlePressDislike]
	);

	if (!organisation) return null;

	return (
		<SettingsList
			title={organisation.alias ?? organisation.id}
			rightElement={rightElement}
			groupPosition={groupPosition}
			noIconIndent
		/>
	);
};

export default React.memo(SettingsListOrganisationFast);
