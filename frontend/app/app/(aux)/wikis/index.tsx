import React from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {useGlobalSearchParams} from 'expo-router';
import {useSynchedWikiByCustomId, useSynchedWikiById} from '@/states/SynchedWikis';
import {WikiComponent} from '@/compositions/wikis/WikiComponent';
import NotFoundScreen from "@/app/+not-found";
import {View, Text} from "@/components/Themed";

export const SEARCH_PARAM_WIKIS_CUSTOM_ID = 'wikis_custom_id';
export const SEARCH_PARAM_WIKIS_ID = 'wikis_id';

export function useWikiFromLocalSearchParams() {
	const used_id = useWikiIdFromGlobalSearchParams();
	const custom_id = useWikiCustomIdFromLocalSearchParams();

	const wiki_by_custom_id = useSynchedWikiByCustomId(custom_id);
	const wiki_by_id = useSynchedWikiById(used_id);
	return wiki_by_id || wiki_by_custom_id;
}

function useWikiCustomIdFromLocalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_WIKIS_CUSTOM_ID]?: string }>();
	return params?.[SEARCH_PARAM_WIKIS_CUSTOM_ID] as string;
}

function useWikiIdFromGlobalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_WIKIS_ID]?: string }>();
	return params?.[SEARCH_PARAM_WIKIS_ID] as string;
}

export default function WikisScreen() {
	return <WikisScreenComponent />;
}

export const WikisScreenComponent = () => {
	const used_id = useWikiIdFromGlobalSearchParams();
	const custom_id = useWikiCustomIdFromLocalSearchParams();
	const wiki = useWikiFromLocalSearchParams();

	let content: any = null;
	if (wiki) {
		content = <WikiComponent wiki={wiki} />;
	}  else {
		return <View>
			<Text>
				{"useWikiFromLocalSearchParams() returned null. used_id: " + used_id + ", custom_id: " + custom_id}
			</Text>
		</View>
	}

	return (
		<MySafeAreaView>
			<ScrollViewWithGradient style={{
				paddingHorizontal: 20,
				paddingVertical: 10
			}}
			>
				{content}
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}