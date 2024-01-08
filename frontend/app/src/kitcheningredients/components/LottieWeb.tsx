import React, {useEffect, useState, useCallback, useMemo} from "react";
import { Platform, View, Animated } from "react-native";
import Lottie from "lottie-react";
import ServerAPI from "../ServerAPI";
import { KitchenSkeleton } from "./../project/KitchenSkeleton";

export const LottieWeb = ({
                              source: initialSource,
                              width: initialWidth,
                              height: initialHeight,
                              style,
                              url,
                              autoPlay = true,
                              customLoading,
                              flex
                          }) => {
    const [width, setWidth] = useState(() => initialWidth || style?.width);
    const [height, setHeight] = useState(() => initialHeight || style?.height);
    const [source, setSource] = useState(initialSource);
    const [reloadnumber, setReloadnumber] = useState(0);

    const downloadInformations = useCallback(async () => {
        if (!source && url) {
            try {
                const api = ServerAPI.getAxiosInstance();
                const answer = await api.get(url);
                const data = answer.data;
                setSource(data);
                setReloadnumber(prev => prev + 1);
            } catch (err) {
                // Handle error
            }
        }
    }, [source, url]);

    useEffect(() => {
        downloadInformations();
    }, [downloadInformations]);

    const content = useMemo(() => {
        return source ? (
            <Lottie animationData={source} loop={true} autoplay={autoPlay} />
        ) : customLoading ? (
            customLoading
        ) : (
            <KitchenSkeleton style={{ height: "100%", width: "100%" }} />
        );
    }, [source, autoPlay, customLoading]);

    const outerStyle = flex ? { flex: 1 } : { height, width };

    return (
        <View
            style={outerStyle}
            onLayout={(event) => {
                if (flex) {
                    const { width, height } = event.nativeEvent.layout;
                    setHeight(height);
                    setWidth(width);
                }
            }}
        >
            <View style={{ height, width }}>
                <View style={{ position: "absolute", height: "100%", width: "100%" }}>
                    {content}
                </View>
            </View>
        </View>
    );
};
