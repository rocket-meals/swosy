import React from 'react';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {useLocalSearchParams} from 'expo-router';
import {useSynchedWikiById} from '@/states/SynchedWikis';
import {WikiComponent} from '@/compositions/wikis/WikiComponent';
import NotFoundScreen from "@/app/+not-found";

export function useWikiIdFromLocalSearchParams() {
	const params = useLocalSearchParams<{ wikis_id?: string }>();
	return params.wikis_id as string;
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
		<MySafeAreaViewThemed>
			<ScrollViewWithGradient style={{
				paddingHorizontal: 20,
				paddingVertical: 10
			}}
			>
				{content}
			</ScrollViewWithGradient>
		</MySafeAreaViewThemed>
	);
}