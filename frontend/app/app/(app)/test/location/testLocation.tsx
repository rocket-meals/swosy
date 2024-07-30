import {Heading, Text} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {useState} from "react";
import {MyButton} from "@/components/buttons/MyButton";

import * as Location from 'expo-location';
import {IconNames} from "@/constants/IconNames";

export default function LocationTestScreen() {

	const [location, setLocation] = useState(null);
	const [status, setStatus] = useState(null);
	const [errorMsg, setErrorMsg] = useState(null);


	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>{'Location Test Screen'}</Heading>
				<MyButton text={"GET LOCATION"} accessibilityLabel={'Get Location'} leftIcon={IconNames.create_icon} onPress={async () => {
					let {status} = await Location.requestForegroundPermissionsAsync();
					setStatus(status);
					if (status !== 'granted') {
						setErrorMsg('Permission to access location was denied');
						return;
					}

					let location = await Location.getCurrentPositionAsync({});
					setLocation(location);
				}	} />

				<Text>
					{'Status: ' + status}
				</Text>
				<Text>
					{'Location: '}
				</Text>
				<Text>
					{JSON.stringify(location, null, 2)}
				</Text>
				<Text>
					{'Error Message: ' + errorMsg}
				</Text>
			</MyScrollView>
		</MySafeAreaView>
	);
}
