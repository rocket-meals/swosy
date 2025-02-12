import {TEXT_SIZE_EXTRA_LARGE, View} from '@/components/Themed';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {useProfileLanguageCode, useSynchedProfileMarking} from '@/states/SynchedProfile';
import React, {useMemo} from 'react';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {MarkingIconClickable, MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";

export default function MarkingListItem({ markingId }: { markingId: string }) {
	// Memoize the MarkingListItemReal component
	const memoizedComponent = useMemo(() => {
		// This will only re-render if `markingId` changes
		return <MarkingListItemReal markingId={markingId} />;
	}, [markingId]); // Dependency array, re-render the component when `markingId` changes

	return memoizedComponent;
}

export function getMarkingName(marking: Markings, languageCode: string): string {
	const translations = marking.translations as TranslationEntry[]
	const external_identifier = getMarkingExternalIdentifier(marking);
	const fallbackName = marking.alias || external_identifier || marking.id
	let finalName = getDirectusTranslation(languageCode, translations, 'name', false, fallbackName)
	return finalName;
}

export function getMarkingExternalIdentifier(marking: Markings): string | null | undefined {
	return marking.external_identifier;
}

export function getMarkingShortCode(marking: Markings): string | null | undefined {
	return marking.short_code
}

function MarkingListItemReal({ markingId }: { markingId: string}) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined | null = markingsDict?.[markingId];
	const [status, setProfileMarking, removeProfileMarking] = useSynchedProfileMarking(markingId)
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	let statusSet = status === true || status === false;
	const likes = statusSet ? status : undefined;
	const translation_marking = useTranslation(TranslationKeys.markings);

	const foodsAreaColor = useFoodsAreaColor();

	return useMemo(() => {

		//console.log("Rendering MarkingListItemReal", markingId, status)

		if(!marking){
			return null;
		}

		const text = getMarkingName(marking, languageCode);
		const accessibilityLabel = translation_marking+": "+text;

		let iconLeftCustom = <MarkingIconClickable markingId={markingId} imageHeightInTextSize={TEXT_SIZE_EXTRA_LARGE} />

		const onPress = (like: boolean | undefined) => {
			const removeMarking = like === undefined;
			if(removeMarking){
				removeProfileMarking()
			} else {
				setProfileMarking(like===true);
			}
		}

		return(
			<View key={marking.id}>
				<SettingsRowTriStateLikeDislike color={foodsAreaColor} iconLeftCustom={iconLeftCustom} onSetState={onPress} accessibilityLabel={accessibilityLabel} labelLeft={text} value={likes}/>
			</View>
		)
	}, [status, translation_marking, languageCode])


}