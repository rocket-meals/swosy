import {PlatformHelper} from "../helper/PlatformHelper";
import {Keyboard} from "react-native";
import React from "react";

// https://github.com/GeekyAnts/NativeBase/issues/3939
export const useKeyboardBottomInset = () => {
  const [bottom, setBottom] = React.useState(0);
  const subscriptions = React.useRef([]);

  React.useEffect(() => {
    subscriptions.current = [
      Keyboard.addListener("keyboardDidHide", (e) => setBottom(0)),
      Keyboard.addListener("keyboardDidShow", (e) => {
        if (PlatformHelper.isAndroid()) {
          setBottom(e.endCoordinates.height);
        } else if(PlatformHelper.isIOS()) {
          setBottom(
            Math.max(e.startCoordinates.height, e.endCoordinates.height)
          );
        }
      }),
    ];

    return () => {
      subscriptions.current.forEach((subscription) => {
        subscription.remove();
      });
    };
  }, [setBottom, subscriptions]);

  return bottom;
};
