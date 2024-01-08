// @ts-nocheck
import React, {FunctionComponent, useState} from 'react';
import {DrawerContentScrollView} from "@react-navigation/drawer";
import {TouchableOpacity} from "react-native";
import {Text, View} from "native-base";
import {MyThemedBox} from "../helper/MyThemedBox";

import {Icon} from "../components/Icon";
import {MenuItem} from "./../navigation/MenuItem";

export interface AppState {
    menu: MenuItem,
    level: number
}
export const ExpandableDrawerItem: FunctionComponent<AppState> = (props) => {

    let menu = props?.menu;

    const [expanded, setExpanded] = useState(menu?.expanded)
    let nextExpandState = !expanded;

    let menuChilds = [];
    if(menu?.getChildItems){
        menuChilds = menu?.getChildItems();
    }
    let hasChildren = menuChilds?.length>0;

    function renderExpandIcon(){
        if(!!menu.icon){
          if(typeof menu?.icon === "string"){
            return <Icon name={menu.icon}/>;
          } else {
            return menu.icon(menu, hasChildren, expanded, props.level);
          }
        }

        if(!hasChildren){
            return <Icon name={"circle-small"}/>;
        }
        if(expanded){
            return <Icon name={"chevron-down"}/>
        } else {
            return <Icon name={"chevron-right"}/>
        }
    }

    async function handleOnPressIcon(){
        menu.expanded = nextExpandState;
        setExpanded(nextExpandState);
        if(!hasChildren){
          await menu.handleOnPress(nextExpandState);
        }
    }

    async function handleOnPressContent(){
      if(hasChildren && !expanded){
        let nextExpandState = !expanded;
        menu.expanded = nextExpandState;
        setExpanded(nextExpandState);
        await menu.handleOnPress(nextExpandState);
      } else {
        await menu.handleOnPress(expanded);
      }
    }

    function renderSubMenuContent(){
        if(!expanded){
            return null;
        }

      let renderedChilds = [];
      for(let childMenu of menuChilds){
        renderedChilds.push(<ExpandableDrawerItem key={childMenu?.key} menu={childMenu} level={props.level+1} />);
      }

        return(
            <View style={{paddingLeft: 15}}>
                <DrawerContentScrollView contentContainerStyle={{paddingTop: 0}}>
                    {renderedChilds}
                </DrawerContentScrollView>
            </View>
        )
    }


    function renderContent(){
      let content = menu.content;
      if(!content){
        content = (
          <View style={{width: "100%"}}>
            <Text fontSize={"md"}>{menu.label}</Text>
          </View>
        )
      }
      return content;
    }

    let boxShadeLevel = props.level;
    if(expanded && hasChildren){
      boxShadeLevel+=1;
    }

    const padding = 8;

    return(
        <View style={{width: "100%"}}>
            <MyThemedBox _shadeLevel={boxShadeLevel} style={{width: "100%"}} >
                <View style={{paddingVertical: padding, paddingRight: padding}}>
                    <View style={{flexDirection: "row", alignItems: "center", width: "100%"}}>
                      <TouchableOpacity onPress={handleOnPressIcon} >
                        {renderExpandIcon()}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleOnPressContent} style={{width: "100%", flex: 1}} >
                        {renderContent()}
                      </TouchableOpacity>
                    </View>
                </View>
                {renderSubMenuContent()}
            </MyThemedBox>
        </View>
    )

}
