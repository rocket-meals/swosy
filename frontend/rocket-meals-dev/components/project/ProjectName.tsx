import React, {FunctionComponent} from 'react';
import {
    useProjectDescription,
    useProjectName,
} from "@/states/ProjectInfo";
import {View, Text} from "@/components/Themed";

interface AppState {

}
export const ProjectName: FunctionComponent<AppState> = (props) => {
    let project_name = useProjectName();
    let project_descriptor = useProjectDescription();

    function renderVersion(){
        return(
            <View style={{marginTop: 0, marginLeft: 0, justifyContent: "center"}}>
                <Text style={{fontSize: 12}} >
                    {project_descriptor}
                </Text>
            </View>
        )
    }

    return(
        <View style={{marginTop: 0, marginLeft: 16, justifyContent: "center"}}>
            <View style={{marginTop: 0, marginLeft: 0, justifyContent: "center"}}>
                <Text style={{fontSize: 24, fontWeight: "bold"}} >
                    {project_name}
                </Text>
            </View>
            {renderVersion()}
        </View>
    )
}
