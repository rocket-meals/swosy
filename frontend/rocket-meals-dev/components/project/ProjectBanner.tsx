import React, {FunctionComponent} from 'react';
import {ProjectLogo} from "./ProjectLogo";
import {View, Text} from "@/components/Themed";
import {ProjectName} from "@/components/project/ProjectName";

const titleBoxHeight = 64;

interface AppState {
    size?: string
}
export const ProjectBanner: FunctionComponent<AppState> = (props) => {
    let boxHeight = titleBoxHeight;

    return(
        <View
            style={{flexDirection: "row" , alignItems: "center", width: "100%", justifyContent: "flex-start"
        }}
        >
            <View style={{
                alignSelf: "flex-start",
            }}>
                <ProjectLogo rounded={true} titleBoxHeight={boxHeight-4} />
            </View>
            <View style={{
                alignSelf: "flex-start",
                flexGrow: 1,
            }}>
                <ProjectName/>
            </View>
        </View>
    )
}
