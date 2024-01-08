// @ts-nocheck
import React from 'react';
import {NativeBaseProvider, Text, View} from 'native-base';
import {Root} from './navigation/RootComponent';
import ColorCodeHelper from "./theme/ColorCodeHelper";
import BaseThemeGenerator from "./theme";
import {RootStack} from "./navigation/rootNavigator";
import {ColorStatusBar} from "./components/ColorStatusBar";
import ServerAPI from "./ServerAPI";
import {Linking, Platform} from "react-native";
import * as ExpoLinking from "expo-linking";
import {URL_Helper} from "./helper/URL_Helper";
import UserHelper from "./utils/UserHelper";
import {StoreProvider} from "easy-peasy";
import {SynchedState} from "./synchedstate/SynchedState";
import {ConfigHolder} from "./ConfigHolder";
import {RequiredStorageKeys} from "./storage/RequiredStorageKeys";
import {ViewWithBackgroundColor} from "./templates/ViewWithBackgroundColor";
import {DefaultNavigation} from "./navigation/DefaultNavigation";
import {Navigation} from "./navigation/Navigation";
import EnviromentHelper from "./EnviromentHelper";
import {UserInitLoader} from "./utils/UserInitLoader";
import {DefaultStorage} from "./storage/DefaultStorage";
import {MyDirectusStorage} from "./storage/MyDirectusStorage";
import {MyDirectusStorageInterface} from "./storage/MyDirectusStorageInterface";
import {StringHelper} from "./helper/StringHelper";
import {NavigatorHelper} from "./navigation/NavigatorHelper";

export class App extends React.Component<any, any>{
  storage: MyDirectusStorageInterface;

	constructor(props) {
		super(props);

		StringHelper.enableReplaceAllOnOldDevices() // Android does not support .replaceAll()

		this.storage = new DefaultStorage(new MyDirectusStorage());

		if(!props?.ignoreInstance){
      ConfigHolder.instance = this;
    }

		this.subscribe(( url ) => {
			let baseurl = ExpoLinking.createURL("");
			let screenURL = url.substr(baseurl.length);
			let urlSplit = screenURL.split("?");
			let route = urlSplit[0];
			let params = URL_Helper.getAllUrlParams(url);
			console.log("URL Subscribe: "+route);
			if(Platform.OS!=="web"){
			  console.log("screenURL: "+screenURL);
			  console.log("baseurl: "+baseurl);
			  console.log("route: "+route);
			  console.log("params:");
			  console.log(params);
        NavigatorHelper.navigateToRouteName(route, params);
      }
			//
		})
		this.state = {
		  backendUrl: EnviromentHelper.getHardCodedBackendURL(),
		  syncFinished: false,
      startURL: undefined,
			user: undefined,
      role: undefined,
      offline: undefined,
      permissions: undefined,
			loadedUser: false,
			reloadNumber: 0,
			hideDrawer: false,
		}
	}


// Custom function to subscribe to incoming links
	subscribe(listener) {
		// First, you may want to do the default deep link handling
		const onReceiveURL = ({url}) => {
		  console.log("onReceiveURL");
		  console.log("url: "+url);
			listener(url);
		};

		// Listen to incoming links from deep linking
		Linking.addEventListener('url', onReceiveURL);
		return () => {
			// Clean up the event listeners
			Linking.removeEventListener('url', onReceiveURL);
		};
	}

	async loadRole(role_id){
		return await ServerAPI.loadRole(role_id);
	}

  async loadPermissions(role_id){
    return await ServerAPI.loadPermissions(role_id);
  }

	isDrawerHidden(){
		return ConfigHolder.instance.state.hideDrawer;
	}

	async reload(){
    await ConfigHolder.instance.setState({
      reloadNumber: 0, //ConfigHolder.instance.state.reloadNumber+1,
      syncFinished: false,
    });
  }

  async setStartURL(startURL){
    await ConfigHolder.instance.setState({
      startURL: startURL,
    });
  }

  getBackendUrl(){
	  return this.state.backendUrl;
  }

  async setBackendUrl(url){
	  await ConfigHolder.instance.setState({
      backendUrl: url
    })
  }

