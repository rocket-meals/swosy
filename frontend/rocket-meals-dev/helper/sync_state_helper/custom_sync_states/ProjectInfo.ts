import {useServerInfo} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";

export function useProjectInfo(){
  let serverInfo = useServerInfo();
  return serverInfo?.info?.project;
}

export function useProjectName(){
  let projectInfo = useProjectInfo();
  return projectInfo?.project_name;
}

export function useProjectDescription(){
  let projectInfo = useProjectInfo();
  return projectInfo?.project_descriptor;
}

export function useProjectColor(){
  let projectInfo = useProjectInfo();
  return projectInfo?.project_color || "transparent";
}

export function useProjectLogoAssetId(){
  let projectInfo = useProjectInfo();
  return projectInfo?.project_logo
}