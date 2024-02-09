import {useSyncState} from "@/helper/syncState/SyncState";
import {ServerInfo} from "@/helper/database/server/ServerAPI";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useIsDemo} from "@/states/SynchedDemo";
import {DEMO_ASSET_IDS} from "@/components/project/DirectusImageDemoSources";

export function useServerInfoRaw(){
  return useSyncState<ServerInfo>(PersistentStore.server_info);
}

export function useServerInfo(){
  const [serverInfo, setServerInfo] = useServerInfoRaw();
  let usedServerInfo = serverInfo
  const isDemoMode = useIsDemo()
  if(isDemoMode){
    usedServerInfo = {
      status: "cached",
      info: {
        project: {
          project_name: "SWOSY ",
          project_descriptor: "Studierendenwerk Osnabrück",
          default_language: "de-DE",
          project_logo: DEMO_ASSET_IDS.SWOSY_LOGO,
          project_color: "#FCDE18",
          public_foreground: null,
          public_background: null,
          public_note: null,
          custom_css: null,
        }
      },
    }
  }

  return usedServerInfo;
}

export function useServerStatus(){
  const serverInfo = useServerInfo();
  return serverInfo?.status;
}

export function useIsServerOnline(){
  const status = useServerStatus();
  return status === "online"
}

export function useIsServerCached(){
  const status = useServerStatus();
  return status === "cached"
}