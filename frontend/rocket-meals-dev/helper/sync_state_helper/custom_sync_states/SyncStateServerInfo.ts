import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerInfo} from "@/helper/database_helper/server/ServerAPI";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {useIsDemo} from "@/helper/sync_state_helper/custom_sync_states/SynchedDemo";
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