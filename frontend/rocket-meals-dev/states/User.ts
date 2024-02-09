import {SyncState, useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {DirectusUsers} from "@/helper/database_helper/databaseTypes/types";

export type CachedUserInformation = {
    data: DirectusUsers | undefined,
    loggedIn: boolean
}

export function useLogoutCallback(): () => void {
    return async () => {
        await SyncState.getInstance().reset();
    }
}

export function useLogoutCallbackWithoutStorageClear(): () => void {
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

    return async () => {
        setAuthData(null)
        setCurrentUser(null)
    }
}

export function useAccessToken(): string | null | undefined {
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)
    return authData?.access_token
}

export function useCachedUserRaw(): [CachedUserInformation | null, (newValue: CachedUserInformation) => void] {
    const [cachedUserRaw, setCachedUser] = useSyncState<CachedUserInformation>(PersistentStore.cachedUser)
    return [cachedUserRaw, setCachedUser]
}

export function useCurrentUserRaw(): [CachedUserInformation | null, (newValue: CachedUserInformation) => void] {
    const [cachedUser, setCachedUser] = useCachedUserRaw()
    const [currentUser, setCurrentUser] = useSyncState<CachedUserInformation>(NonPersistentStore.currentUser)
    // TODO: Update cached user
    let setUserWithCache = (newValue: any) => {
        setCurrentUser(newValue)
        setCachedUser(newValue)
    }

    return [currentUser, setUserWithCache]
}

function isDirectusUserAnonymous(user: DirectusUsers | undefined){
    if(!user) return true
    return user?.id === undefined || user?.id === null
}

/**
 * Used in the RootAuthUser Flow Loader where we want to check the cache
 * @param user
 */
export function getIsCachedUserAnonymous(user: CachedUserInformation | undefined | null): boolean {
    return isDirectusUserAnonymous(user?.data);
}

export function useIsCurrentUserAnonymous(){
    const [currentUser, setCurrentUser] = useCurrentUser();
    return isDirectusUserAnonymous(currentUser);
}

export function getAnonymousUser(): any {
    return {
        // TODO: Add some default values
        id: null,
    }
}

export function useCurrentUser(): [DirectusUsers | undefined, (newValue: any) => void] {
    const [currentUserRaw, setCurrentUserRaw] = useCurrentUserRaw()
    // TODO: Update cached user
    let setUserWithCache = (newValue: any) => {
        setCurrentUserRaw(
            {
                data: newValue,
                loggedIn: !!newValue
            }
        )
    }
    let currentUser = currentUserRaw?.data

    return [currentUser, setUserWithCache]
}

export function isUserLoggedIn(): boolean {
    let [currentUserRaw, setCurrentUserRaw] = useCurrentUserRaw()
    return !!currentUserRaw?.loggedIn
}