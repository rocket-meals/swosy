import React from 'react';
import {useProjectLogoAssetId} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {DirectusImage} from "@/components/project/DirectusImage";
import {ViewProps} from "react-native";
import {ProjectLogoDefault} from "@/components/project/ProjectLogoDefault";
import {View} from "@/components/Themed";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";

export const ProjectLogo = ({style, ...props}: ViewProps) => {

    const defaultHeightAndWidth = 64;
    const defaultStyle = {width: defaultHeightAndWidth, height: defaultHeightAndWidth}

    const projectLogoAssetId = useProjectLogoAssetId()
    let fallbackElement = <ViewWithProjectColor style={{width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
        <ProjectLogoDefault style={{width: "80%", height: "80%"}} />
    </ViewWithProjectColor>
    //let fallbackElement = undefined

    return <DirectusImage assetId={projectLogoAssetId} fallbackElement={fallbackElement} style={[defaultStyle,style]} {...props}  />
}