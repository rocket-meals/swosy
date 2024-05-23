import React from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {useLocalSearchParams} from 'expo-router';
import {useSynchedWikiById} from '@/states/SynchedWikis';
import {WikiComponent} from '@/compositions/wikis/WikiComponent';
import NotFoundScreen from "@/app/+not-found";

export function useWikiIdFromLocalSearchParams() {
	const params = useLocalSearchParams<{ wiki_id?: string }>();
	return params.wiki_id as string;
}

export default function WikisScreen() {
	const used_id = useWikiIdFromLocalSearchParams();
	const wiki = useSynchedWikiById(used_id);

	let content: any = null;
	if (wiki) {
		content = <WikiComponent wiki={wiki} />;
	}  else {
		return <NotFoundScreen />;
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