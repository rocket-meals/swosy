// @ts-nocheck
import React, {useEffect, useState} from 'react';
import {View,Text} from 'native-base';
import {ConfigHolder} from "../ConfigHolder";
import {useSynchedJSONState} from "../synchedstate/SynchedState";
import {RequiredStorageKeys} from "../storage/RequiredStorageKeys";
import ServerAPI from "../ServerAPI";

export const UserInitLoader = (props) => {

  const [userLocalSaved, setUser] = useSynchedJSONState(RequiredStorageKeys.CACHED_USER);
  const [syncedUser, setSyncedUser] = useState({});

  const [serverInfoLocalSaved, setServerInfo] = useSynchedJSONState(RequiredStorageKeys.CACHED_SERVER_INFO);
  const [syncedServerInfo, setSyncedServerInfo] = useState({});

  const configHolderUser = ConfigHolder.instance.getUser();

  async function load(){
    console.log("-------------------------")
    console.log("-------------------------")
    console.log("Load UserInitLoader")
    let serverStatus = await loadServerInfo();
    let isOffline = !serverStatus;
    await ConfigHolder.instance.setState({offline: isOffline});
    if(!isOffline){
      console.log("Load UserInitLoader: Online")
      let userRemote = await ConfigHolder.instance.loadUser();
      console.log("Load UserInitLoader: userRemote", userRemote)
      setUser(userRemote);
      setSyncedUser(userRemote);

      setServerInfo(serverStatus)
      setSyncedServerInfo(serverStatus)
    } else {
      ServerAPI.tempStore.serverInfo = serverInfoLocalSaved;
      await ConfigHolder.instance.setUser(userLocalSaved, null);
    }
  }

  async function loadServerInfo(){
    try{
      return await ServerAPI.getServerInfo();
    } catch (err){
      console.log("Error at get Server Info: ",err);
    }
  }

  useEffect(() => {
    load();
  }, [])

  useEffect(() => {
    if(JSON.stringify(userLocalSaved) == JSON.stringify(syncedUser)){
      ConfigHolder.instance.setUser(userLocalSaved, null);
    }
  }, [userLocalSaved, syncedUser])

  useEffect(() => {
    if(JSON.stringify(serverInfoLocalSaved) == JSON.stringify(syncedServerInfo)){
      ServerAPI.tempStore.serverInfo = serverInfoLocalSaved;
    }
  }, [serverInfoLocalSaved, syncedServerInfo])

  return (
    null
  );
}
