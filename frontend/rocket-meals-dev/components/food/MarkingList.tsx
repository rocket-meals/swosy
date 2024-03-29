import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import React, {FunctionComponent} from 'react';
import MarkingListItem from "@/components/food/MarkingListItem";
import {Markings} from "@/helper/database/databaseTypes/types";
import {ListRenderItemInfo} from "react-native";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";

export const MarkingList = ({...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	let usedDict = markingsDict || {}
	const all_marking_keys = Object.keys(usedDict);

	return <MarkingListSelective markingIds={all_marking_keys} />
}

export const MarkingListSelective: FunctionComponent<{markingIds: string[]}> = ({...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	type DataItem = { key: string; data: Markings }
	const data: DataItem[] = []
	if (markingsDict && props.markingIds) {
		for (let i=0; i<props.markingIds.length; i++) {
			const resource_id = props.markingIds[i];
			const marking = markingsDict[resource_id]
			if(!!marking){
				data.push({key: resource_id, data: marking})
			}
		}
	}

	const renderCanteen = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const marking = item.data;
		const marking_id = marking.id
		return (
			<MarkingListItem markingId={marking.id} />
		);

	}
	return (
		<MyGridFlatList
			data={data} renderItem={renderCanteen} amountColumns={1}
		/>
	)

/**
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	type DataItem = { key: string; data: Markings }
	const data: DataItem[] = []
	if (markingsDict && props.markingIds) {
		for (let i=0; i<props.markingIds.length; i++) {
			const canteen_key = props.markingIds[i];
			const marking = markingsDict[canteen_key]
			if(!!marking){
				data.push({key: canteen_key, data: marking})
			}
		}
	}

	const renderMarking = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const marking = item.data;
		const marking_key = marking.id

		return (
			<MarkingListItem markingId={marking.id} />
		);
	}

	return <MyGridFlatList data={data} renderItem={renderMarking} amountColumns={1} />

		*/
}