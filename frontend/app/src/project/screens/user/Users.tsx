// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {View, Text, Input, Button} from "native-base";
import {Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {Profiles} from "./Profiles";
import {useSynchedProfile} from "../../components/profile/ProfileAPI";

interface AppState {

}
export const Users: FunctionComponent<AppState> = (props) => {

    const [profile, setProfile] = useSynchedProfile();
    Navigation.navigateTo(Profiles, {id: profile?.id})
//    NavigatorHelper.navigateWithoutParams(Profiles, false, {id: profile?.id})

    // corresponding componentDidMount
    useEffect(() => {

    }, [props?.route?.params])

  return (
      <View style={{width: "100%"}}>

      </View>
  )
}
