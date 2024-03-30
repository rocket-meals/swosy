import {View, Text, Icon} from '@/components/Themed';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React, {useEffect} from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import DirectusImage from "@/components/project/DirectusImage";

export default function MarkingListItem({ markingId }: { markingId: string}) {
	return <MarkingListItemReal markingId={markingId} />
}

export function getMarkingName(marking: Markings, languageCode: string): string {
	const translations = marking.translations as TranslationEntry[]
	let name = getDirectusTranslation(languageCode, translations, 'name') || marking.alias || marking.id;
	let finalName = name
	if(marking.external_identifier){
		finalName +=  " (" + marking.external_identifier + ")";
	}
	return finalName;
}

function MarkingListItemReal({ markingId }: { markingId: string}) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined = markingsDict?.[markingId];
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const markingFromProfile = profilesMarkingsDict[markingId]
	const status = markingFromProfile?.dislikes;
	let statusSet = status === true || status === false;
	const likes = statusSet ? !status : undefined;
	const translation_marking = useTranslation(TranslationKeys.markings);

	if(!marking){
		return null;
	}

	const translated_name = getMarkingName(marking, languageCode);
	const text = translated_name || marking.alias || marking.id;
	const accessibilityLabel = translation_marking+": "+text;

	const iconLeft = marking.icon
	let iconLeftCustom = undefined
	if(iconLeft){
		iconLeftCustom = <Icon family={"MaterialIcons"} name={iconLeft} />
	}
	if(marking.image || marking.image_remote_url){
		iconLeftCustom = <View style={{
			width: 20, height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 3
		}}>
			<DirectusImage image_url={marking.image_remote_url} assetId={marking.image} thumbHash={marking.image_thumb_hash} style={{width: "100%", height: "100%"}} />
		</View>
	}

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
				<SettingsRowTriStateLikeDislike iconLeftCustom={iconLeftCustom} onSetState={onPress} accessibilityLabel={accessibilityLabel} labelLeft={text} value={likes}/>
			</View>
		)
	}


}