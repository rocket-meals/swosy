import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {Custom_Wiki_Ids, useSynchedWikiByCustomId, useSynchedWikisDict} from '@/states/SynchedWikis';
import {MyDrawerCustomItemProps} from '@/components/drawer/MyDrawerCustomItemCenter';
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
import {useWikiIdFromLocalSearchParams} from "@/app/(app)/wikis";
import {useWikiCustomIdFromLocalSearchParams} from "@/app/(app)/info";

export const getInternalRouteToWiki = (wiki: Wikis) => {
	if(wiki.custom_id){
		return `info/?id=${wiki.custom_id}`
	} else {
		return `wikis/?id=${wiki.id}`
	}
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

			const visible = wiki.show_in_drawer || wiki.show_in_drawer_as_bottom_item

			if (visible) {
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
					visibleInDrawer: wiki.show_in_drawer,
					visibleInBottomDrawer: wiki.show_in_drawer_as_bottom_item
				})
			}
		}
	}

	return customDrawerItems;
}

function MyWikiCustomIdHeader(props: MyScreenHeaderPropsRequired) {
	const customId = useWikiCustomIdFromLocalSearchParams();
	const wiki = useSynchedWikiByCustomId(customId);
	const wiki_id = wiki?.id

	return <MyWikiHeaderById id={wiki_id} {...props} />
}

function MyWikiHeader(props: MyScreenHeaderPropsRequired) {
	const wikiId = useWikiIdFromLocalSearchParams()

	return <MyWikiHeaderById id={wikiId} {...props} />
}

type MyWikiHeaderByIdProps = MyScreenHeaderPropsRequired & {
	id: string | undefined
}

const MyWikiHeaderById = ({id, ...props}: MyWikiHeaderByIdProps) => {
	const [wikisDict, setWikisDict] = useSynchedWikisDict()
	const [languageCode, setLanguageCode] = useProfileLanguageCode();
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

export const getMyScreenHeaderWikisByCustomId: any = () => {
	return (props: MyScreenHeaderProps) => {
		return <MyWikiCustomIdHeader {...props} />
	}
}

const getMyScreenHeaderWikis: getMyScreenHeaderFunction = () => {
	return (props: MyScreenHeaderProps) => {
		return <MyWikiHeader {...props} />
	}
}

export function useRenderedMyDrawerWikiScreens() {
	const drawerActiveBackgroundColor = useDrawerActiveBackgroundColor()

	return [
		renderMyDrawerScreen({
				routeName: 'wikis/index',
				label: 'Wikis',
				title: 'Wikis',
				icon: 'home',
				visibleInDrawer: false,
				header: getMyScreenHeaderWikis(),
			},
			drawerActiveBackgroundColor
		),
		renderMyDrawerScreen({
				routeName: 'info/index',
				label: 'Information',
				title: 'Information',
				icon: 'home',
				visibleInDrawer: false,
				header: getMyScreenHeaderWikisByCustomId(),
			},
			drawerActiveBackgroundColor
		)
	];
}