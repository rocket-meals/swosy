import {useWindowDimensions} from "react-native";

export function useIsLargeDevice() {
    const dimensions = useWindowDimensions();

    return dimensions.width >= 1024;

}