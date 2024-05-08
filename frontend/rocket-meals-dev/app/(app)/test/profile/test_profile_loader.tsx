import {useCurrentUser} from '@/states/User';
import {useState} from 'react';
import {Profiles} from '@/helper/database/databaseTypes/types';
import {loadProfileRemoteByUser} from '@/states/SynchedProfile';
import {Text, View} from '@/components/Themed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MyButton} from "@/components/buttons/MyButton";

export default function HomeScreen() {
	const [currentUser, setUserWithCache] = useCurrentUser();
	const [loadedProfile, setLoadedProfile] = useState<Profiles | undefined>(undefined)


	async function loadProfile() {
		const remoteProfile = await loadProfileRemoteByUser(currentUser)
		setLoadedProfile(remoteProfile);
	}

	return (
		<MyScrollView style={{width: '100%', height: '100%'}}>
			<View style={{width: '100%', height: '100%'}}>
				<Text>{'Profile Test'}</Text>
				<Text>{'currentUser'}</Text>
				<Text>{JSON.stringify(currentUser, null, 2)}</Text>
				<MyButton text={"Load"} onPress={loadProfile} />
				<Text>{'loadedProfile'}</Text>
				<Text>{JSON.stringify(loadedProfile, null, 2)}</Text>
			</View>
		</MyScrollView>
	);
}
