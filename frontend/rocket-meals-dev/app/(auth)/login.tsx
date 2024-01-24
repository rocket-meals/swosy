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
import {getAnonymousUser, isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {ServerSsoAuthProviders} from "@/components/auth/ServerSsoAuthProviders";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {ProjectLogo} from "@/components/project/ProjectLogo";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";
import {ProjectLogoDefault} from "@/components/project/ProjectLogoDefault";
import {useProjectInfo} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {LoginLayout} from "@/components/auth/LoginLayout";

export default function Login() {

    const loggedIn = isUserLoggedIn();

    const [changedLoginStatus, setChangedLoginStatus] = useState(false)

    const [showLoginWithUsernameAndPassword, setShowLoginWithUsernameAndPassword] = useState(false)
    const translation_show_login_with_username_and_password = useTranslation(TranslationKeys.show_login_with_username_and_password);
    const translation_sign_in= useTranslation(TranslationKeys.sign_in);

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

    async function handleSuccessfulAuthenticationWithNewCurrentUser(new_current_user: any) {
        setCurrentUser(new_current_user);
        console.log("login.tsx handleSuccessfulAuthenticationWithNewCurrentUser", new_current_user)
        setChangedLoginStatus(true)
    }

    async function handleSuccessfulAuthenticationNonAnonymous(result: AuthenticationData) {
        let me = await ServerAPI.getMe();
        handleSuccessfulAuthenticationWithNewCurrentUser(me)
    }

    async function handleFailedAuthentication(e: any) {
        console.log("login.tsx authentication failed")
        console.error(e)
        //router.replace('/login'); // clear url params
    }

    async function authenticate_as_anonymous() {
        handleSuccessfulAuthenticationWithNewCurrentUser(getAnonymousUser())
    }

    async function authenticate_with_access_token(directus_token: string | null | undefined) {
        console.log("login.tsx useEffect directus_token");
        if(directus_token) {
            console.log("login.tsx useEffect directus_token: "+directus_token);
            ServerAPI.authenticate_with_access_token(directus_token).then((result) => {
                handleSuccessfulAuthenticationNonAnonymous(result)
            }).catch((e) => {
                handleFailedAuthentication(e)
            })
        }
    }

    async function authenticate_with_email_and_password(email: string, password: string) {
        console.log("login.tsx useEffect email: "+email+" password: "+password);
        ServerAPI.authenticate_with_email_and_password(email, password).then((result) => {
            handleSuccessfulAuthenticationNonAnonymous(result)
        }).catch((e) => {
            handleFailedAuthentication(e)
        })
    }

    // UseEffect when directus_token changes, then call login with access token
    useEffect(() => {
        authenticate_with_access_token(directus_token);
    }, [directus_token]);

    function renderLoginWithUsernameAndPassword() {
        if(showLoginWithUsernameAndPassword) {
            return (
                <>
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
                </>
            )
        }
    }

    function renderWhenLoggedIn() {
        if(loggedIn) {
            return (
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
            )
        }
    }

    function renderWhenNotLoggedIn() {
        if(!loggedIn) {
            return (
                <>
                    <Text style={{fontSize: 24, fontWeight: "bold"}}>{translation_sign_in}</Text>
                    <View style={{height: 16}}></View>
                    <Divider />
                    <View style={{height: 16}}></View>
                    <ServerSsoAuthProviders />
                    <ButtonAuthAnonym onPress={authenticate_as_anonymous} />
                    <View style={{height: 16}}></View>
                    <Divider />
                    <View style={{height: 16}}></View>
                    {renderLoginWithUsernameAndPassword()}
                    <MyTouchableOpacity
                        onPress={() => {
                            setShowLoginWithUsernameAndPassword(!showLoginWithUsernameAndPassword)
                        }} accessibilityLabel={translation_show_login_with_username_and_password}>
                        <Text>
                            {translation_show_login_with_username_and_password}
                        </Text>
                    </MyTouchableOpacity>
                </>
            )
        }
    }

    return (
        <LoginLayout>
            <View  style={{ width: "100%", height: "100%" }}>

                {renderWhenLoggedIn()}
                {renderWhenNotLoggedIn()}
                <View style={{height: 16}}></View>
                <Divider />
            </View>
        </LoginLayout>
    );
}