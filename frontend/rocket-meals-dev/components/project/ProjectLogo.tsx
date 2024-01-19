import React, {FunctionComponent} from 'react';
import {useProjectLogoAssetId} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {DirectusImage} from "@/components/project/DirectusImage";
import {ViewStyleProps} from "@react-types/shared";

// Extend the default ViewStyleProps with our own.
interface AppState{
    style?: ViewStyleProps<any>;
}

export const ProjectLogo: FunctionComponent<AppState> = (props) => {

    const projectLogoAssetId = useProjectLogoAssetId()
    return <DirectusImage assetId={projectLogoAssetId} style={props?.style} />
}
