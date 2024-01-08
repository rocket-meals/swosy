import React, {useEffect} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {PlatformHelper} from "./PlatformHelper";

// User has switched away from the tab (AKA tab is hidden)
const onBlur = () => {
	//console.log("Tab is blurred");
};

export function useMyFocusHandler(onFocus, deps) {

	if(PlatformHelper.isWeb()){
		return useEffect(() => {
				window.addEventListener("focus", onFocus);
				window.addEventListener("blur", onBlur);
				// Calls onFocus when the window first loads
			onFocus();
				// Specify how to clean up after this effect:
				return () => {
					window.removeEventListener("focus", onFocus);
					window.removeEventListener("blur", onBlur);
				};
		 }, deps);
	} else {
		return useFocusEffect(
			React.useCallback(() => {
				return () => {
						onFocus()
				};
			}, deps)
		);
	}
}
