import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {DarkTheme, DefaultTheme, Theme} from "@react-navigation/native";
import {useColorScheme as useDefaultColorScheme} from "react-native";
import {ColorSchemeName as RNColorSchemeName} from "react-native/Libraries/Utilities/Appearance";

/**
 * Enum for raw color scheme names including system setting.
 */
export enum MyColorSchemeKey {
    Light = "light",
    Dark = "dark",
    System = "system"
    // TODO: Idea to automatically set the color scheme based on the time of day.
}

/**
 * Retrieves all values from MyColorSchemeKey enum.
 * @returns Array of MyColorSchemeKey values.
 */
export function getMyColorSchemeKeyOptions(): MyColorSchemeKey[] {
    return Object.values(MyColorSchemeKey);
}

/**
 * Custom hook to get and set color scheme raw value.
 * @returns Tuple containing color scheme raw value and setter function.
 */
export function useMyColorSchemeKeySavedOption(): [MyColorSchemeKey | null, (newValue: MyColorSchemeKey) => void] {
    const [colorSchemeRaw, setColorSchemeRaw] = useSyncState<MyColorSchemeKey>(PersistentStore.colorSchemeName)
    return [colorSchemeRaw, setColorSchemeRaw]
}

function isColorSchemeKeyValid(colorSchemeKey: string | null): boolean {
    if(!colorSchemeKey){
        return false;
    }
    return getMyColorSchemeKeyOptions().includes(colorSchemeKey as MyColorSchemeKey);
}

function getBestFittingSystemColorSchemeKey(systemColorScheme: RNColorSchemeName): MyColorSchemeKey {
    if(!!systemColorScheme){
        // @ts-ignore Ignore this error since the value of RNColorSchemeName might change in the future.
        if(isColorSchemeKeyValid(systemColorScheme) && systemColorScheme !== MyColorSchemeKey.System){
            return systemColorScheme as MyColorSchemeKey;
        }
    }
    return MyColorSchemeKey.Light; // Default value
}

export function useColorSchemeKeyToThemeDictionary(): Record<MyColorSchemeKey, Theme> {
    let systemColorScheme: RNColorSchemeName = useDefaultColorScheme(); // light' | 'dark' | null | undefined;

    let defaultMap = {
        [MyColorSchemeKey.System]: DefaultTheme,
        [MyColorSchemeKey.Light]: DefaultTheme,
        [MyColorSchemeKey.Dark]: DarkTheme
    }

    let bestFittingSystemColorSchemeKey = getBestFittingSystemColorSchemeKey(systemColorScheme);
    let bestFittingSystemColorSchemeTheme = defaultMap[bestFittingSystemColorSchemeKey];
    defaultMap[MyColorSchemeKey.System] = bestFittingSystemColorSchemeTheme;

    return defaultMap;
}

/**
 * Custom hook to determine the color scheme name based on system setting and saved user preference.
 * It first checks if the user has saved a preference. If not, it checks the system setting.
 * @returns MyColorSchemeKey based on system setting or user preference.
 */
export function useMyColorSchemeKeyDetermined(): MyColorSchemeKey {
    const [colorSchemeRaw, setColorSchemeRaw] = useMyColorSchemeKeySavedOption()
    if(isColorSchemeKeyValid(colorSchemeRaw)){
        return colorSchemeRaw as MyColorSchemeKey;
    }
    return MyColorSchemeKey.System;
}

/**
 * Custom hook to get the theme based on the current color scheme.
 * @returns Theme object based on the current color scheme.
 */
export function useThemeDetermined(): Theme {
    let colorSchemeKey = useMyColorSchemeKeyDetermined();
    let colorSchemeKeyToThemeDictionary = useColorSchemeKeyToThemeDictionary();
    return colorSchemeKeyToThemeDictionary[colorSchemeKey];
}

/**
 * Custom hook to determine if the current theme is dark.
 * @returns Boolean indicating if the current theme is dark.
 */
export function useIsDarkTheme(): boolean {
    let theme = useThemeDetermined();
    return theme.dark;
}