  async setBackendUrlAndReload(url){
	  await ConfigHolder.instance.setBackendUrl(url);
	  await ConfigHolder.instance.reload();
  }

	async setHideDrawer(hideDrawer, nextRouteName?){
    let currentRouteName = Navigation.getCurrentRouteName();
		if(ConfigHolder.instance.state.hideDrawer!==hideDrawer){
		  let useRouteName = !!nextRouteName ? nextRouteName : currentRouteName;
		  useRouteName = useRouteName || ConfigHolder.instance.startURL;

			await ConfigHolder.instance.setState({
				hideDrawer: hideDrawer,
				reloadNumber: ConfigHolder.instance.state.reloadNumber+1,
        startURL: Navigation.ROUTE_HASH_PREFIX+useRouteName,
			});
		}
	}

	async setRedirectToLogin(){
	  await ConfigHolder.instance.setHideDrawer(true, Navigation.DEFAULT_ROUTE_LOGIN);
	}

	async setUserAsAnonymous(){
		ConfigHolder.instance.storage.set_is_anonymous(true);
		await ConfigHolder.instance.setUser(UserHelper.getAnonymousUser());
	}

	async setSyncFinished(syncFinished){
    await this.setState({
      syncFinished: syncFinished,
    })
  }

  isOffline(){
	   return ConfigHolder.instance.state?.offline;
  }

	async setUser(user, callback?){
	  console.log("App.setUser: ",user);

    if(!!user){
      user.isGuest = UserHelper.isAnonymous(user);
    }
    let role_id = user?.role;

    console.log("App.setUser: role_id: ",role_id);
		let role = await this.loadRole(role_id);
		console.log("App.setUser: role: ",role);
    let permissions = await this.loadPermissions(role_id);
    console.log("App.setUser: permissions: ",permissions);

    if(!callback && !!ConfigHolder.plugin.onLogin){
      await ConfigHolder.plugin.onLogin(user, role, permissions);
      callback = () => {};
    }
    await DefaultNavigation.registerRoutesAndMenus(user, role, permissions);

		await ConfigHolder.instance.setState({
			reloadNumber: this.state.reloadNumber+1,
			loadedUser: true,
      syncFinished: false,
			user: user,
			role: role,
      permissions: permissions,
		}, callback)
	}

	getRole(){
		return ConfigHolder.instance.state?.role;
	}

	getUser(){
		return ConfigHolder.instance.state?.user;
	}

  getPermissions(){
    return ConfigHolder.instance.state?.permissions;
  }

	async loadUser(){
	  console.log("App. Load User");
		try{
		  console.log("App. Load User. Try");
			if(ServerAPI.areCredentialsSaved()){
			  console.log("-- Load User: Credentials saved");
				let directus = ServerAPI.getClient();
				let user = await ServerAPI.getMe(directus);
				console.log("-- Load User: User loaded");
				console.log(user);
				return user;
			} else if(ConfigHolder.instance.storage.is_anonymous()){
			  console.log("-- Load User: Guest");
				return UserHelper.getAnonymousUser();
			} else if(ConfigHolder?.authConfig?.startAsAnonymous){
        ConfigHolder.instance.storage.set_is_anonymous(true);
        return UserHelper.getAnonymousUser();
      }	else {
			  console.log("-- Load User: No Credentials");
        return null;
      }
		} catch (err){
			console.log("-- Error at load User");
			console.log(err);
		}
		return null;
	}

	async loadSynchedVariables(){
	  SynchedState.registerSynchedStates(RequiredStorageKeys.CACHED_THEME, ColorCodeHelper.VALUE_THEME_DEFAULT, null, null, false);
		await ConfigHolder.instance.storage.init(); //before ConfigHolder.instance.storage.initContextStores();
		await ConfigHolder.instance.storage.initContextStores(SynchedState); //before SynchedState.initContextStores();
		await SynchedState.initSynchedKeys();
		await SynchedState.initContextStores(); //after ConfigHolder.instance.storage.initContextStores();
	}

	async componentDidMount() {
	  await ConfigHolder.instance.initialize();
	}

