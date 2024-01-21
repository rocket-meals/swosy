import {useServerInfo} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {DarkTheme, DefaultTheme, Theme} from "@react-navigation/native";
import {ColorSchemeName as DefaultColorSchemeName, useColorScheme as useDefaultColorScheme} from "react-native";

export type MyColorSchemeName = "light" | "dark"
export type MyColorSchemeNameRaw = MyColorSchemeName | "system"; // We dont want to use ColorSchemeName from react-native since it may change in the future

export function useMyColorSchemeNameRaw(): [MyColorSchemeNameRaw | null, (newValue: MyColorSchemeNameRaw) => void] {
    const [colorSchemeRaw, setColorSchemeRaw] = useSyncState<MyColorSchemeNameRaw>(PersistentStore.colorSchemeName)
    return [colorSchemeRaw, setColorSchemeRaw]
}

export function useMyColorSchemeName(): MyColorSchemeName {
    const [colorSchemeRaw, setColorSchemeRaw] = useMyColorSchemeNameRaw()
    let defaultColorScheme = useDefaultColorScheme();

    let usedColorScheme: MyColorSchemeName = "light" // default value
    if(!colorSchemeRaw || colorSchemeRaw === "system"){ // if system is selected or non is saved, we check the system color scheme
        if(!!defaultColorScheme){
            if(defaultColorScheme === "dark"){ // defaultColorScheme may has different values than MyColorSchemeName
                usedColorScheme = "dark";
            }
            if(defaultColorScheme === "light"){
                usedColorScheme = "light";
            }
        }
    }

    return usedColorScheme
}

export function useTheme(): Theme {
    let colorScheme = useMyColorSchemeName();
    if(colorScheme === "dark"){
        return DarkTheme;
    } else {
        return DefaultTheme;
    }
}

export function useIsDarkTheme(): boolean {
    let theme = useTheme();
    return theme.dark;
}