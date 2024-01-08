// @ts-nocheck
import React from 'react';
import ServerAPI from "../ServerAPI";
import {ServerInfoHelper} from "../helper/ServerInfoHelper";

export function useProjectColor(props?) {
  const serverInfo = props?.serverInfo || ServerAPI.tempStore.serverInfo;
  let ssoBackgroundColor = undefined;
  if(!!serverInfo){
    const ssoIconStyle = ServerInfoHelper.getSsoIconStyle(serverInfo);
    ssoBackgroundColor = ssoIconStyle?.background;
  }

  let output = ssoBackgroundColor || "transparent"
  return output;
}
