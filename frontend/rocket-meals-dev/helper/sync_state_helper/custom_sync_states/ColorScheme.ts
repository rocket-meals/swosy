import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {DarkTheme, DefaultTheme, Theme} from "@react-navigation/native";
import {useColorScheme as useDefaultColorScheme} from "react-native";
import {ColorSchemeName as RNColorSchemeName} from "react-native/Libraries/Utilities/Appearance";

/**
 * Enum for raw color scheme names including system setting.
 */
export enum MyColorSchemeName {
    Light = "light",
    Dark = "dark",
    System = "system"
}

/**
 * Retrieves all values from MyColorSchemeName enum.
 * @returns Array of MyColorSchemeName values.
 */
export function getMyColorSchemeNameOptions(): string[] {
    return Object.values(MyColorSchemeName);
}

/**
 * Custom hook to get and set color scheme raw value.
 * @returns Tuple containing color scheme raw value and setter function.
 */
export function useMyColorSchemeSavedOption(): [MyColorSchemeName | null, (newValue: MyColorSchemeName) => void] {
    const [colorSchemeRaw, setColorSchemeRaw] = useSyncState<MyColorSchemeName>(PersistentStore.colorSchemeName)
    return [colorSchemeRaw, setColorSchemeRaw]
}

function isColorSchemeNameValid(colorSchemeName: string): boolean {
    return getMyColorSchemeNameOptions().includes(colorSchemeName);
}

/**
 * Custom hook to determine the color scheme name based on system setting and saved user preference.
 * It first checks if the user has saved a preference. If not, it checks the system setting.
 * @returns MyColorSchemeName based on system setting or user preference.
 */
export function useMyColorSchemeNameDetermined(): MyColorSchemeName {
    const [colorSchemeRaw, setColorSchemeRaw] = useMyColorSchemeSavedOption()
    let systemColorScheme: RNColorSchemeName = useDefaultColorScheme(); // light' | 'dark' | null | undefined;

    let usedColorScheme: MyColorSchemeName = MyColorSchemeName.Light; // Default value

    if(!!colorSchemeRaw && isColorSchemeNameValid(colorSchemeRaw)){
        usedColorScheme = colorSchemeRaw;
    }

    // Determine the color scheme based on system setting or user preference
    if(!colorSchemeRaw || colorSchemeRaw === MyColorSchemeName.System){
        if(!!systemColorScheme){
            if(isColorSchemeNameValid(systemColorScheme)){
                usedColorScheme = systemColorScheme as MyColorSchemeName;
            }
        }
    }

    return usedColorScheme
}

/**
 * Custom hook to get the theme based on the current color scheme.
 * @returns Theme object based on the current color scheme.
 */
export function useThemeDetermined(): Theme {
    let colorScheme = useMyColorSchemeNameDetermined();
    if(colorScheme === MyColorSchemeName.Dark){
        return DarkTheme;
    } else {
        return DefaultTheme;
    }
}

/**
 * Custom hook to determine if the current theme is dark.
 * @returns Boolean indicating if the current theme is dark.
 */
export function useIsDarkTheme(): boolean {
    let theme = useThemeDetermined();
    return theme.dark;
}
