import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export enum DrawerConfigPosition {
    Left = "left",
    Right = "right",
    System = "system"
}

export type DrawerConfig = {
    position?: DrawerConfigPosition
}

function useDrawerConfigRaw(): [DrawerConfig | null, (newValue: DrawerConfig) => void] {
    const [drawerConfigRaw, setDrawerConfigRaw] = useSyncState<DrawerConfig>(PersistentStore.drawerConfig)
    return [drawerConfigRaw, setDrawerConfigRaw]
}

function useDrawerPositionByLanguage(): DrawerConfigPosition {
    return DrawerConfigPosition.Left
    // TODO: check if language is RTL (right to left) or LTR (left to right)
}

export function useDrawerPosition(): [DrawerConfigPosition | null, (newValue: DrawerConfigPosition) => void] {
    const [drawerConfigRaw, setDrawerConfigRaw] = useDrawerConfigRaw()
    const drawerPositionByLanguage = useDrawerPositionByLanguage()
    let position = drawerConfigRaw?.position || drawerPositionByLanguage

    // Check to only use position left or right
    if(!(position === DrawerConfigPosition.Left || position === DrawerConfigPosition.Right)){ // if position is not left or right
        position = DrawerConfigPosition.Left // set position to left
    }

    const setPosition = (newValue: DrawerConfigPosition) => {
        let newConfig = {...drawerConfigRaw}
        newConfig.position = newValue

        if(newValue === DrawerConfigPosition.System){
            delete newConfig.position
        }

        setDrawerConfigRaw(newConfig)
    }
    return [position, setPosition]
}

export function getDrawerPositionKeyOptions(): DrawerConfigPosition[] {
    return Object.values(DrawerConfigPosition);
}