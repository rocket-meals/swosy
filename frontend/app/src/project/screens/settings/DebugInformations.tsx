// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import {Device} from "../../../kitcheningredients";
import {MyThemedBox} from "../../../kitcheningredients"

interface AppState {

}
export const DebugInformations: FunctionComponent<AppState> = (props) => {

    const [deviceinformations, setDeviceinformations] = useState({});

    async function load(){
        const deviceInfo = await Device.getInformations();
        setDeviceinformations(deviceInfo);
    }

    // corresponding componentDidMount
    useEffect(() => {
        load();
    }, [props?.route?.params])

    function renderDeviceinformation(key){
        return <Text>{key+": "+deviceinformations[key]}</Text>
    }

    function renderDeviceinformations(){
        let rendered = [];
        let keys = Object.keys(deviceinformations);
        for(let key of keys){
            rendered.push(renderDeviceinformation(key))
        }
        return rendered;
    }

  return (
      <View style={{width: "100%", height: "100%"}}>
          <MyThemedBox _shadeLevel={1}>
              <Text>{"Device Informations"}</Text>
              <View style={{padding: 10}}>
                  <MyThemedBox _shadeLevel={2}>
                      {renderDeviceinformations()}
                  </MyThemedBox>
              </View>
          </MyThemedBox>
      </View>
  )
}
