import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {WikiComponentByCustomId} from '@/compositions/wikis/WikiComponentByCustomId';
import {FunctionComponent} from 'react';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';

interface AppState {
    custom_id: string
}
export const LegalScreenWithWiki: FunctionComponent<AppState> = ({custom_id}) => {
	return (
		<MySafeAreaViewThemed>
			<ScrollViewWithGradient style={{
				paddingHorizontal: 20,
				paddingVertical: 10
			}}
			>
				<WikiComponentByCustomId custom_id={custom_id} />
			</ScrollViewWithGradient>
		</MySafeAreaViewThemed>
	);
}