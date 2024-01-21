import React from 'react';
import {useProjectLogoAssetId} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {DirectusImage} from "@/components/project/DirectusImage";
import {ViewProps} from "react-native";

export const ProjectLogo = ({...props}: ViewProps) => {

    const projectLogoAssetId = useProjectLogoAssetId()
    return <DirectusImage assetId={projectLogoAssetId} {...props}  />
}