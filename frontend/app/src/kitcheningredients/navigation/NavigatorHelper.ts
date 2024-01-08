// @ts-nocheck
import React, {Ref} from "react";
import {DrawerActions, NavigationContainerRef} from "@react-navigation/native";
import {NavigationQueueItem} from "./NavigationQueueItem";
import {RequiredSynchedStates} from "../synchedstate/RequiredSynchedStates";
import {useSynchedJSONState} from "../synchedstate/SynchedState";
import {Navigation} from "./Navigation";
import {PlatformHelper} from "../helper/PlatformHelper";

// todo Update to newest ReactNavigation
// https://reactnavigation.org/docs/navigating-without-navigation-prop/

export const navigationRef: Ref<NavigationContainerRef> = React.createRef();

export const isReadyRef: Ref<NavigationContainerRef> = React.createRef();

export class NavigatorHelper {

    static navigationQueue: NavigationQueueItem[] = [];
    static setNavigationHistory: any;

    static setSetNavigationHistoryFunction(func){
      NavigatorHelper.setNavigationHistory = func;
    }

    static useNavigationHistory(){
      return useSynchedJSONState(RequiredSynchedStates.navigationHistory)
    }

    static getRouteParams(props){
        return props?.route?.params || {};
    }

    static getCurrentNavigation(){
        // @ts-ignore
        return navigationRef?.current;
    }

    static getState(){
      const nativeState = NavigatorHelper.getCurrentNavigation()?.getRootState();
      const webState = NavigatorHelper.getCurrentNavigation()?.getState();
      let state = nativeState || webState;
      return state;
    }

    static getHistory(){
      let state = NavigatorHelper.getState();
      return state?.history || [];
    }

  //https://github.com/react-navigation/react-navigation/issues/6674
  static getEmptyParams(): object {
    let state = NavigatorHelper.getState()
    let keys: string[] = [];
    try{
      keys = Array.prototype.concat(
        ...state?.routes?.map((route) =>
          Object.keys((route as any)?.params || {})
        )
      );
    } catch (err){
      console.log("getEmptyParams() error");
      console.log(err);
    }
    return keys.reduce((acc, k) => ({ ...acc, [k]: undefined }), {});
  }

    static async navigateToRouteName(routeName: string, props= {}, keepHistory?: boolean){
        // Perform navigation if the app has mounted

        console.log("navigateToRouteName() " + routeName+" "+new Date().toISOString());

        if (NavigatorHelper.isNavigationLoaded()) {
              console.log("navigateToRouteName() isNavigationLoaded "+new Date().toISOString());
              console.log(props);

              // @ts-ignore
              let emptyParams = NavigatorHelper.getEmptyParams();
              let usedEmptyParams = keepHistory ? {} : emptyParams;
              let params = {...usedEmptyParams, ...props};

              let currentNavigation = NavigatorHelper.getCurrentNavigation();

              try{
                  currentNavigation?.dispatch(DrawerActions.jumpTo(routeName, {...params}));
              } catch (err){
                  console.log("Catch Navigation Dispatch error");
              }
              if(NavigatorHelper.setNavigationHistory){
                  NavigatorHelper.setNavigationHistory(NavigatorHelper.getHistory());
//                setHistory(NavigatorHelper.getHistory());
              }
        } else {
          console.log("navigateToRouteName() NOT isNavigationLoaded "+new Date().toISOString());
            let queueItem = new NavigationQueueItem(routeName, props);
            NavigatorHelper.navigationQueue.push(queueItem);
            // You can decide what to do if the app hasn't mounted
            // You can ignore this, or add these actions to a queue you can call later
        }
    }

    static handleNavigationQueue(){
       let queueCopy = JSON.parse(JSON.stringify(NavigatorHelper.navigationQueue));
       while(queueCopy.length>0){
           let nextNavigation = queueCopy.shift(); //get item from copy
           if(!!nextNavigation){
               NavigatorHelper.navigationQueue.shift(); // remove first item from real list
               NavigatorHelper.navigateToRouteName(nextNavigation.routeName, nextNavigation.props);
           }
       }
   }

    /**
     * https://reactnavigation.org/docs/5.x/navigating-without-navigation-prop/#handling-initialization
     */
    static isNavigationLoaded(){
        return !!isReadyRef.current && !!NavigatorHelper.getCurrentNavigation()
    }

}
