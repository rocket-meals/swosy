// @ts-nocheck
import React, {FunctionComponent, useEffect} from "react";
import {useColorMode} from "native-base";
import ColorCodeHelper from "./ColorCodeHelper";
import {useSynchedState} from "../synchedstate/SynchedState";
import {RequiredStorageKeys} from "../storage/RequiredStorageKeys";
import {TouchableOpacity} from "react-native";

interface AppState {
  onPress: (callback, nextTheme) => {}
}
export const ThemeChanger: FunctionComponent<AppState> = (props) => {

	let storageKey = RequiredStorageKeys.CACHED_THEME;
	const [value, setValue] = useSynchedState(storageKey);
	const { colorMode, toggleColorMode } = useColorMode();
	let nextTheme = colorMode===ColorCodeHelper.VALUE_THEME_LIGHT ? ColorCodeHelper.VALUE_THEME_DARK : ColorCodeHelper.VALUE_THEME_LIGHT;

	// corresponding componentDidMount
	useEffect(() => {

	}, [colorMode])

  function handleChange(nextTheme){
    setValue(nextTheme)
    toggleColorMode();
  }

	return(
		<TouchableOpacity
			onPress={() => {
			  if(!!props.onPress){
			    props.onPress(handleChange.bind(null, nextTheme), nextTheme)
        } else {
          handleChange(nextTheme);
        }
			}} >
			{props.children}
		</TouchableOpacity>
	)
}
