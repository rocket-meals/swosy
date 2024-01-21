import FontAwesome from '@expo/vector-icons/FontAwesome';
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Navigator} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect, useState} from 'react';

import {GluestackUIProvider} from "@gluestack-ui/themed"
import {config} from "@gluestack-ui/config"
import {StoreProvider} from "easy-peasy";
import {SyncState, useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {Text, View} from "@/components/Themed";
import {useServerInfoRaw} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import {SecureStorageHelper} from "@/helper/storage_helper/SecureStorageHelper";
import {SecureStorageHelperAbstractClass} from "@/helper/storage_helper/SecureStorageHelperAbstractClass"; // Optional if you want to use default theme
import Slot = Navigator.Slot;

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const syncState = new SyncState();
SecureStorageHelperAbstractClass.setInstance(new SecureStorageHelper());

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(app)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storageLoaded, setStorageLoaded] = useState(false);


  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    async function loadStorage() {
        await SecureStorageHelperAbstractClass.init();
        await syncState.init();
        setStorageLoaded(true);
    }

    loadStorage();
  }, []);

  useEffect(() => {
    if (fontsLoaded && storageLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageLoaded]);

  if (!fontsLoaded || !storageLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function AuthFlowUserCheck(){

  console.log("AuthFlowUserCheck")

  const [serverInfo, setServerInfo] = useServerInfoRaw();

  const [refreshToken, setRefreshToken] = useSyncState<string>(PersistentSecureStore.refresh_token)
  const [initialRefreshDone, setInitialRefreshDone] = useState<boolean>(false)
    // 2. Check if user is logged in
    // if user is authenticated (logged in or anonymous) in, load collections and user information
    // if user is not authenticated in, go to login screen

  useEffect(() => {
    // call anonymous function
    (async () => {
      console.log("AuthFlowUserCheck useEffect")
      console.log("refreshToken", refreshToken)

      if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
        if(!!refreshToken){ // but only if we have a refresh token
          try {
            let result = await ServerAPI.authenticate_with_access_token(refreshToken);
          } catch (e) {
            console.log("AuthFlowUserCheck useEffect error", e)
            setRefreshToken(null)
          }
        }
      }
      setInitialRefreshDone(true)
    })();
  }, []);

  if(!initialRefreshDone){
    return null;
  }

    return(
        <Slot />
    )
}

function ServerStatusFlow(){
  console.log("AuthFlow")

  const [serverInfo, setServerInfo] = useServerInfoRaw();
  const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

  // TODO: move this to a helper function
  ServerAPI.createAuthentificationStorage(async () => {

    // We can't use the authData directly, because it is a hook and the data is not updated yet when we call this function
    // So we have to fetch the data from the storage directly
    let authDataRaw = await SecureStorageHelperAbstractClass.getItem(PersistentSecureStore.authentificationData)
    console.log("authDataRaw", authDataRaw)
    if(!authDataRaw){
      return null;
    } else {
        return JSON.parse(authDataRaw)
    }
  }, async (newAuthData) => {
    setAuthData(newAuthData) // update the hook but its set asyncronous, so we have to update the storage directly
    await SecureStorageHelperAbstractClass.setItem(PersistentSecureStore.authentificationData, JSON.stringify(newAuthData)) // but hook is async, so we have to update the storage directly
  })

  console.log("serverInfo", serverInfo)

  useEffect(() => {
    // call anonymous function
    (async () => {
      let remote_server_info = await ServerAPI.downloadServerInfo();
      if(remote_server_info.status === "offline"){
        console.log("Server is offline at fetching remote")
          if(!!serverInfo){
            console.log("Server is offline at fetching remote, but we have local data")
            remote_server_info = serverInfo;
            remote_server_info.status = "cached"
          }
      }

      setServerInfo(remote_server_info);
    })();
  }, []);

    // 1. load server information
  if(!serverInfo){
    return(
        <View>
          <Text>{"Loading server Info"}</Text>
          <Text>{JSON.stringify(serverInfo, null, 2)}</Text>
        </View>
    )
  }

  if(serverInfo.status === "offline"){
    return(
        <View>
          <Text>{"Server is offline and no data is cached"}</Text>
          <Text>{JSON.stringify(serverInfo, null, 2)}</Text>
        </View>
    )
  }

  // in case server is offline, but we have cached data or server is online we can continue

  return <AuthFlowUserCheck />
}

function RootLayoutNav() {
  const colorScheme = "dark"

  let store = syncState.getStore();

  return (
      <StoreProvider store={store}>
        <GluestackUIProvider config={config}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ServerStatusFlow />
          </ThemeProvider>
        </GluestackUIProvider>
      </StoreProvider>
  );
}
