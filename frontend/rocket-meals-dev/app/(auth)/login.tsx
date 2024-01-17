import {Link, router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import {StyleSheet, Text, View} from 'react-native';
import {useRoute} from "@react-navigation/core";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {useEffect} from "react";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Button, Divider} from "@gluestack-ui/themed";
import {ExternalLink} from "@/components/ExternalLink";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";


export default function Login() {

    const [loggedIn, setLoggedIn] = useSyncState<boolean>(NonPersistentStore.loggedIn)
    const [debugAutoLogin, setDebugAutoLogin] = useSyncState<boolean>(PersistentStore.debugAutoLogin)

    const slug = useLocalSearchParams();

    // get params from url like /home?param1=1&param2=2
    const params = useGlobalSearchParams();

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
            <Text>{"loggedIn: "+loggedIn}</Text>
            <Text>{"route.name: "+route.name}</Text>
            <Text>{"slug: "+JSON.stringify(slug, null, 2)}</Text>
            <Text>{"params: "+JSON.stringify(params)}</Text>

            <ExternalLink href={ServerAPI.getUrlToProviderLogin("google")} style={styles.link}>
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
