import {router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import {Appearance, ScrollView, StyleSheet} from 'react-native';
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {useEffect, useState} from "react";
import {Button, Divider} from "@gluestack-ui/themed";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {Text, TextInput, View} from "@/components/Themed";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import {ButtonAuthProvider} from "@/components/buttons/ButtonAuthProvider";
import {ButtonAuthAnonym} from "@/components/buttons/ButtonAuthAnonym";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {ServerSsoAuthProviders} from "@/components/auth/ServerSsoAuthProviders";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {ProjectLogo} from "@/components/project/ProjectLogo";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";
import {ProjectLogoDefault} from "@/components/project/ProjectLogoDefault";
import {useProjectInfo} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";

export default function Login() {

    const loggedIn = isUserLoggedIn();
    let projectInfo = useProjectInfo();

    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
    const [changedLoginStatus, setChangedLoginStatus] = useState(false)

    // email and password for login
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [currentUser, setCurrentUser] = useCurrentUser()
    const [loginWithAccessTokenResult, setLoginWithAccessTokenResult] = useState<any>()

    const localSearchParams = useLocalSearchParams(); // get url params from router
    let directus_token = ServerAPI.getDirectusAccessTokenFromParams(localSearchParams);

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

    async function handleSuccessfulAuthentication(result: AuthenticationData) {
        setLoginWithAccessTokenResult(result)
        let me = await ServerAPI.getMe();
        setCurrentUser(me);
        console.log("login.tsx useEffect directus_token me", me)
        setChangedLoginStatus(true)
    }

    async function handleFailedAuthentication(e: any) {
        console.log("login.tsx authentication failed")
        console.error(e)
        setLoginWithAccessTokenResult(e)
        //router.replace('/login'); // clear url params
    }

    async function authenticate_with_access_token(directus_token: string | null | undefined) {
        console.log("login.tsx useEffect directus_token");
        if(directus_token) {
            console.log("login.tsx useEffect directus_token: "+directus_token);
            ServerAPI.authenticate_with_access_token(directus_token).then((result) => {
                handleSuccessfulAuthentication(result)
            }).catch((e) => {
                handleFailedAuthentication(e)
            })
        }
    }

    async function authenticate_with_email_and_password(email: string, password: string) {
        console.log("login.tsx useEffect email: "+email+" password: "+password);
        ServerAPI.authenticate_with_email_and_password(email, password).then((result) => {
            handleSuccessfulAuthentication(result)
        }).catch((e) => {
            handleFailedAuthentication(e)
        })
    }

    // UseEffect when directus_token changes, then call login with access token
    useEffect(() => {
        authenticate_with_access_token(directus_token);
    }, [directus_token]);

    return (
        <View style={{ width: "100%", height: "100%" }}>

            <View style={{ height: 20}} />
            <ProjectLogo />

            <View  style={{ width: "100%", height: "100%" }}>
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
                <TextInput isPassword={true} value={password} onChangeText={setPassword} placeholder={"password"} />
                <Button
                    disabled={loggedIn || !email || !password}
                    onPress={() => {
                        authenticate_with_email_and_password(email, password)
                    }}>
                    <Text>
                        {"Login with email and password"}
                    </Text>
                </Button>
                <Divider />
                <Divider />
                <ServerSsoAuthProviders />
                <ButtonAuthAnonym />
                <Divider />
                <Text>
                    {JSON.stringify(currentUser, null, 2)}
                </Text>
                <View style={{ height: 20, width: 20 }} />
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
            </View>

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
