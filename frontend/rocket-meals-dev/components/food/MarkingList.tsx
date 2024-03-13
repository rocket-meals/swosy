import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {View} from '@/components/Themed';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import React, {FunctionComponent, useMemo} from 'react';
import MarkingListItem from "@/components/food/MarkingListItem";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";
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
			const canteen_key = props.markingIds[i];
			const marking = markingsDict[canteen_key]
			data.push({key: canteen_key, data: marking})
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
}