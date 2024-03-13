import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {View} from '@/components/Themed';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import React, {useMemo} from 'react';
import MarkingListItem from "@/components/food/MarkingListItem";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";

export default function MarkingList({ markingIds }: { markingIds: string[] }) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const markingData = useMemo(() => {
		if (!markingsDict) {
			return [];
		}

		return markingIds.map((x) => {
			return {
				data: markingsDict[x]
			}
		})
	}, [markingsDict, markingIds, languageCode])

	const items = markingData.map((x) => {
		const marking = x.data;

		return (
			<View key={marking.id} accessibilityRole={MyAccessibilityRoles.List}>
				<MarkingListItem marking={marking} />
			</View>
		)
	})

	return (
		<View>
			{items}
		</View>
	)
}