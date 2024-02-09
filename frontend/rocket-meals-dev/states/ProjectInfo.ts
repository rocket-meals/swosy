import {useServerInfo} from "@/states/SyncStateServerInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

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

export function useProjectColor(): string{
  let projectInfo = useProjectInfo();
  //return "#FDFDFD"
  return projectInfo?.project_color || "transparent";
}

export function useProjectColorContrast(): string{
    let projectColor = useProjectColor();
    return useMyContrastColor(projectColor);
}

export function useProjectLogoAssetId(){
  let projectInfo = useProjectInfo();
  return projectInfo?.project_logo
}

export function useProjectPublicBackgroundAssetId(){
  let projectInfo = useProjectInfo();
  return projectInfo?.public_background
}