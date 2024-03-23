import React, {FunctionComponent, useEffect, useState} from 'react';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {
	useGlobalActionSheetUtilizationForecast
} from '@/compositions/utilizationForecast/UseGlobalActionSheetUtilizationForecast';
import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useIsUtilizationForecastEnabled} from '@/states/SynchedAppSettings';
import {loadUtilizationEntriesRemote} from '@/states/SynchedUtiliztations';
import {useIsDemo} from '@/states/SynchedDemo';
import {useFoodOfferSelectedDate} from '@/states/SynchedFoodOfferStates';

export const useTranslationUtilizationForecast = () => {
	const translation_forecast = useTranslation(TranslationKeys.forecast)
	const translation_utilization = useTranslation(TranslationKeys.utilization)
	return translation_forecast + ': ' + translation_utilization;
}

interface AppState {
	utilizationGroup: string | UtilizationsGroups | null | undefined;
}
export const UtilizationButton: FunctionComponent<AppState> = ({utilizationGroup, ...props}) => {
	const isUtilizationForecastEnabled = useIsUtilizationForecastEnabled();
	const accessibilityLabel = useTranslationUtilizationForecast();
	const tooltip = accessibilityLabel
	const [utilizationEntries, setUtilizationEntries] = useState<UtilizationsEntries[] | undefined>(undefined)

	const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
	const selectedDateCopy = new Date(selectedDate);
	const [refreshDate, setRefreshDate] = useState<string>(new Date().toISOString());
	const isDemo = useIsDemo();
	const refreshDependencyKey: string = refreshDate+selectedDateCopy.toISOString()+isDemo;

	const onPress = useGlobalActionSheetUtilizationForecast(utilizationEntries);

	const refreshEvery5MinutesInterval = 5 * 60 * 1000;
	// create a useEffect which updates every 5 minutes the date
	useEffect(() => {
		const interval = setInterval(() => {
			setRefreshDate(new Date().toISOString());
		}, refreshEvery5MinutesInterval);
		return () => clearInterval(interval);
	}, []);

	async function updateUtilizationEntries() {
		// and type of utilizationGroup is UtilizationsGroups
		if (utilizationGroup !== null && utilizationGroup !== undefined && typeof utilizationGroup !== 'string') {
			const utilizationEntriesRemote = await loadUtilizationEntriesRemote(utilizationGroup, selectedDateCopy, isDemo);
			setUtilizationEntries(utilizationEntriesRemote)
		}
	}

	// create a useEffect which updates the utilization entries when the dateAsDependecy changes
	useEffect(() => {
		updateUtilizationEntries()
	}, [refreshDependencyKey]);


	if (!isUtilizationForecastEnabled) {
		return null;
	} else {
		return (
			<MyButton key={refreshDependencyKey}
				useOnlyNecessarySpace={true}
				tooltip={tooltip}
				accessibilityLabel={accessibilityLabel}
				useTransparentBackgroundColor={true}
				useTransparentBorderColor={true}
				leftIcon={IconNames.utilization_icon}
				{...props}
				onPress={onPress}
			/>
		)
	}
}
