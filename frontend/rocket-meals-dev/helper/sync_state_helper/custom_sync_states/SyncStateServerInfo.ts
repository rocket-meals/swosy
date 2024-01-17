import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerInfo} from "@/helper/database_helper/server/ServerAPI";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export function useServerInfoRaw(){
  return useSyncState<ServerInfo>(PersistentStore.server_info);
}

export function useServerInfo(){
  const [serverInfo, setServerInfo] = useServerInfoRaw();
  return serverInfo;
}