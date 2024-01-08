// @ts-nocheck
import React, {useEffect, useRef, useState} from "react";
import {Button, Input, Text, View} from "native-base";
import {DeviceHelper} from "./../../helper/DeviceHelper";
import {DeviceInformation} from "../../helper/DeviceHelper";

export const DebugDevice = (props) => {

  const [deviceinformations, setDeviceinformations] = useState<DeviceInformation | {}>({});

	async function load(){
    setDeviceinformations(await DeviceHelper.getInformations());
	}

	// corresponding componentDidMount
	useEffect(() => {
    load();
	}, [])

  function renderDeviceInformation(key){
	  return <Text>{key+": "+deviceinformations[key]}</Text>
  }

  function renderDeviceInformations(){
    let rendered = [];
    let keys = Object.keys(deviceinformations);
    for(let key of keys){
      rendered.push(renderDeviceInformation(key));
    }
    return rendered
  }

	return(
		<>
      {renderDeviceInformations()}
		</>
	)
}
