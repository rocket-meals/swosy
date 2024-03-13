import {View} from '@/components/Themed';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Markings} from "@/helper/database/databaseTypes/types";

export default function MarkingListItem({ marking }: { marking: Markings}) {
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const markingFromProfile = profilesMarkingsDict[marking.id]
	const status = markingFromProfile?.dislikes;
	const translation_marking = useTranslation(TranslationKeys.markings);

	const translations = marking.translations as TranslationEntry[]
	const translated_name = getDirectusTranslation(languageCode, translations, 'name')
	const text = translated_name || marking.alias || marking.id;
	const accessibilityLabel = translation_marking+": "+text;

	const onPress = (nextStatus: boolean | undefined) => {
		if (nextStatus === true) {
			setProfileMarking(marking, true)
		} else if (nextStatus === false) {
			setProfileMarking(marking, false)
		} else {
			removeProfileMarking(marking)
		}
	}

	return(
		<View key={marking.id}>
			<SettingsRowTriStateLikeDislike onPress={onPress} accessibilityLabel={accessibilityLabel} labelLeft={text} value={status}/>
		</View>
	)
}