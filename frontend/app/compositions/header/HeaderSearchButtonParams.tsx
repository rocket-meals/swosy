import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {router, useGlobalSearchParams} from "expo-router";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyTextInputModalContent} from "@/components/settings/SettingsRowTextEdit";
import {StringHelper} from "@/helper/string/StringHelper";

export const SEARCH_PARAM_SEARCH_TEXT = 'search';

export function useSearchTextFromGlobalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_SEARCH_TEXT]?: string }>();
	return params[SEARCH_PARAM_SEARCH_TEXT];
}

export function filterAndSortResourcesBySearchValue<T>(resources: T[], searchValue: string | undefined | null, getTextFromResource: (resource: T) => (string | null)): T[] {
	if(searchValue){
		// filter for where the name contains the search value
		let searchValues = searchValue.split(" ");
		for(let i = 0; i < searchValues.length; i++){
			let searchValue = searchValues[i];
			resources = resources.filter((resource) => {
				let name = getTextFromResource(resource);
				if(name){
					return name.toLowerCase().includes(searchValue.toLowerCase());
				}
				return false;
			});
		}

		// sort by closeness to the search value first aka. Levenshtein distance or similar
		// calculate the distance of the search value to the name using StringHelper.getLevenshteinDistance
		resources = resources.sort((a, b) => {
			let nameA = getTextFromResource(a);
			let nameB = getTextFromResource(b);
			if (nameA && nameB) {
				let distanceA = StringHelper.getLevenshteinDistance(nameA, searchValue);
				let distanceB = StringHelper.getLevenshteinDistance(nameB, searchValue);
				return distanceA - distanceB;
			} else if (nameA) {
				return -1;
			} else if (nameB) {
				return 1;
			} else {
				return 0;
			}
		});

	}
	return resources;

}


interface AppState {
	titleAddition?: string;
}
export const HeaderSearchButtonParams: FunctionComponent<AppState> = ({...props}) => {
	const searchValue = useSearchTextFromGlobalSearchParams();
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const titleAddition = props.titleAddition;
	const translation_search = useTranslation(TranslationKeys.search);
	const title = translation_search + (titleAddition ? ": "+ titleAddition : '');
	const accessibilityLabel = title;
	const tooltip = title;
	const placeholder = translation_search;

	const onSaveChange = (value: string | undefined | null, hide: () => void) => {
		if(value===null || value===undefined || value==='') {
			router.setParams({[SEARCH_PARAM_SEARCH_TEXT]: undefined});
		} else {
			router.setParams({[SEARCH_PARAM_SEARCH_TEXT]: value});
		}
		hide();
	}

	const config: MyModalActionSheetItem = {
		onCancel: async () => {

		},
		label: title,
		accessibilityLabel: accessibilityLabel,
		key: title,
		title: title,
		renderAsContentInsteadItems: (key: string, hide: () => void) => {
			// Use the custom context provider to provide the input value and setter
			return (
				<MyTextInputModalContent
					initialValue={searchValue}
					onSave={onSaveChange}
					placeholder={placeholder}
					hide={hide}
				/>
			)
		}
	}

	const onPress = () => {
		setModalConfig(config);
	}

	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBorderColor={true} leftIcon={IconNames.search_icon} {...props} onPress={onPress} />
		</>

	)
}
