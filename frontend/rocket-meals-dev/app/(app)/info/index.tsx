import React from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {useLocalSearchParams} from 'expo-router';
import {useSynchedWikiByCustomId} from '@/states/SynchedWikis';
import {WikiComponent} from '@/compositions/wikis/WikiComponent';
import NotFoundScreen from "@/app/+not-found";

export function useWikiCustomIdFromLocalSearchParams() {
	const params = useLocalSearchParams<{ info_id?: string }>();
	return params.info_id as string;
}

export default function WikisCustomScreen() {
	const used_id = useWikiCustomIdFromLocalSearchParams();
	const wiki = useSynchedWikiByCustomId(used_id);

	let content: any = null;
	if (wiki) {
		content = <WikiComponent wiki={wiki} />;
	} else {
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