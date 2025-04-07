import React from 'react';
import {DirectusTranslatedMarkdownWithCards} from "@/components/markdown/DirectusTranslatedMarkdownWithCards";
import {
	getDirectusTranslation, getDirectusTranslationUnsafe,
	TranslationEntry,
	useDirectusTranslation
} from "@/helper/translations/DirectusTranslationUseFunction";
import {useSynchedAppElementsDict} from "@/states/SynchedAppElements";
import {AppElements} from "@/helper/database/databaseTypes/types";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {View} from "@/components/Themed";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";

export default function AppElement({ id, color }: { id: string | AppElements | null | undefined, color?: string }) {
	const [appElementsDict, setAppElementsDict] = useSynchedAppElementsDict()
	const [languageCode, setLanguageCode] = useProfileLanguageCode();

	if(!appElementsDict || !id) {
		return null
	}

	let element: AppElements | null | undefined = null;
	if (typeof id === 'string') {
		element = appElementsDict?.[id];
	} else if (typeof id === 'object') {
		element = id;
	}

	if(element && typeof element === 'object'){
		const translations = element?.translations as TranslationEntry[];
		let contentUnsafe = getDirectusTranslationUnsafe(languageCode, translations, 'content', true);

		if (typeof translations === 'undefined' || typeof translations === 'string') {
			return null;
		}

		let markdownContent = null;
		if(contentUnsafe && contentUnsafe.length > 0){
			markdownContent = <DirectusTranslatedMarkdownWithCards field={'content'} translations={translations} color={color} />;
		}

		return  <>
			{markdownContent}
			<AppPopup appElement={element} color={color} />
		</>
	} else {
		return null
	}
}

function AppPopup({ appElement, color }: { appElement: AppElements | null | undefined, color?: string }) {
	const translations = appElement?.translations as TranslationEntry[];
	let popup_button_text = useDirectusTranslation(translations, "popup_button_text");

	const showPopup = useMyModalConfirmer({
		hideConfirmAndCancelOption: true,
		onConfirm: () => {
			return true
		},
		title: popup_button_text,
		renderAsContentPreItems: (key: string, hide: () => void) => {
			return <View style={{width: "100%"}}>
				<View style={{
					width: "100%",
					paddingHorizontal: 20,
				}}>
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
					</View>
					<DirectusTranslatedMarkdownWithCards field={'popup_content'} translations={translations} color={color} />
				</View>
			</View>
		}
	})

	if(!popup_button_text || popup_button_text.length === 0){
		return null
	}

	return <>
		<MyButton leftIcon={IconNames.expand_icon} leftIconColoredBox={true} accessibilityLabel={popup_button_text} onPress={showPopup} text={popup_button_text} backgroundColor={color} />
	</>
}