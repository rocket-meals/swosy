import {Navigator, Redirect, Stack} from 'expo-router';
import {useState} from "react";
import {Text} from "@/components/Themed"
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import Slot = Navigator.Slot;

export default function AppLayout() {
    const [ isLoading, setIsLoading ] = useState<boolean>(false);
    const [loggedIn, setLoggedIn] = useSyncState<boolean>(NonPersistentStore.loggedIn)

    // AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

    // You can keep the splash screen open, or render a loading screen like we do here.
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    // Only require authentication within the (app) group's layout as users
    // need to be able to access the (auth) group and sign in again.
    if (!loggedIn) {
        // On web, static rendering will stop here as the user is not authenticated
        // in the headless Node process that the pages are rendered in.
        // @ts-ignore
        return <Redirect href="/login" />;
    }

    // This layout can be deferred because it's not the root layout.
    return <Slot />;
}
