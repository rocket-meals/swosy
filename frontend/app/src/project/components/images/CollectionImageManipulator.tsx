import React, {useEffect, useState} from "react";
import {Input, Text, View} from "native-base";
import {Icon} from "../../../kitcheningredients";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";
import {ImageUploaderTouchable} from "./ImageUploaderTouchable";
import {ImageUploaderInterface} from "./ImageUploader";
import {ImageDeleteTouchable} from "./ImageDeleteTouchable";
import Rectangle from "../../helper/Rectangle";
import {ParentSpacer} from "../../helper/ParentSpacer";

export const CollectionImageManipulator = ({collection, item, itemImageField, onUpload, ...props}: any) => {

    const data: ImageUploaderInterface ={
        collection_name: collection, field_name: itemImageField, instance_id: item?.id
    };

    const holderStyle = {
        borderRadius: "100%", padding: 10
    }

    function renderIcon(name, color){
        return(
            <ViewPercentageBorderradius style={[holderStyle, {backgroundColor: color}]}>
                <Icon name={name} size={"md"} />
            </ViewPercentageBorderradius>
        )
    }

    const touchStyle = {
        alignItems: "center", justifyContent: "center"
    }

    return(
        <ParentSpacer space={10} style={{justifyContent: "flex-end", alignItems: "flex-start", flexDirection: "row"}}>
            <ImageDeleteTouchable onUpload={onUpload} data={data} style={touchStyle} >
                {renderIcon("image-minus", "red")}
            </ImageDeleteTouchable>
            <ImageUploaderTouchable onUpload={onUpload} data={data} style={touchStyle} >
                {renderIcon("image-plus", "orange")}
            </ImageUploaderTouchable>
        </ParentSpacer>
    )
}
