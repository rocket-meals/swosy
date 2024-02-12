import {useCurrentUser} from "@/states/User";
import {useState} from "react";
import {Profiles} from "@/helper/database/databaseTypes/types";
import {loadProfileRemote, useProfileLanguageCode, useSynchedProfile} from "@/states/SynchedProfile";
import {Text, View} from "@/components/Themed";
import {Button, Divider} from "@gluestack-ui/themed";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export default function HomeScreen() {

    const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
    const usedLanguageCode = useProfileLanguageCode()

    return (
        <MyScrollView>
            <View style={{width: "100%", height: "100%"}}>
                <Text>{"profile"}</Text>
                <Text>{JSON.stringify(profile, null, 2)}</Text>
                <Text>{"usedLanguageCode"}</Text>
                <Text>{JSON.stringify(usedLanguageCode, null, 2)}</Text>
            </View>
        </MyScrollView>
    );
}
