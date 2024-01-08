import {Navigation} from "./Navigation";
import React, {FunctionComponent} from "react";

export class RouteHelper {

  static getNameOfComponent(component: FunctionComponent): string{
    let bestName = component.displayName || component.name;
    return bestName+"";
  }

  static getInitialRouteName(startURL: string){
    // startURL = "https://kitchenhelper.app/#/app/recipes";
    // get everything after the # and the prefix
    let hash = RouteHelper.getHashRouteWithSearchParams(startURL);
    let search = RouteHelper.getSearchParamString(startURL);
    let routeName = hash.replace("?"+search, "");
    if(!routeName || routeName === ""){
      routeName = Navigation.DEFAULT_ROUTE_HOME;
    }

    return routeName;
  }

  static getSearchParam(startURL){
    let search = RouteHelper.getSearchParamString(startURL);
    // parse for search params in url to dict
    let searchParams = new URLSearchParams(search);
    let searchDict = {};
    for (let [key, value] of searchParams) {
      searchDict[key] = value;
    }
    return searchDict;
  }

  static getHashRouteWithSearchParams(startURL){
    let hash = startURL?.split(Navigation.ROUTE_HASH_PREFIX)[1] || "";
    if(hash.startsWith(Navigation.ROUTE_PATH_PREFIX)){
      hash = hash.substr(1);
    }
    return hash;
  }

  static getSearchParamString(startURL){
    let search = startURL?.split("?")[1] || "";
    // parse for search params in url to dict
    return search;
  }

}
