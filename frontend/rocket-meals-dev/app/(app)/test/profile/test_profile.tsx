import {useCurrentUser} from "@/states/User";
import {useState} from "react";
import {Profiles} from "@/helper/database_helper/databaseTypes/types";
import {loadProfileRemote} from "@/states/SynchedProfile";
import {Text, View} from "@/components/Themed";
import {Button, Divider} from "@gluestack-ui/themed";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export default function HomeScreen() {

    let [currentUser, setUserWithCache] = useCurrentUser();
    const [loadedProfile, setLoadedProfile] = useState<Profiles | undefined>(undefined)


    async function loadProfile(){
        let remoteProfile = await loadProfileRemote(currentUser)
        setLoadedProfile(remoteProfile);
    }

    return (
        <MyScrollView style={{width: "100%", height: "100%"}}>
            <View style={{width: "100%", height: "100%"}}>
                <Text>{"Profile Test"}</Text>
                <Text>{"currentUser"}</Text>
                <Text>{JSON.stringify(currentUser, null, 2)}</Text>
                <Divider />
                <Button onPress={loadProfile} ><Text>{"Load"}</Text></Button>
                <Text>{"loadedProfile"}</Text>
                <Text>{JSON.stringify(loadedProfile, null, 2)}</Text>
            </View>
        </MyScrollView>
    );
}
