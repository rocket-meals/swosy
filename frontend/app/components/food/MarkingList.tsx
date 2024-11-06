import {useSortedMarkings} from '@/states/SynchedMarkings';
import React, {FunctionComponent} from 'react';
import MarkingListItem, {getMarkingName} from "@/components/food/MarkingListItem";
import {Markings} from "@/helper/database/databaseTypes/types";
import {ListRenderItemInfo} from "react-native";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useProfileLanguageCode} from "@/states/SynchedProfile";

export const MarkingList = ({...props}) => {
	const sortedMarkings = useSortedMarkings();
	return <MarkingListSelective markings={sortedMarkings} {...props} />
}

export const MarkingListSelective: FunctionComponent<{markings: Markings[]}> = ({markings, ...props}) => {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	type DataItem = { key: string; data: Markings; name: string}
	const data: DataItem[] = []
	for (let i=0; i<markings.length; i++) {
		const marking = markings[i];
		if(!!marking){
			const withoutExternalIdentifier = false;
			const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
			data.push({key: marking.id, data: marking, name: translated_name})
		}
	}

	const renderResource = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const marking = item.data;
		const marking_id = marking.id
		return (
			<MarkingListItem markingId={marking.id} />
		);

	}

	return (
		<MyGridFlatList
			{...props}
			data={data} renderItem={renderResource} amountColumns={1}
		/>
	)
}