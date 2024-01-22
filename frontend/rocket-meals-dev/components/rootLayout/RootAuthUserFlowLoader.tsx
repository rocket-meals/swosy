import {Navigator} from 'expo-router';
import {useEffect} from 'react';
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {Text} from "@/components/Themed";
import {useServerInfoRaw} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import {
  getIsUserAnonymous,
  useCachedUserRaw,
  useCurrentUser,
  useCurrentUserRaw
} from "@/helper/sync_state_helper/custom_sync_states/User";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootAuthUserFlowLoaderProps {
    children?: React.ReactNode;
}
export const RootAuthUserFlowLoader = (props: RootAuthUserFlowLoaderProps) => {

  //console.log("AuthFlowUserCheck")

  const [serverInfo, setServerInfo] = useServerInfoRaw();

  const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
  let refreshToken = authData?.refresh_token;
  const [currentUser, setCurrentUser] = useCurrentUser()
  const [currentUserRaw, setCurrentUserRaw] = useCurrentUserRaw()
  const [cachedUserRaw, setCachedUserRaw] = useCachedUserRaw()

    // 2. Check if user is logged in
    // if user is authenticated (logged in or anonymous) in, load collections and user information
    // if user is not authenticated in, go to login screen

  useEffect(() => {
    // call anonymous function
    (async () => {
      //console.log("AuthFlowUserCheck useEffect")
      //console.log("refreshToken", refreshToken)

      if(serverInfo?.status === "online"){ // if server is online, we can check if we are logged in
        //console.log("AuthFlowUserCheck useEffect server is online")
        if(!!refreshToken){ // but only if we have a refresh token
          //console.log("AuthFlowUserCheck useEffect server is online and we have a refresh token")
          try {
            let result = await ServerAPI.authenticate_with_access_token(refreshToken);
            let me = await ServerAPI.getMe();
            //console.log("AuthFlowUserCheck we found a user", me)
            setCurrentUser(me);
          } catch (e) {
            //console.log("AuthFlowUserCheck useEffect error", e)
            setAuthData(null) // TODO maybe a logout function would be better
            setCurrentUser(null);
          }
        } else {
          //console.log("AuthFlowUserCheck useEffect server is online, but we have no refresh token")
          // this means we are either logged out (not authenticated) or anonymous
          //console.log("Lets check what the cached user is")
          //console.log("cachedUser", cachedUserRaw)
          let isUserAnonymous = getIsUserAnonymous(cachedUserRaw);
          //console.log("isUserAnonymous", isUserAnonymous)
          if(getIsUserAnonymous(cachedUserRaw)){ // if we are anonymous, we can set the user to the cached user
            setCurrentUser(cachedUserRaw?.data);
          } else { // if we are not anonymous, we are logged out (not authenticated) so we can set the user to null
            setCurrentUser(null);
          }
        }
      } else if (serverInfo?.status === "cached") { // if server is offline, but we have cached data, we can check if we are logged in
        //console.log("AuthFlowUserCheck useEffect server is offline, but we have cached data")
        setCurrentUser(cachedUserRaw?.data);
      } else { // if server is offline and we have no cached data, we can't check if we are logged in
        //console.log("AuthFlowUserCheck useEffect server is offline and we have no cached data")
        setCurrentUser(null);
      }
    })();
  }, []);

  if(!currentUserRaw){
    //console.log("AuthFlowUserCheck useEffect currentUserRaw is null")
    return <Text>{"app/_layout.tsx: Authenthication flow waiting"}</Text>
  }

    return(
        props.children
    )
}