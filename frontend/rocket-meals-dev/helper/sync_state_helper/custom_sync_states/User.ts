import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export type CachedUserInformation = {
    data: any,
    loggedIn: boolean
}

export function useLogoutCallback(): () => void {
    const [currentUser, setCurrentUser] = useCurrentUser()
    const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

    const onPress = () => {
        setAuthData(null)
        setCurrentUser(null)
    }

    return onPress
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

export function getIsUserAnonymous(user: CachedUserInformation | undefined | null): boolean {
    if(!user) return false
    return user?.data?.id === undefined || user?.data?.id === null
}

export function getAnonymousUser(): any {
    return {
        // TODO: Add some default values
        id: null,
    }
}

export function useCurrentUser(): [any | null, (newValue: any) => void] {
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