import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {useSynchedLanguageByCode} from "@/states/SynchedLanguages";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";

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

function useDrawerPositionByLanguage(): DrawerConfigPosition.Left | DrawerConfigPosition.Right {
    const [languageCode, setLanguageCode] = useProfileLanguageCode()
    const language = useSynchedLanguageByCode(languageCode)
    if(!!language){
        if(language.direction === "rtl"){
            return DrawerConfigPosition.Right
        }
    }

    return DrawerConfigPosition.Left
}

export function useDrawerPositionRaw(): [DrawerConfigPosition | null, (newValue: DrawerConfigPosition) => void] {
    const [drawerConfigRaw, setDrawerConfigRaw] = useDrawerConfigRaw()

    const setPosition = (newValue: DrawerConfigPosition) => {
        let newConfig = {...drawerConfigRaw}
        newConfig.position = newValue

        if(newValue === DrawerConfigPosition.System){
            delete newConfig.position
        }

        setDrawerConfigRaw(newConfig)
    }

    return [drawerConfigRaw?.position || null, setPosition]
}

export function useIsDrawerPermanentVisible(): boolean {
    const isLargeDevice = useIsLargeDevice(); // Determine if the device has a large screen.
    return isLargeDevice;
}

export function useDrawerPosition(): [DrawerConfigPosition.Left | DrawerConfigPosition.Right, (newValue: DrawerConfigPosition) => void] {
    const [drawerPositionRaw, setPosition] = useDrawerPositionRaw()
    const drawerPositionByLanguage = useDrawerPositionByLanguage()
    let position: DrawerConfigPosition.Left | DrawerConfigPosition.Right = drawerPositionByLanguage

    if(!!drawerPositionRaw && (drawerPositionRaw === DrawerConfigPosition.Left || drawerPositionRaw === DrawerConfigPosition.Right)){
        position = drawerPositionRaw;
    }

    // Check to only use position left or right
    if(!(position === DrawerConfigPosition.Left || position === DrawerConfigPosition.Right)){ // if position is not left or right
        position = DrawerConfigPosition.Left // set position to left
    }

    return [position, setPosition]
}

export function getDrawerPositionKeyOptions(): DrawerConfigPosition[] {
    return Object.values(DrawerConfigPosition);
}