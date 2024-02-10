import {useWindowDimensions} from "react-native";
import {EdgeInsets, useSafeAreaInsets} from "react-native-safe-area-context";

export function getMinWithLargeDevice(): number {
    return 1024;
}

export function getMinWithXLDevice(): number {
    return 1524;
}

export function useIsLargeDevice(): boolean {
    const dimensions = useWindowDimensions();

    return dimensions.width >= getMinWithLargeDevice();

}

export function useInsets(): EdgeInsets {
    const insets = useSafeAreaInsets();

    return {
        top: insets.top,
        right: insets.right,
        bottom: insets.bottom,
        left: insets.left,
    };
}
