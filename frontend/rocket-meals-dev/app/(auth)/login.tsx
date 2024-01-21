import {Link, router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useRoute} from "@react-navigation/core";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {useEffect, useState} from "react";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Button, Divider} from "@gluestack-ui/themed";
import {ExternalLink} from "@/components/ExternalLink";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {TextInput} from "@/components/Themed";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import {UrlHelper} from "@/helper/UrlHelper";


function renderSSOButton(provider: string) {
    return renderSSOButtonWithUrl(provider, ServerAPI.getUrlToProviderLogin(provider));
}

function renderSSOButtonWithUrl(provider: string, url: string) {
    let urlToLogin = UrlHelper.getURLToLogin();
    // check if we are in expo go on mobile
    let isExpoGo = false;
    let isExpoGoWithSsoWorking = false;
    if(urlToLogin.startsWith("exp://")) {
        isExpoGo = true;
        if(urlToLogin.startsWith("exp://u.expo.dev")) {
            isExpoGoWithSsoWorking = true; // this is when the update is uploaded to expo for example via expo publish or our workflow
        } else {
            isExpoGoWithSsoWorking = false; // url is like: exp://192.168.178.35:8081 or something like that
        }
    }


    if(isExpoGo && !isExpoGoWithSsoWorking) {
        return(
            <View style={styles.link}>
                <Text style={styles.linkText}>{"Login with: "+provider}</Text>
                <Text style={styles.linkText}>{"Does not work on local ExpoGo"}</Text>
            </View>
        )
    }

    return(
        <ExternalLink href={url} style={styles.link}>
            <Text style={styles.linkText}>{"Login with: "+provider}</Text>
        </ExternalLink>
    )
}

export default function Login() {

    const [loggedIn, setLoggedIn] = useSyncState<boolean>(NonPersistentStore.loggedIn)
    const [debugAutoLogin, setDebugAutoLogin] = useSyncState<boolean>(PersistentStore.debugAutoLogin)

    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

    const slug = useLocalSearchParams();

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
        <ScrollView style={{ width: "100%", height: "100%" }}>
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
            <Button
                disabled={!(directus_token)}
                onPress={async () => {
                    try {
                        let result = await ServerAPI.authenticate_with_access_token(directus_token);
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
            <Divider />
            <Button
                disabled={!(authData?.refresh_token)}
                onPress={async () => {
                    try {
                        let result = await ServerAPI.authenticate_with_access_token(authData?.refresh_token);
                        setLoginWithAccessTokenResult(result)
                    } catch (e) {
                        console.error(e)
                        setLoginWithAccessTokenResult(e)
                    }
                }}>
                <Text>
                    {"Use Auth Data from saved data Token to login, but thats not needed since the storage is fetched by the sdk"}
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
            <Text>{"directus_token from url params: "+directus_token}</Text>
            <Text>{"slud: "}</Text>
            <Text>{JSON.stringify(slug, null, 2)}</Text>
            <Text>{"params: "}</Text>
            <Text>{JSON.stringify(params, null, 2)}</Text>
            <Text>{"authData from storage: "}</Text>
            <Text>{JSON.stringify(authData, null, 2)}</Text>

            {renderSSOButton("google")}
            {renderSSOButtonWithUrl("Exploit", ServerAPI.getUrlToLoginExploit())}
            <Divider />
            <Button
                onPress={async () => {
                    try {
                        setAuthData(null)
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
