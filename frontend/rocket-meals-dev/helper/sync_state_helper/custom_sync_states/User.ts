import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";

export function useCachedUser(): [any | null, (newValue: any) => void] {
    const [cachedUser, setCachedUser] = useSyncState(PersistentStore.cachedUser)
    return [cachedUser, setCachedUser]
}

export function useCurrentUserRaw(): [any | null, (newValue: any) => void] {
    const [cachedUser, setCachedUser] = useCachedUser()
    const [currentUser, setCurrentUser] = useSyncState(NonPersistentStore.currentUser)
    // TODO: Update cached user
    let setUserWithCache = (newValue: any) => {
        setCurrentUser(newValue)
        setCachedUser(newValue)
    }

    return [currentUser, setUserWithCache]
}

export function getIsUserAnonymous(user: any): boolean {
    return user?.anonymous
}

export function getAnonymousUser(): any {
    return {
        anonymous: true
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