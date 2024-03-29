import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import React from 'react';
import {Text, View} from '@/components/Themed';
import {useAllSyncStates} from '@/helper/syncState/SyncState';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";

export default function HomeScreen() {
	const allSyncStates = useAllSyncStates();

	const renderedRows: any[] = [];
	const allSyncStatesKeys = Object.keys(allSyncStates);
	for (let i = 0; i < allSyncStatesKeys.length; i++) {
		const key = allSyncStatesKeys[i];
		const value = allSyncStates[key];

		const config: MyModalActionSheetItem = {
			accessibilityLabel: key,
			key: key,
			label: key,
			title: key,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return (
					<MySafeAreaView>
						<MyScrollView>
							<View style={{
								width: '100%',
								padding: 20,
							}}
							>
								<Text>
									{JSON.stringify(value, null, 2)}
								</Text>
							</View>
						</MyScrollView>
					</MySafeAreaView>
				);
			}
		}

		renderedRows.push(
			<SettingsRowActionsheet accessibilityLabel={key} config={config} labelLeft={key} />
		);
	}

	return (
		<MySafeAreaView>
			<ScrollViewWithGradient>
				{renderedRows}
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}
