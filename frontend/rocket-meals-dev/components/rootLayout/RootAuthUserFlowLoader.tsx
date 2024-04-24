import React, {useEffect} from 'react';
import {useSyncState} from '@/helper/syncState/SyncState';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import {Text} from '@/components/Themed';
import {
	useIsServerCached,
	useIsServerOnline
} from '@/states/SyncStateServerInfo';
import {PersistentSecureStore} from '@/helper/syncState/PersistentSecureStore';
import {AuthenticationData} from '@directus/sdk';
import {
	getIsCachedUserAnonymous,
	useCachedUserRaw,
	useCurrentUser,
	useCurrentUserRaw
} from '@/states/User';
import {RootSyncDatabaseDownload} from '@/components/rootLayout/RootSyncDatabaseDownload';
import {RootNotificationDeepLink} from '@/components/rootLayout/RootNotificationDeepLink';
import {RootSyncDatabaseUpload} from '@/components/rootLayout/RootSyncDatabaseUpload';
import {LoadingScreen} from "@/compositions/loadingScreens/LoadingScreen";
import {RootSyncSettingsDownload} from "@/components/rootLayout/RootSyncSettingsDownload";
import {RootOnAppFocus} from "@/components/rootLayout/RootOnAppFocus";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export interface RootAuthUserFlowLoaderProps {
    children?: React.ReactNode;
}
export const RootAuthUserFlowLoader = (props: RootAuthUserFlowLoaderProps) => {
	console.log('RootAuthUserFlowLoader')

	const isServerOnline = useIsServerOnline()
	const isServerCached = useIsServerCached();

	const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
	const refreshToken = authData?.refresh_token;
	const [currentUser, setCurrentUser] = useCurrentUser()
	const [currentUserRaw, setCurrentUserRaw] = useCurrentUserRaw()
	const [cachedUserRaw, setCachedUserRaw] = useCachedUserRaw()

	// 2. Check if user is logged in
	// if user is authenticated (logged in or anonymous) in, load collections and user information
	// if user is not authenticated in, go to login screen

	useEffect(() => {
		// call anonymous function
		(async () => {
			console.log('RootAuthUserFlowLoader useEffect')
			//console.log("refreshToken", refreshToken)

			if (isServerOnline) { // if server is online, we can check if we are logged in
				console.log('RootAuthUserFlowLoader useEffect server is online')
				if (refreshToken) { // but only if we have a refresh token
					//console.log("AuthFlowUserCheck useEffect server is online and we have a refresh token")
					try {
						const result = await ServerAPI.authenticate_with_access_token(refreshToken);
						const me = await ServerAPI.getMe();
						//console.log("AuthFlowUserCheck we found a user", me)
						setCurrentUser(me);
					} catch (e) {
						//console.log("AuthFlowUserCheck useEffect error", e)
						setAuthData((currentValue) => {
							return null;
						}) // TODO maybe a logout function would be better
						setCurrentUser(null);
					}
				} else {
					console.log('RootAuthUserFlowLoader useEffect server is online, but we have no refresh token')
					// this means we are either logged out (not authenticated) or anonymous
					console.log('Lets check what the cached user is')
					console.log('cachedUser', cachedUserRaw)
					let usedCachedUserRaw = cachedUserRaw;
					const isUserAnonymous = getIsCachedUserAnonymous(usedCachedUserRaw);
					//console.log("isUserAnonymous", isUserAnonymous)
					if (isUserAnonymous) { // if we are anonymous, we can set the user to the cached user
						console.log('RootAuthUserFlowLoader useEffect server is online, but we have no refresh token and we are anonymous')
						setCurrentUser(usedCachedUserRaw?.data);
					} else { // if we are not anonymous, we are logged out (not authenticated) so we can set the user to null
						console.log('RootAuthUserFlowLoader useEffect server is online, but we have no refresh token and we are not anonymous')
						setCurrentUser(null);
					}
				}
			} else if (isServerCached) { // if server is offline, but we have cached data, we can check if we are logged in
				//console.log("AuthFlowUserCheck useEffect server is offline, but we have cached data")
				let usedCachedUserRaw = cachedUserRaw;
				if(typeof cachedUserRaw === 'string') {
					usedCachedUserRaw = JSON.parse(cachedUserRaw)
				}
				setCurrentUser(usedCachedUserRaw?.data);
			} else { // if server is offline and we have no cached data, we can't check if we are logged in
				//console.log("AuthFlowUserCheck useEffect server is offline and we have no cached data")
				setCurrentUser(null);
			}
		})();
	}, []);

	if (!currentUserRaw) {
		console.log('AuthFlowUserCheck useEffect currentUserRaw is null')
		return(
			<LoadingScreen>
				<Text>{'Authenthication flow waiting'}</Text>
			</LoadingScreen>
		)
	}

	console.log('AuthFlowUserCheck currentUserRaw: ', currentUserRaw)

	return (
		<RootSyncSettingsDownload syncForUserId={currentUser?.id} key={currentUser?.id+''}>
			<RootSyncDatabaseDownload syncForUserId={currentUser?.id} key={currentUser?.id+''}>
				<RootSyncDatabaseUpload syncForUserId={currentUser?.id} key={currentUser?.id+''}>
					<RootNotificationDeepLink key={currentUser?.id+''}>
						<RootOnAppFocus>
							{props.children}
						</RootOnAppFocus>
					</RootNotificationDeepLink>
				</RootSyncDatabaseUpload>
			</RootSyncDatabaseDownload>
		</RootSyncSettingsDownload>
	)
}