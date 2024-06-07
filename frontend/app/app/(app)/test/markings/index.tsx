import {Heading, Text, View} from '@/components/Themed';
import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MyButton} from '@/components/buttons/MyButton';

export default function MarkingsTestScreen() {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict()

	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>
					{'Markings'}
				</Heading>
				<View style={{
					width: '100%',
				}}
				>
					<Text>
						{JSON.stringify(markingsDict, null, 2)}
					</Text>
				</View>
			</MyScrollView>
		</MySafeAreaView>
	);
}
