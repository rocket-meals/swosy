// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {View, Text} from "native-base";
import {Icon, MyThemedBox, ServerAPI} from "../../../kitcheningredients";
import {UserItem} from "@directus/sdk";

interface AppState {
    user: UserItem,
    own: boolean
}
export const UsersAvatar: FunctionComponent<AppState> = (props) => {

    const user = props?.user;
    //console.log("user: ", user);

  return (
      <View style={{justifyContent: "center", alignItems: "center", width: 24, height: 24}}>
          <Icon
              name={"account-circle"}
          />
      </View>
  );
}
