import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {Custom_Wiki_Ids, useSynchedWikiByCustomId, useSynchedWikisDict} from '@/states/SynchedWikis';
import {MyDrawerCustomItemProps} from '@/components/drawer/MyDrawerCustomItem';
import {TranslationEntry, getDirectusTranslation} from '@/helper/translations/DirectusTranslationUseFunction';
import React from 'react';
import {
	getMyScreenHeaderFunction,
	MyScreenHeader, MyScreenHeaderProps,
	MyScreenHeaderPropsRequired
} from '@/components/drawer/MyScreenHeader';
import {Wikis} from '@/helper/database/databaseTypes/types';
import {
	renderMyDrawerScreen,
	useDrawerActiveBackgroundColor
} from '@/components/drawer/MyDrawer';
import { useLocalSearchParams} from 'expo-router';

export const getInternalRouteToWiki = (wiki: Wikis) => {
	return `wikis/${wiki.id}`
}

export function useMyDrawerWikiItems() {
	const [languageCode, setLanguageCode] = useProfileLanguageCode();

	const [wikisDict, setWikisDict] = useSynchedWikisDict()

	const customDrawerItems: MyDrawerCustomItemProps[] = [
		/**
         {
         label: "Hallo",
         onPress: undefined,
         onPressInternalRouteTo: undefined,
         onPressExternalRouteTo: undefined,
         icon: "home",
         position: 0
         }
         */
	]

	if (wikisDict) {
		const wikisDictKeys = Object.keys(wikisDict)
		for (let i = 0; i < wikisDictKeys.length; i++) {
			const wikiKey = wikisDictKeys[i]
			const wiki = wikisDict[wikiKey]
			const wiki_custom_id = wiki.custom_id

			const show_in_drawer = wiki.show_in_drawer

			if (show_in_drawer) {
				if (wiki_custom_id) {
					// if wiki is not Custom_Wiki_Ids (about_us, contact, terms_of_service, privacy_policy)
					const reservedCustomIds = Object.values(Custom_Wiki_Ids) as string[]
					if (reservedCustomIds.indexOf(wiki_custom_id) >= 0) {
						continue;
					}
				}

				const icon = wiki.icon || 'home'

				const translations = wiki.translations as TranslationEntry[]
				const fallback_text = wiki.id
				let label = getDirectusTranslation(languageCode, translations, 'title', false, fallback_text)

				customDrawerItems.push({
					label: label,
					onPress: undefined,
					onPressInternalRouteTo: getInternalRouteToWiki(wiki),
					onPressExternalRouteTo: wiki?.url,
					icon: icon,
					position: wiki?.position || undefined,
				})
			}
		}
	}

	return customDrawerItems;
}

function MyWikiHeader(props: MyScreenHeaderPropsRequired) {
	const [wikisDict, setWikisDict] = useSynchedWikisDict()
	const [languageCode, setLanguageCode] = useProfileLanguageCode();
	const { id } = useLocalSearchParams();
	const wikiId = id as string

	let custom_title = id as string

	if (!!wikisDict && !!wikiId) {
		const wiki = wikisDict[wikiId]
		const translations = wiki.translations as TranslationEntry[]
		const fallback_text = wiki.id
		const label = getDirectusTranslation(languageCode, translations, 'title', false, fallback_text)
		if (label) {
			custom_title = label
		}
	}

	return <MyScreenHeader custom_title={custom_title} {...props} />
}

type MyWikiHeaderByCustomIdProps = MyScreenHeaderPropsRequired & {
	customId: string
}
function MyWikiHeaderByCustomId(props: MyWikiHeaderByCustomIdProps) {
	const wiki = useSynchedWikiByCustomId(props.customId);
	const [languageCode, setLanguageCode] = useProfileLanguageCode();

	let custom_title = props.customId

	if (!!wiki) {
		const translations = wiki.translations as TranslationEntry[]
		const fallback_text = wiki.id
		const label = getDirectusTranslation(languageCode, translations, 'title', false, fallback_text)
		if (label) {
			custom_title = label
		}
	}

	return <MyScreenHeader custom_title={custom_title} {...props} />
}

export const getMyScreenHeaderWikisByCustomId: any = (customId: string) => {
	return (props: MyScreenHeaderProps) => {
		return <MyWikiHeaderByCustomId customId={customId} {...props} />
	}
}

const getMyScreenHeaderWikis: getMyScreenHeaderFunction = () => {
	return (props: MyScreenHeaderProps) => {
		return <MyWikiHeader {...props} />
	}
}

export function useRenderedMyDrawerWikiScreens() {
	const drawerActiveBackgroundColor = useDrawerActiveBackgroundColor()

	return renderMyDrawerScreen({
		routeName: 'wikis/[id]',
		label: 'Test',
		title: 'Test',
		icon: 'home',
		visibleInDrawer: false,
		header: getMyScreenHeaderWikis(),
	},
	drawerActiveBackgroundColor
	);
}