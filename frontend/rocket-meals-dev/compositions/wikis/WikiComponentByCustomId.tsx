import React, {FunctionComponent} from 'react';
import { useSynchedWikiByCustomId} from '@/states/SynchedWikis';
import {WikiComponent} from '@/compositions/wikis/WikiComponent';

interface AppState {
    custom_id: string
}
export const WikiComponentByCustomId: FunctionComponent<AppState> = ({custom_id}) => {
	const wiki = useSynchedWikiByCustomId(custom_id);

	if (!wiki) {
		return null;
	}

	return <WikiComponent wiki={wiki} />
}
