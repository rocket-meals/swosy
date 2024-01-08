import React, {FunctionComponent, useEffect, useState} from "react";
import {View, Text, Button} from "native-base";
import {useNearestLocation} from "../../../helper/synchedHelper/useNearestLocation";
import {CommonSystemActionHelper} from "../../../helper/SystemActionHelper";

interface AppState {

}
export const PositionDebug: FunctionComponent<AppState> = (props) => {

    const location = useNearestLocation();

    // corresponding componentDidMount
    useEffect(() => {
        // @ts-ignore
    }, [props?.route])

  return (
      <View style={{width: "100%", height: "100%"}}>
          <Text>{"Debug Position"}</Text>
          <Text>{"lat: "+location.latitude}</Text>
          <Text>{"lon: "+location.longitude}</Text>
          <Button onPress={() => {
              CommonSystemActionHelper.openMaps(location);
          }} ><Text>{"Open Position in system Map"}</Text></Button>
      </View>
  )
}
