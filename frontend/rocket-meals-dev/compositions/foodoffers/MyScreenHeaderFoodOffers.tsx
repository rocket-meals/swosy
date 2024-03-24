import React from 'react';
import {Heading, View} from '@/components/Themed'
import {MyScreenHeader, MyScreenHeaderProps, getMyScreenHeaderFunction} from '@/components/drawer/MyScreenHeader';
import {SettingsButtonProfileCanteen} from '@/compositions/settings/SettingsButtonProfileCanteen';
import {useFoodOfferSelectedDate} from '@/states/SynchedFoodOfferStates';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {DateHelper} from '@/helper/date/DateHelper';
import {useProfileLocaleForJsDate, useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {Divider} from '@gluestack-ui/themed';
import {MyPreviousNextButton} from '@/components/buttons/MyPreviousNextButton';
import {SimpleDatePicker} from '@/components/datePicker/SimpleDatePicker';
import {UtilizationButton} from '@/compositions/utilizationForecast/UtilizationButton';
import {SettingsButtonProfileEatingHabits} from '@/compositions/settings/SettingsButtonProfileEatingHabits';
import {SettingsButtonSort} from "@/compositions/settings/SettingsButtonSort";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {sortTypesForFood} from "@/states/SynchedSortType";
import {UtilizationCanteenButton} from "@/compositions/utilizationForecast/UtilizationCanteenButton";
import {BusinesshoursCanteenButton} from "@/compositions/businesshours/BusinesshoursCanteenButton";

const MyScreenHeaderFoodOffers = ({ ...props }: MyScreenHeaderProps) => {
	let title = undefined //"TEST"

	const locale = useProfileLocaleForJsDate()
	const translation_foods = useTranslation(TranslationKeys.foods);

	const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	if(!!profileCanteen && profileCanteen.alias){
		title = profileCanteen.alias;
	}

	const translation_day = useTranslation(TranslationKeys.day);

	const dateCopy = new Date(selectedDate);
	const humanReadableDate = DateHelper.useSmartReadableDate(dateCopy, locale)

	function renderSecondaryHeaderContent(props: any) {
		return (
			<View style={{
				justifyContent: 'flex-end',
				alignItems: 'center',
				flexDirection: 'row',
			}}
			>
				<View style={{
					flexDirection: 'row',
				}}
				>
					<SettingsButtonSort itemToSort={translation_foods} synchKey={PersistentStore.sortConfigFoodoffers} availableSortTypes={sortTypesForFood} />
					<SettingsButtonProfileEatingHabits />
					<SettingsButtonProfileCanteen />
				</View>
			</View>
		);
	}

	function renderSwitchDate(forward: boolean) {
		const translation = translation_day;
		return (
			<MyPreviousNextButton useTransparentBorderColor={true}
				translation={translation}
				forward={forward}
				onPress={() => {
					changeAmountDays(forward ? 1 : -1);
				}}
			/>
		)
	}

	return (
		<View style={{
			width: '100%',
		}}
		>
			<MyScreenHeader hideDivider={true} {...props} custom_title={title} custom_renderHeaderDrawerOpposite={renderSecondaryHeaderContent} />
			<View style={{
				width: '100%',
				flexDirection: 'row',
				flexWrap: 'wrap',
			}}
			>
				<View style={{
					justifyContent: 'center',
					alignItems: 'center',
					flexDirection: 'row',
					flexShrink: 1,
				}}
				>
					{renderSwitchDate(false)}
					<SimpleDatePicker currentDate={selectedDate}
						onSelectDate={(date) => {
							setSelectedDate(date);
						} }
					>
					</SimpleDatePicker>
					{renderSwitchDate(true)}
				</View>
				<View style={{
					flexDirection: 'column',
					justifyContent: 'center',
					flexShrink: 1,
					flexWrap: 'wrap',
				}}
				>
					<Heading>{humanReadableDate}</Heading>
				</View>
				<View style={{
					// take the rest of the space
					justifyContent: 'flex-end',
					alignItems: 'flex-end',
					flexDirection: 'row',
					flexGrow: 1,

				}}
				>
					<BusinesshoursCanteenButton />
					<UtilizationCanteenButton />
				</View>
			</View>
			<Divider />
		</View>
	)
}


export const getMyScreenHeaderFoodOffers: getMyScreenHeaderFunction = () => {
	return (props: MyScreenHeaderProps) => {
		return <MyScreenHeaderFoodOffers {...props} />
	}
}
