import React, {useEffect} from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {IconNames} from '@/constants/IconNames';
import {SettingsRowGroup} from '@/components/settings/SettingsRowGroup';
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {AppFeedbacks, Profiles} from "@/helper/database/databaseTypes/types";
import {useSynchedProfile} from "@/states/SynchedProfile";
import {useCurrentRoleIsAdmin, useIsCurrentUserAnonymous} from "@/states/User";
import {ListRenderItemInfo} from "react-native";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";
import {DateHelper} from "@/helper/date/DateHelper";
import {getRouteForAppfeedbackDetails} from "@/app/(app)/support/app_feedbacks/detail";
import {Text, View} from "@/components/Themed";
import {useIsDebug} from "@/states/Debug";

export const TABLE_NAME_APP_FEEDBACKS = 'app_feedbacks';

export const getRouteToAppFeedbacks = () => {
	return "/(app)/support/app_feedbacks";
}

export const fetchAppfeedbacks = async (isAnonymous: boolean, isAdmin: boolean, profile: Partial<Profiles>, page: number, offset: number, limit: number) => {
	if(isAnonymous) return [];

	let filter_for_profile = {
		_and: [
			{
				profile: {
					_eq: profile.id
				}
			}
		]
	}

	let filter_for_admin = {

	}

	let filter = isAdmin ? filter_for_admin : filter_for_profile;

	const collectionHelper = new CollectionHelper<AppFeedbacks>(TABLE_NAME_APP_FEEDBACKS)
	let feedbacks_remote = await collectionHelper.readItems({
		fields: ['*'],
		filter: filter,
		limit: 100,
		sort: ['sort', '-date_created']
	})
	return feedbacks_remote;
}

export default function AppfeedbacksList() {

	const isDebug = useIsDebug()
	const isAdmin = useCurrentRoleIsAdmin();
	const isAnonymous = useIsCurrentUserAnonymous()
	const [profile, setProfile, cacheHelperTypeProfile] = useSynchedProfile();
	const [appfeedbacks, setAppfeedbacks] = React.useState<AppFeedbacks[]>([]);

	async function loadAppfeedbacks() {
		let feedbacks = await fetchAppfeedbacks(isAnonymous, !!isAdmin, profile, 0, 0, 100);
		setAppfeedbacks(feedbacks);
	}

	useEffect(() => {
		loadAppfeedbacks()
	}, []);

	type DataItem = { key: string; data: AppFeedbacks}
	const data: DataItem[] = []
	if (appfeedbacks) {
		for (let i=0; i<appfeedbacks.length; i++) {
			const appfeedback = appfeedbacks[i];
			if(!!appfeedback){
				data.push({key: appfeedback?.id, data: appfeedback})
			}
		}
	}

	// sort by date, latest first
	data.sort((a, b) => {
		let Adate_created = a.data.date_created;
		let Bdate_created = b.data.date_created;
		let Adate = new Date(Adate_created || 0);
		let Bdate = new Date(Bdate_created || 0);
		return Bdate.getTime() - Adate.getTime();
	});

	const renderResource = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const resource = item.data;
		const resource_id = resource.id
		const title = resource.title || resource_id

		let iconLeft = IconNames.message_send_icon;
		if(resource.response){
			iconLeft = IconNames.message_support_responded_icon
		}
		if(resource.response_read_by_user){
			iconLeft = IconNames.message_response_read_by_user_icon
		}
		let labelRight = undefined
		const usedDate = resource.date_updated || resource.date_created;
		if(usedDate){
			labelRight = DateHelper.formatOfferDateToReadable(new Date(usedDate), true, true);
		}

		return (
			<SettingsRowNavigateWithText labelRight={labelRight} labelLeft={title} leftIcon={iconLeft} route={getRouteForAppfeedbackDetails(resource_id)} />
		);

	}

	function renderDebug() {
		if(!isDebug) return null;
		return (
			<SettingsRowGroup label={"DEBUG"}>
				<View>
					<Text>
						{JSON.stringify(appfeedbacks)}
					</Text>
				</View>
			</SettingsRowGroup>
		);
	}



	return (
		<MySafeAreaView>
			<ScrollViewWithGradient>
				<SettingsRowGroup>
					<MyGridFlatList
						data={data} renderItem={renderResource} amountColumns={1}
					/>
				</SettingsRowGroup>
				{renderDebug()}
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}