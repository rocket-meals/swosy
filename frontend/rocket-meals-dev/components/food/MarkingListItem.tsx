import {View, Text} from '@/components/Themed';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React, {useEffect} from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {TouchableOpacity} from "react-native";

export default function MarkingListItem({ markingId }: { markingId: string}) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined = markingsDict?.[markingId];
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const markingFromProfile = profilesMarkingsDict[markingId]
	const status = markingFromProfile?.dislikes;
	const translation_marking = useTranslation(TranslationKeys.markings);

	if(!marking){
		return null;
	}

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