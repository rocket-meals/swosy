import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import { View} from '@/components/Themed';
import {getDirectusTranslation} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React, {useMemo} from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';

export default function MarkingList({ markingIds }: { markingIds: string[] }) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const markingData = useMemo(() => {
		if (!markingsDict) {
			return [];
		}

		return markingIds.map((x) => {
			return {
				displayName: getDirectusTranslation(languageCode, markingsDict[x].translations, 'name'),
				data: markingsDict[x]
			}
		})
	}, [markingsDict, markingIds, languageCode])

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();

	const items = markingData.map((x) => {
		const marking = x.data;
		const markingFromProfile = profilesMarkingsDict[marking.id]
		const status = markingFromProfile?.dislikes;

		const onPress = (nextStatus: boolean | undefined) => {
			if (nextStatus === true) {
				setProfileMarking(x.data, true)
			} else if (nextStatus === false) {
				setProfileMarking(x.data, false)
			} else {
				removeProfileMarking(x.data)
			}
		}

		return (
			<View key={marking.id}>
				<SettingsRowTriStateLikeDislike onPress={onPress} accessibilityLabel={marking.alias || marking.id} labelLeft={marking.alias || marking.id} value={status}/>
			</View>
		)
	})

	return (
		<View>
			{items}
		</View>
	)
}