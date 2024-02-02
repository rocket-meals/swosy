import {useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {useState} from "react";
import {Profiles} from "@/helper/database_helper/databaseTypes/types";
import {loadProfileRemote} from "@/helper/sync_state_helper/custom_sync_states/SynchedProfile";
import {View, Text} from "@/components/Themed";
import {Button, Divider} from "@gluestack-ui/themed";
import {ScrollView} from "react-native";

export default function HomeScreen() {

    let [currentUser, setUserWithCache] = useCurrentUser();
    const [loadedProfile, setLoadedProfile] = useState<Profiles | undefined>(undefined)


    async function loadProfile(){
        let remoteProfile = await loadProfileRemote(currentUser)
        setLoadedProfile(remoteProfile);
    }

    return (
        <ScrollView style={{width: "100%", height: "100%"}}>
            <View style={{width: "100%", height: "100%"}}>
                <Text>{"Profile Test"}</Text>
                <Text>{"currentUser"}</Text>
                <Text>{JSON.stringify(currentUser, null, 2)}</Text>
                <Divider />
                <Button onPress={loadProfile} ><Text>{"Load"}</Text></Button>
                <Text>{"loadedProfile"}</Text>
                <Text>{JSON.stringify(loadedProfile, null, 2)}</Text>
            </View>
        </ScrollView>
    );
}
