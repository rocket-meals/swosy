import {useServerInfo} from '@/states/SyncStateServerInfo';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';

export function useProjectInfo() {
	const serverInfo = useServerInfo();
	return serverInfo?.info?.project;
}

export function useProjectName() {
	const projectInfo = useProjectInfo();
	return projectInfo?.project_name;
}

export function useProjectDescription() {
	const projectInfo = useProjectInfo();
	return projectInfo?.project_descriptor;
}

export function useProjectColor(): string {
	const projectInfo = useProjectInfo();
	//return "#FDFDFD"
	return projectInfo?.project_color || 'transparent';
}

export function useProjectColorContrast(): string {
	const projectColor = useProjectColor();
	return useMyContrastColor(projectColor);
}

export function useProjectLogoAssetId() {
	const projectInfo = useProjectInfo();
	return projectInfo?.project_logo
}

export function useProjectPublicBackgroundAssetId() {
	const projectInfo = useProjectInfo();
	return projectInfo?.public_background
}

export function useProjectPublicForegroundAssetId() {
	const projectInfo = useProjectInfo();
	return projectInfo?.public_foreground
}