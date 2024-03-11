import { useProfileLanguageCode, useSynchedProfile} from '@/states/SynchedProfile';
import {Text, View} from '@/components/Themed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';

export default function HomeScreen() {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
	const [languageCode, setLanguageCode]  = useProfileLanguageCode()

	return (
		<MyScrollView>
			<View style={{width: '100%', height: '100%'}}>
				<Text>{'profile'}</Text>
				<Text>{JSON.stringify(profile, null, 2)}</Text>
				<Text>{'usedLanguageCode'}</Text>
				<Text>{JSON.stringify(languageCode, null, 2)}</Text>
			</View>
		</MyScrollView>
	);
}
