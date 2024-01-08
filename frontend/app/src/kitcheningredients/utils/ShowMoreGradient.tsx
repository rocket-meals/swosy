// @ts-nocheck
import React, {FunctionComponent, useEffect} from "react";
import {useColorModeValue, useToken, View} from "native-base";
import {LinearGradient} from "expo-linear-gradient";
import {ShowMoreGradientPlaceholder} from "./ShowMoreGradientPlaceholder";
import {ConfigHolder} from "../ConfigHolder";
import {ScrollViewProps} from "react-native";

interface AppState {
  horizontal?: boolean
}
export const ShowMoreGradient: FunctionComponent<AppState> = (props) => {
  const horizontal = props?.horizontal;

	const [lightBg, darkBg] = useToken(
		'colors',
		[ConfigHolder.styleConfig.backgroundColor.light, ConfigHolder.styleConfig.backgroundColor.dark],
		'blueGray.900',
	);
	const bgColor = useColorModeValue(lightBg, darkBg);
	const gradColors = [bgColor+'00', bgColor+'FF'];

  useEffect(() => {
    let isMounted = true;  // mutable flag

    return () => { isMounted = false };  // cleanup toggles value, if unmounted
  }, []);  // adjust dependencies to your needs

  function renderGradient(){
    /**
     * Removed due to cleanUp Bugs in Linear Gradient
    return (
      <LinearGradient
        style={{flex: 4}}
        colors={gradColors}
        pointerEvents={'none'}
      />
    )

     */

    const heightWidthStyle = horizontal ? {height: "100%"} : {width: "100%"};

    // Custom LinearGradient
    const steps = new Array(5).fill(0);
    return(
      <>
        {steps.map((_, i) => (
          <View
            pointerEvents={'none'}
            key={i}
            style={{
              flex: 1,
              backgroundColor: bgColor,
              opacity: i / steps.length,  // Increase the opacity for each step
              ...heightWidthStyle
            }}
          />
        ))}
      </>
    )
  }

  const heightWidthStyle = horizontal ? {height: "100%", width: "auto"} : {width: "100%", height: "auto", };
  const flexDirection = horizontal ? "row" : "column";

	return (
		<View pointerEvents="none" style={{position: "absolute", right: 0, bottom: 0, ...heightWidthStyle}}>
			<ShowMoreGradientPlaceholder />
			<View style={{position: "absolute", flexDirection: flexDirection, height: "100%", width: "100%", bottom: 0, right: 0}}>
        {renderGradient()}
				<View style={{flex: 1, backgroundColor: bgColor}} />
			</View>
		</View>
	);
}
