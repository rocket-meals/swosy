import {Link, router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import {StyleSheet, Text, View} from 'react-native';
import {useRoute} from "@react-navigation/core";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {useEffect, useState} from "react";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Button, Divider} from "@gluestack-ui/themed";
import {ExternalLink} from "@/components/ExternalLink";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {TextInput} from "@/components/Themed";


export default function Login() {

    const [loggedIn, setLoggedIn] = useSyncState<boolean>(NonPersistentStore.loggedIn)
    const [debugAutoLogin, setDebugAutoLogin] = useSyncState<boolean>(PersistentStore.debugAutoLogin)

    // email and password for login
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [currentUser, setCurrentUser] = useState<any>()
    const [loginWithAccessTokenResult, setLoginWithAccessTokenResult] = useState<any>()

    const localSearchParams = useLocalSearchParams(); // TODO: Need to check which one to use
    const globalSearchParams = useGlobalSearchParams();

    let params = localSearchParams;

    let directus_token = ServerAPI.getDirectusAccessTokenFromParams(params);

    // get current route name
    const route = useRoute();

    useEffect(() => {
        console.log("useEffect debugAutoLogin");
        if(debugAutoLogin) {
            setLoggedIn(true)
        }
    }, []);

    useEffect(() => {
        console.log("useEffect loggedIn");
        if(loggedIn) {
            router.replace('/');
        }
    }, [loggedIn]);


    return (
        <View style={{ }}>
            <Button
                onPress={() => {
                    setLoggedIn(true)
                }}>
                <Text>
                    {"Debug Login"}
                </Text>
            </Button>
            <Divider />
            <Button
                onPress={() => {
                    console.log("Handle sign in");
                    //signIn();
                    // Navigate after signing in. You may want to tweak this to ensure sign-in is
                    // successful before navigating.
                    router.replace('/');
                }}>
                <Text>
                    {"TODO: Normal Sign In"}
                </Text>
            </Button>
            <Divider />
            <TextInput value={email} onChangeText={setEmail} placeholder={"email"} />
            <TextInput value={password} onChangeText={setPassword} placeholder={"password"} />
            <Button
                onPress={async () => {
                    try {
                        let result = await ServerAPI.login_with_email_and_password(email, password);
                        setLoginWithAccessTokenResult(result)
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
            <Button
                disabled={!directus_token}
                onPress={async () => {
                    try {
                        let result = await ServerAPI.login_with_access_token(directus_token);
                        setLoginWithAccessTokenResult(result)
                    } catch (e) {
                        console.error(e)
                        setLoginWithAccessTokenResult(e)
                    }
                }}>
                <Text>
                    {"Use Access Token to login"}
                </Text>
            </Button>
            <Text>{"loginResult: "+JSON.stringify(loginWithAccessTokenResult, null, 2)}</Text>
            <Divider />
            <Button
                onPress={async () => {
                    try {
                        let me = await ServerAPI.getMe();
                        setCurrentUser(me)
                    } catch (e) {
                        console.error(e)
                        setCurrentUser(e)
                    }
                }}>
                <Text>
                    {"Load current user"}
                </Text>
            </Button>
            <Text>{"currentUser: "+JSON.stringify(currentUser, null, 2)}</Text>

            <Text>{"loggedIn: "+loggedIn}</Text>
            <Text>{"route.name: "+route.name}</Text>
            <Text>{"slug: "+JSON.stringify(localSearchParams, null, 2)}</Text>
            <Text>{"params: "+JSON.stringify(globalSearchParams)}</Text>
            <Text>{"directus_token: "+directus_token}</Text>

            <ExternalLink target={"_self"} href={ServerAPI.getUrlToProviderLogin("google")} style={styles.link}>
                <Text style={styles.linkText}>Test Google Login</Text>
            </ExternalLink>
        </View>
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
