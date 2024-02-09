import React, {FunctionComponent} from 'react';
import {useProjectColor, useProjectLogoAssetId} from "@/states/ProjectInfo";
import {DirectusImage} from "@/components/project/DirectusImage";
import {ViewStyleProps} from "@react-types/shared";
import {View} from "@/components/Themed";
import {ViewProps} from "react-native";


export const ViewWithProjectColor = ({style, ...props}: ViewProps) => {

    const projectColor = useProjectColor();
    return <View {...props} style={[style, {backgroundColor: projectColor}]} />
}
