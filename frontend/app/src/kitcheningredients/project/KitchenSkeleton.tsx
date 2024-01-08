// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Skeleton, View} from "native-base";
import {FadeInFadeOut} from "../components/animatedViews/FadeInFadeOut";
import {ActivityIndicator} from "react-native";
import {useBackgroundColor} from "../templates/useBackgroundColor";
import {useProjectColor} from "../templates/use";
import {useThemeTextColor} from "../helper/HelperHooks";

export const KitchenSkeleton: FunctionComponent = (props) => {

  const bgColor = useBackgroundColor()
  const defaultColor = useThemeTextColor();

  // Takes a lot of cpu power
//  <Skeleton height={"100%"} width={"100%"}/>

	return (
		<View style={{height: "100%", width: "100%", flex: 1, justifyContent: "center", alignItems: "center"}} {...props} >
      <ActivityIndicator size={"large"} color={defaultColor} />
		</View>
	);
}
