import {useWindowDimensions} from "react-native";

export function useIsLargeDevice(): boolean {
    const dimensions = useWindowDimensions();

    return dimensions.width >= 1024;

}