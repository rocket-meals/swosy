// @ts-nocheck
import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import EnviromentHelper from "../EnviromentHelper";
import {navigationRef, isReadyRef, NavigatorHelper} from "./NavigatorHelper";
import {ConfigHolder} from "../ConfigHolder";
import {ViewWithBackgroundColor} from "../templates/ViewWithBackgroundColor";
import {useBackgroundColor} from "../templates/useBackgroundColor";
import {Navigation} from "./Navigation";
import {PlatformHelper} from "../helper/PlatformHelper";
import {RouteHelper} from "./RouteHelper";

export const Root = (props) => {
	const bgColor = useBackgroundColor()

  let ignoreNextHashChange = false;

  const routeNameRef = useRef();

	React.useEffect(() => {
		return () => {
			isReadyRef.current = false
		};
	}, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (ignoreNextHashChange) {
        ignoreNextHashChange = false;
        return;
      }
      console.log("handleHashChange");
      let currentUrl = window.location.href;
      console.log("currentUrl: "+currentUrl);
      let hash = window.location.hash;
      console.log("hash:"+hash);
//      ConfigHolder.instance.setStartURL(currentUrl);

      let initialRouteName = RouteHelper.getInitialRouteName(currentUrl);
      let search = RouteHelper.getSearchParam(currentUrl);
      console.log("initialRouteName: "+initialRouteName);
      console.log("search: "+search);
      NavigatorHelper.navigateToRouteName(initialRouteName, search, true);
    }

    if(PlatformHelper.isWeb()){
      // add EventListener is url was manually changed or go back in history
      window.addEventListener('hashchange', handleHashChange, false);

      return () => {
        // Cleanup
        window.removeEventListener('hashchange', handleHashChange, false);
      };
    }
  }, []);


	let subroute = "myapp/app/";
	try{
		let basePath = EnviromentHelper.getBasePath();
		subroute = basePath;
	} catch (err){
		console.log("Trying to get Basepath");
		console.log(err)
	}

  console.log("RootComponent render");

	return (
		<NavigationContainer
			ref={navigationRef}
			onReady={() => {
				isReadyRef.current = true;
				const currentNavigation = navigationRef?.current;
				if(currentNavigation){
				  if(currentNavigation.getCurrentRoute){
				    const name = currentNavigation.getCurrentRoute()?.name;
            routeNameRef.current = name
            NavigatorHelper.handleNavigationQueue();
          }
        }
			}}
      onStateChange={async () => {
        console.log("RootComponent onStateChange")

        let trackScreenView = () => {}

        if(NavigatorHelper.isNavigationLoaded()){
          const previousRouteName = routeNameRef?.current+"";
          const currentNavigation = NavigatorHelper.getCurrentNavigation();
          if(!!currentNavigation && !!currentNavigation.getCurrentRoute){
            const currentRoute = currentNavigation.getCurrentRoute()
            console.log("onStateChange");
            const currentRouteName = currentRoute?.name || "";
            const currentRouteParams = currentRoute?.params || {};
            trackScreenView = () => {
              if(PlatformHelper.isWeb()){
                let navigateSearch;
                let navigateSearchParams = Navigation.paramsToURLSearch(currentRouteParams);
                if(navigateSearchParams){
                  navigateSearch = "?"+navigateSearchParams;
                } else {
                  navigateSearch = "";
                }
                //console.log("After changing the hash, the hook will be called again, so we do not need to call navigateTo again");
                //@ts-ignore

                // This handle goBack and goForward in the browser, since the hashchange event is not triggered
                let nextHash = Navigation.ROUTE_PATH_PREFIX+currentRouteName+navigateSearch;
                let sameHash = Navigation.ROUTE_HASH_PREFIX+nextHash === window.location.hash;
                if(sameHash){ // since goBack can triggers in handleHashChange (see above) we need to check if the hash is the same
                  console.log("Same hash")
                  // do nothing
                } else {
                  console.log("Different hash")
                  ignoreNextHashChange = true;
                  window.location.hash = nextHash;
                }
              }
              // Your implementation of analytics goes here!

            };
            routeNameRef.current = currentRouteName;
          }
        }

        await trackScreenView();

        // Save the current route name for later comparison
      }}
			// @ts-ignore //this is correct
//      linking={linking}
			theme={{
				// @ts-ignore
				colors: { background: bgColor },
			}}
		>
      <ViewWithBackgroundColor>
        {props.children}
      </ViewWithBackgroundColor>
		</NavigationContainer>
	);
};
