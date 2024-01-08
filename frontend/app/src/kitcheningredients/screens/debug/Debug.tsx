// @ts-nocheck
import React, {useEffect, useRef, useState} from "react";
import {Button, Input, Text, View} from "native-base";
import {keyof} from "ts-keyof";
import {TouchableOpacity} from "react-native";
import {DeveloperSettings} from "../settings/DeveloperSettings";
import {DebugDevice} from "./DebugDevice";
import {Navigation} from "./../../navigation/Navigation";

export const Debug = (props) => {

	async function downloadServerStatus(){

	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

  function renderOpenDeveloperSettings(){
    return(
      <TouchableOpacity onPress={() => {
        Navigation.navigateTo(DeveloperSettings)
      }}
      ><Text>{"Developer Settings"}</Text></TouchableOpacity>
    )
  }

	return(
		<>
			<Text>{"Debug Screen"}</Text>
      {renderOpenDeveloperSettings()}
      <DebugDevice />
		</>
	)
}

Debug.displayName = keyof({ Debug });
