import {router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {useRoute} from "@react-navigation/core";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {useEffect, useState} from "react";
import {Button, Divider} from "@gluestack-ui/themed";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {TextInput} from "@/components/Themed";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import ButtonAuthProvider from "@/components/buttons/ButtonAuthProvider";
import {ButtonAuthAnonym} from "@/components/buttons/ButtonAuthAnonym";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";

export default function Login() {

    const loggedIn = isUserLoggedIn();

    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
    const [changedLoginStatus, setChangedLoginStatus] = useState(false)

    const slug = useLocalSearchParams();

    // email and password for login
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [currentUser, setCurrentUser] = useCurrentUser()
    const [loginWithAccessTokenResult, setLoginWithAccessTokenResult] = useState<any>()

    const localSearchParams = useLocalSearchParams(); // TODO: Need to check which one to use
    const globalSearchParams = useGlobalSearchParams();

    let params = localSearchParams;

    let directus_token = ServerAPI.getDirectusAccessTokenFromParams(params);

    // get current route name
    const route = useRoute();

    function signIn() {
        console.log("login.tsx signIn");
        router.replace('/(app)/home');
    }

    useEffect(() => {
        console.log("login.tsx useEffect loggedIn: changedLoginStatus: "+changedLoginStatus+" loggedIn: "+loggedIn);
        if(changedLoginStatus && loggedIn){
            signIn();
        }
    }, [changedLoginStatus, loggedIn]);

    // UseEffect when directus_token changes, then call login with access token
    useEffect(() => {
        console.log("login.tsx useEffect directus_token");
        if(directus_token) {
            console.log("login.tsx useEffect directus_token: "+directus_token);
            ServerAPI.authenticate_with_access_token(directus_token).then(async (result) => {
                setLoginWithAccessTokenResult(result)
                let me = await ServerAPI.getMe();
                setCurrentUser(me);
                console.log("login.tsx useEffect directus_token me", me)
                setChangedLoginStatus(true)
            }).catch((e) => {
                console.log("useEffect directus_token error")
                console.error(e)
                setLoginWithAccessTokenResult(e)
                //router.replace('/login'); // clear url params
            })
        }
    }, [directus_token]);

    return (
        <ScrollView style={{ width: "100%", height: "100%" }}>

            <Button
                disabled={!loggedIn}
                onPress={() => {
                    console.log("Handle sign in");
                    //signIn();
                    // Navigate after signing in. You may want to tweak this to ensure sign-in is
                    // successful before navigating.
                    signIn();
                }}>
                <Text>
                    {loggedIn ? "Continue" : "Not logged in"}
                </Text>
            </Button>
            <Divider />
            <TextInput value={email} onChangeText={setEmail} placeholder={"email"} />
            <TextInput value={password} onChangeText={setPassword} placeholder={"password"} />
            <Button
                onPress={async () => {
                    try {
                        let result = await ServerAPI.authenticate_with_email_and_password(email, password);
                        setLoginWithAccessTokenResult(result)
                        //setRefreshToken(result.refresh_token)
                    } catch (e) {
                        console.error(e)
                        setLoginWithAccessTokenResult(e)
                    }
                }}>
                <Text>
                    {"Login with email and password"}
                </Text>
            </Button>
            <Divider />
            <Divider />
            <ButtonAuthProvider provider={{
                name: "google",
            }} />
            <ButtonAuthAnonym />
            <Divider />
            <Text>
                {JSON.stringify(currentUser, null, 2)}
            </Text>
            <Button
                onPress={async () => {
                    try {
                        setAuthData(null)
                        setCurrentUser(null)
                    } catch (e) {
                        console.error(e)
                    }
                }}>
                <Text>
                    {"Clear Auth Data"}
                </Text>
            </Button>
            <Divider />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: '#2e78b7',
    },
});
