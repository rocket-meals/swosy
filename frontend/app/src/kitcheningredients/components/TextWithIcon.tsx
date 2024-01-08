// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";

import {Icon} from "./Icon";

export interface AppState{
  icon?: any | string | undefined,
  content?: any | string | undefined,
}
export const TextWithIcon: FunctionComponent<AppState> = (props) => {

	function renderRowInformation(icon, content){

	  let renderedIcon = null;

	  if(!!icon){
      const isIconString = typeof icon === "string";
      if(isIconString){
        renderedIcon = <Text><Icon name={icon} /></Text>
      } else {
        renderedIcon = icon
      }
    }

    renderedIcon = !!renderedIcon ? <View style={{marginRight: 15}}>{renderedIcon}</View> : null;

	  let renderedContent = null;
	  if(!!content){
      if(typeof content === "string"){
        renderedContent = <Text>{content}</Text>
      } else {
        renderedContent = content
      }
    }

		return (
			<View style={{alignItems: "center", flexDirection: "row", margin: 3}}>
				{renderedIcon}<Text>{renderedContent}</Text>
			</View>
		)
	}

	return (renderRowInformation(props?.icon, props?.content || props?.children))
}
