import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import React, {FunctionComponent} from 'react';
import MarkingListItem, {getMarkingName} from "@/components/food/MarkingListItem";
import {Markings} from "@/helper/database/databaseTypes/types";
import {ListRenderItemInfo} from "react-native";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useProfileLanguageCode} from "@/states/SynchedProfile";

export const MarkingList = ({...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	let usedDict = markingsDict || {}
	const all_marking_keys = Object.keys(usedDict);

	return <MarkingListSelective markingIds={all_marking_keys} {...props} />
}

export const MarkingListSelective: FunctionComponent<{markingIds: string[]}> = ({markingIds, ...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	type DataItem = { key: string; data: Markings; name: string}
	const data: DataItem[] = []
	if (markingsDict && markingIds) {
		for (let i=0; i<markingIds.length; i++) {
			const resource_id = markingIds[i];
			const marking = markingsDict[resource_id]
			if(!!marking){
				const withoutExternalIdentifier = false;
				const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
				data.push({key: resource_id, data: marking, name: translated_name})
			}
		}
	}

	// sort by name
	data.sort((a, b) => {
		return a.name.localeCompare(b.name);
	});

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