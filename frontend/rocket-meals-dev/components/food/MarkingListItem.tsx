import {View, Text} from '@/components/Themed';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React, {useEffect} from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";

export default function MarkingListItem({ markingId }: { markingId: string}) {
	/**
	const [loading, setLoading] = React.useState(true);
	const useLazyLoading = false;

	useEffect(() => {
		// small delay to prevent flickering
		setTimeout(() => {
			if (markingId) {
				setLoading(false)
			}
		}, 50);
	}, [markingId])

	if(loading && useLazyLoading){
		return <LoadingRectThemed width={'100%'} height={50} style={{marginBottom: 10}} />
	}
		*/
	return <MarkingListItemReal markingId={markingId} />
}

function MarkingListItemReal({ markingId }: { markingId: string}) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined = markingsDict?.[markingId];
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const markingFromProfile = profilesMarkingsDict[markingId]
	const status = markingFromProfile?.dislikes;
	const likes = status ? !status : undefined;
	const translation_marking = useTranslation(TranslationKeys.markings);

	const [loading, setLoading] = React.useState(true);

	if(!marking){
		return null;
	}

	const translations = marking.translations as TranslationEntry[]
	const translated_name = getDirectusTranslation(languageCode, translations, 'name')
	const text = translated_name || marking.alias || marking.id;
	const accessibilityLabel = translation_marking+": "+text;

	const onPress = (like: boolean | undefined) => {
		const removeMarking = like === undefined;
		if(removeMarking){
			removeProfileMarking(marking)
		} else {
			const dislikes = like === false;
			setProfileMarking(marking, dislikes)
		}
	}

	const performance = false;

	if(performance){
		return <View style={{
			height: 40, width: '100%', justifyContent: 'center', alignItems: 'center'
		}}>
			<Text>{text}</Text>
		</View>
	} else {
		return(
			<View key={marking.id}>
				<SettingsRowTriStateLikeDislike onSetState={onPress} accessibilityLabel={accessibilityLabel} labelLeft={text} value={likes}/>
			</View>
		)
	}


}