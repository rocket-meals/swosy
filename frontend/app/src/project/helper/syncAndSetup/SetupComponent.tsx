import React, {useEffect} from "react";
import {
	ConfigHolder,
	KitchenSafeAreaView,
	Navigation,
	NavigatorHelper,
	useSynchedJSONState
} from "../../../kitcheningredients";
import {SetupLanguageHelper} from "./SetupLanguageHelper";
import {useSynchedDevices, useSynchedProfile, useSynchedProfileCanteen} from "../../components/profile/ProfileAPI";
import {NotificationHelper} from "../notification/NotificationHelper";
import {useDemoMode, useSynchedDirectusLanguage} from "../synchedJSONState";
import {SettingCanteen} from "../../screens/settings/SettingCanteen";
import {SettingProfile} from "../../screens/settings/SettingProfile";
import {FoodOfferList} from "../../screens/food/FoodOfferList";
import {DeviceInformationHelper} from "../DeviceInformationHelper";
import {View} from "native-base";
import {DemoModeLogo} from "./DemoModeLogo";
import {StorageKeys} from "../synchedVariables/StorageKeys";

export const SetupComponent = (props) => {

	const [history, setHistory] = Navigation.useNavigationHistory();
	const [profile, setProfile] = useSynchedProfile();
	const [cachedOSLanguage, setOSLanguage] = useSynchedJSONState(StorageKeys.CACHED_OS_LANGUAGE);
	const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();
	const [devices, setDevices, isDeviceUpToDateOrUpdate] = useSynchedDevices();
	const [directusLanguages, setDirectusLanguages] = useSynchedDirectusLanguage();
	const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();

	const [demo, setDemo] = useDemoMode();

	let userInstance = ConfigHolder.instance.getUser();

	function getCurrentRouteUserIsAt(){
		let directHistory = NavigatorHelper.getHistory();

		let usedHistory = history;
		usedHistory = directHistory;

		if(!!usedHistory){
			if(usedHistory.length>0){
				let lastItem = usedHistory[usedHistory?.length - 1];
				let lastItemKey = lastItem?.key;
				if(!!lastItemKey){
					if(lastItemKey.includes("-")){
						return lastItemKey.split("-")[0];
					}
				}

			}
		}
		return "";
	}

	function isUserAtRouteComponent(component){
		//let routeName = RouteHelper.getNameOfComponent(component)
		let bestName = component.displayName || component.name;
		//let componentRoute = Navigation.getRouteByComponent(component); // e.g. "settingsprofile"
		return isUserAtRouteName(bestName)
	}

	function isUserAtRouteName(routeName){
		return getCurrentRouteUserIsAt() === routeName;	// e.g. "settingsprofile" === "settingsprofile"
	}

	function isLanguageCorrectSet(){
		const oldProfileJSON = JSON.stringify(profile);
		let currentDevicePreferedLocales = SetupLanguageHelper.getUsersInstalledLanguageCodesInPreferedOrder(); // we load the current OS (device) languages
		let newProfile = SetupLanguageHelper.getNewProfileWithDefaultLanguageSet(profile, directusLanguages, cachedOSLanguage, currentDevicePreferedLocales);
		setOSLanguage(currentDevicePreferedLocales) // we update the cached OS (device) languages
		if(JSON.stringify(newProfile) !== oldProfileJSON){
			setProfile(newProfile);
			return false;
		}
		return true;
	}

	async function checkNotificationSettings(){
		let newNotificationObj = await NotificationHelper.loadDeviceNotificationPermission();
		if(JSON.stringify(newNotificationObj) !== JSON.stringify(notificationObj)){
			setNotificationObj(newNotificationObj);
		}
		return true;
	}

	function isCanteenCorrectSet(){
		if(!profileCanteenId){
			if(!isUserAtRouteComponent(SettingCanteen)){
				Navigation.navigateTo(SettingCanteen, {goHome: true});
			//	NavigatorHelper.navigateWithoutParams(SettingCanteen, true, {goHome: true});
			}
			return false;
		}
		return true;
	}


	function isProfileCorrectSet(){
		if(!!profile?.id){
			let nicknameSet = !!profile?.nickname;
			if(!nicknameSet){
				if(!isUserAtRouteComponent(SettingProfile)){
					Navigation.navigateTo(SettingProfile, {goHome: true});
				}
				return false;
			} else {
				return true;
			}
		}
		return true;
	}

	async function isDeviceCorrectSet(){
		if(!!profile?.id){
			let deviceInformation = await DeviceInformationHelper.getDeviceInformation();
			let isUpToDate = await isDeviceUpToDateOrUpdate(deviceInformation);
			return isUpToDate;
		}
		return true;
	}

	async function checkSyncOrder(functions){
		let continueChecking = true;
		for(let i=0; i<functions.length; i++){
			let func = functions[i];
			if(continueChecking){
				let result = await func();
				continueChecking = result;
			}
		}
		if(continueChecking && isUserAtRouteName("Home")){
			Navigation.navigateTo(FoodOfferList)
//			NavigatorHelper.navigateWithoutParams(FoodOfferList, true, {});
		}
	}

	function isUserAtLegalRequiredRoute(){
		let requiredRoutesNotToCheck = [
			"login"
		]

		let menuKeysNotToCheck = [
			Navigation.DEFAULT_MENU_KEY_ABOUT_US,
			Navigation.DEFAULT_MENU_KEY_SETTINGS,
			Navigation.DEFAULT_MENU_KEY_PRIVACY_POLICY,
		]

		for(let menuKeyNotToCheck of menuKeysNotToCheck){
			let menuItem = Navigation.requiredMenuItems[menuKeyNotToCheck];
			let path = menuItem?.route?.path;
			requiredRoutesNotToCheck.push(path);
		}

		let isUserAtRequiredRoute = false;
		for(let requiredRouteNotToCheck of requiredRoutesNotToCheck){
			if(isUserAtRouteName(requiredRouteNotToCheck)){
				isUserAtRequiredRoute = true;
			}
		}
		return isUserAtRequiredRoute;
	}

	useEffect(() => {

		let syncFinished = ConfigHolder.instance.state.syncFinished;

		if(!isUserAtLegalRequiredRoute() && syncFinished && !!userInstance){
			checkSyncOrder([
				isLanguageCorrectSet,
				checkNotificationSettings,
				isCanteenCorrectSet,
				//isProfileCorrectSet,
				isDeviceCorrectSet
			])
		}
	}, [props, profile, history]);

	function renderDemoModeLogo(){
		if(demo){
			return <View style={{
				position: "absolute", top: 0, width: "100%", opacity: 0.5,
                padding: 20,
				alignItems: "center",
				pointerEvents: "none",
			}}
						 pointerEvents={'none'}
			>
				<KitchenSafeAreaView>
					<DemoModeLogo/>
				</KitchenSafeAreaView>
			</View>
		}
	}

	return [
		props.children,
		renderDemoModeLogo()
	];

}
