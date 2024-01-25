import React, {FunctionComponent} from 'react';
import {ProjectLogo} from "./ProjectLogo";
import {View} from "@/components/Themed";
import {ProjectName} from "@/components/project/ProjectName";

const titleBoxHeight = 64;

interface AppState {
    size?: string
}
export const ProjectBanner: FunctionComponent<AppState> = (props) => {
    let boxHeight = titleBoxHeight;

    return(
        <View
            style={{flexDirection: "row" ,height: boxHeight, alignItems: "center", width: "100%"}}
        >
            <ProjectLogo rounded={true} titleBoxHeight={boxHeight-4} />
            <ProjectName />
        </View>
    )
}