	async initialize(){
	  await this.loadSynchedVariables();
    if(!!ConfigHolder.plugin && !!ConfigHolder.plugin.initApp){
      await ConfigHolder.plugin.initApp();
    }

    let startURL = await Linking.getInitialURL() || ""
    console.log("Initial URL before checking if token: ",startURL);

    let directusAccessTokenSplit = "?"+EnviromentHelper.getDirectusAccessTokenName()+"="
    let directusAutTokenIncluded = startURL.includes(directusAccessTokenSplit);
    if(directusAutTokenIncluded){
      let realInitialURL = startURL.split(directusAccessTokenSplit)[0];
      let directusAccessToken = startURL.split(directusAccessTokenSplit)[1];
      startURL = realInitialURL+"#"+Navigation.ROUTE_PATH_PREFIX+Navigation.DEFAULT_ROUTE_LOGIN+"?"+EnviromentHelper.getDirectusAccessTokenName()+"="+directusAccessToken;
    }
    console.log("Initial URL after checking if token: ",startURL);

    await ConfigHolder.instance.setState({
      startURL: startURL,
      loadedUser: false,
    })
  }

	getBaseTheme(){
		let initialColorMode = this.props.initialColorMode || ColorCodeHelper.VALUE_THEME_LIGHT;
		return BaseThemeGenerator.getBaseTheme(initialColorMode);
	}

	getLoadingScreen(additionalContent?){
    let loadingContent = null;
    if(!!ConfigHolder.plugin && !!ConfigHolder.plugin.getLoadingComponent){
      loadingContent = ConfigHolder.plugin.getLoadingComponent();
    }
//    return <ViewWithBackgroundColor><View style={{width: "100%", height: "100%", backgroundColor: "red", justifyContent: "center", alignItems: "center"}}><Text>{JSON.stringify(ConfigHolder.instance.state.startURL, null, 2)}</Text></View></ViewWithBackgroundColor>
    return (
      <ViewWithBackgroundColor>
        {loadingContent}
        {additionalContent}
      </ViewWithBackgroundColor>
    )
  }

  getSynchScreen(){
    let syncContent = null;
    if(!!ConfigHolder.plugin && !!ConfigHolder.plugin.getSyncComponent){
      syncContent = ConfigHolder.plugin.getSyncComponent();
    }

    if(!syncContent) {
      ConfigHolder.instance.setSyncFinished(true)
    }
    return <ViewWithBackgroundColor>{syncContent}</ViewWithBackgroundColor>
  }

  getNormalContent(){
    let content = <RootStack reloadNumber={this.state.reloadNumber+""+this.state.hideDrawer+this.state.startURL+this.state.syncFinished} startURL={this.state.startURL} />
    if(!!this.props.children){
      content = this.props.children;
    }

    return (
      <>
        <Root key={this.state.reloadNumber+""+this.state.hideDrawer+this.state.startURL+this.state.syncFinished}>{content}</Root>
        <ColorStatusBar />
      </>
    )
  }

	render() {
		let root = null;

		if(this.state.startURL===undefined){
		  console.log("Loading screen");
		  root = this.getLoadingScreen();
		} else if(this.state.reloadNumber===0 || !this.state.loadedUser || this.state.offline===undefined){
		  root = this.getLoadingScreen(
        <UserInitLoader key={JSON.stringify(this.getUser())} />
      )
    } else if(!this.state.syncFinished) {
      console.log("Sync screen");
		  root = this.getSynchScreen();
    } else {
      console.log("Normal screen");
		  root = this.getNormalContent();
    }

    const theme = this.getBaseTheme();

		console.log("App. Render");

		const rootWrapper = ConfigHolder.plugin.getRootWrapper;
		let rootContent = rootWrapper(root);

		return (
			<StoreProvider store={SynchedState.getContextStore()}>
				<NativeBaseProvider reloadNumber={this.state.syncFinished+this.state.reloadNumber+""+this.state.hideDrawer+this.state.startURL} theme={theme} colorModeManager={ColorCodeHelper.getManager()}>
          <ViewWithBackgroundColor>
            {rootContent}
          </ViewWithBackgroundColor>
				</NativeBaseProvider>
			</StoreProvider>
		);
	}
}
