import {Redirect} from 'expo-router';
import React, {useState} from "react";
import {Text} from "@/components/Themed"
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";
import {MyDrawerAuthenticated} from "@/components/drawer/MyDrawerAuthenticated";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "index",
};



export default function AppLayout() {
    const [ isLoading, setIsLoading ] = useState<boolean>(false);
    const loggedIn = isUserLoggedIn();

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
        return <Redirect href="/(auth)/login" />;
    }

    // This layout can be deferred because it's not the root layout.
    return <MyDrawerAuthenticated />
}
