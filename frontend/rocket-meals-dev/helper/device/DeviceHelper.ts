import {useWindowDimensions} from "react-native";

export function getMinWithLargeDevice(): number {
    return 1024;
}

export function useIsLargeDevice(): boolean {
    const dimensions = useWindowDimensions();

    return dimensions.width >= getMinWithLargeDevice();

}