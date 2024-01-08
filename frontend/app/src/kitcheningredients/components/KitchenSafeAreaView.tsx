// @ts-nocheck
import React from "react";
import {Platform, SafeAreaView, StatusBar} from "react-native";

export const KitchenSafeAreaView = (props) => {

  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight : 0

  let passedStyle = props.style || {};
  let initialStyle = {flex: 1, paddingTop: paddingTop};
  let style = Object.assign({}, initialStyle, passedStyle);

  return(
    <SafeAreaView style={style}>
      {props.children}
    </SafeAreaView>
  )

}
