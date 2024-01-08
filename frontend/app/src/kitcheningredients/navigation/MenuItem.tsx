// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {RegisteredRoutesMap} from "./RegisteredRoutesMap";
import {NavigatorHelper} from "./NavigatorHelper";
import {Text, View} from "native-base";
import {Navigation, RouteProps} from "./Navigation";

export interface MenuItemProps {
  key: string;
  customRender?: ((MenuItem) => any),
  label?: string | ((MenuItem) => any),
  route?: RouteProps,
  command?: Function,
  position?: number,
  icon?: string | ((MenuItem, boolean, boolean, number) => any),
  expanded?: boolean,
}
export class MenuItem implements MenuItemProps {
    key: string;
    private items: {string: MenuItem};
    position: number;
    public route;

    static fromRoutes(routes: RouteProps[]){
        let items = [];
        for(let route of routes){
            items.push(MenuItem.fromRoute(route));
        }
        return items;
    }

    static fromRoute(route: RouteProps){
      return new MenuItem({
        key: route.path,
        label: route.title,
        route: route,
      });
    }

    constructor(props: MenuItemProps) {
      this.items = {};
         this.key = props?.key;
        this.label = props?.label;
        this.route = props?.route;
        this.content = props?.content;
        this.command = props?.command;
        this.expanded = props?.expanded;
        this.icon = props?.icon;
        this.position = props?.position;

        if(!this?.command && !!this?.route){
            this.command = () => {Navigation.navigateTo(this?.route?.component)};
        }
    }

    getChildItems(){
        let list = [];
        let keys = Object.keys(this.items);
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            list.push(this.items[key]);
        }
        return list;
    }

  handleOnPress(nextExpandState: boolean){
        if(!!this.command){
            this.command(nextExpandState);
        }
    }



    addChildMenuItem(childItem: MenuItem){
      if(!!childItem){
        this.items[childItem.key] = childItem
      }
    }

    addChildMenuItems(childItems: MenuItem[]){
        for(let item of childItems){
          this.addChildMenuItem(item);
        }
    }

}
