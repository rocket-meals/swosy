import React, {useEffect, useState} from "react";
import {SyncCollectionLoader} from "./SyncCollectionLoader";
import {ConfigHolder, ServerAPI} from "../../../kitcheningredients";

import {SyncMenuLoader} from "./SyncMenuLoader";
import {Text, View} from "native-base";
import {loadProfileRemote, useSynchedProfile} from "../../components/profile/ProfileAPI";
import {DeviceInformationHelper} from "../DeviceInformationHelper";
import {RemoteDirectusSettingsLoader} from "../../components/settings/RemoteDirectusSettingsLoader";
import {NotificationHelper} from "../notification/NotificationHelper";
import {ViewPercentageBorderradius} from "../ViewPercentageBorderradius";
import {AppTranslation} from "../../components/translations/AppTranslation";
import {UpdateScreen} from "../../codepush/UpdateScreen";
import {DebugConsole} from "../../components/console/DebugConsole";
import {
	useSynchedApartmentsDict,
	useSynchedAppTranslations,
	useSynchedBuildingsDict,
	useSynchedBusinesshoursDict,
	useSynchedCanteensDict,
	useSynchedChatroomsDict, useSynchedChatroomsSettings,
	useSynchedChatroomTopicsDict,
	useSynchedDirectusLanguage,
	useSynchedDirectusSettings,
	useSynchedImageOverlaysDict,
	useSynchedMarkingsDict,
	useSynchedNews,
	useSynchedRemoteFields,
	useSynchedRemoteSettings,
	useSynchedSettingsAccountBalance,
	useSynchedSettingsBuildings,
	useSynchedSettingsCourseTimetable,
	useSynchedSettingsFoods,
	useSynchedSettingsHousing,
	useSynchedSettingsNews,
	useSynchedSettingsNotifications, useSynchedSettingsUtilizations,
	useSynchedWashingmachinesDict,
	useSynchedWikis
} from "../synchedJSONState";
import {CollectionHelper} from "../CollectionHelper";
import {ConversationHelper} from "../../components/conversations/ConversationHelper";
import {MyTouchableOpacity} from "../../components/buttons/MyTouchableOpacity";

let rendering = 1;

export const SyncComponent = (props) => {

	let userInstance = ConfigHolder.instance.getUser();
	let isOffline = ConfigHolder.instance.isOffline();

	rendering++;

	const [cancelVisible, setCancelVisible] = useState(false);
	const cancelVisibleTime = 10; // 10 seconds response time after Robert B. Miller https://dl.acm.org/doi/10.1145/1476589.1476628

	const [directusSettings, setDirectusSettings] = useSynchedDirectusSettings();
	const [directusLanguages, setDirectusLanguages] = useSynchedDirectusLanguage();
	const [remoteAppTranslations, setRemoteAppTranslations, rawAppTranslations] = useSynchedAppTranslations();
	const [news, setNews] = useSynchedNews();
	const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();
	const [settingsChatrooms, setSettingsChatrooms] = useSynchedChatroomsSettings();
	const [remoteAppSettings, setRemoteAppSettings] = useSynchedRemoteSettings();
	const [remoteAppFields, setRemoteAppFields] = useSynchedRemoteFields();
	const [settingsFoods, setSettingsFoods] = useSynchedSettingsFoods();
	const [utilizationSettings, setUtilizationSettings] = useSynchedSettingsUtilizations();
	const [settingsAccountBalance, setSettingsAccountBalance] = useSynchedSettingsAccountBalance();
	const [settingsCourseTimetable, setSettingsCourseTimetable] = useSynchedSettingsCourseTimetable()
	const [settingsNotifications, setSettingsNotifications] = useSynchedSettingsNotifications();
	const [settingsHousing, setSettingsHousing] = useSynchedSettingsHousing();
	const [settingsNews, setSettingsNews] = useSynchedSettingsNews();
	const [settingsBuildings, setSettingsBuildings] = useSynchedSettingsBuildings();
	const [wikis, setWikis] = useSynchedWikis();
	const [buildings, setBuildings] = useSynchedBuildingsDict();
	const [apartments, setApartments] = useSynchedApartmentsDict();
	const [washingmachines, setWashingmachines] = useSynchedWashingmachinesDict();
	const [imageOverlays, setImageOverlays] = useSynchedImageOverlaysDict();
	const [businesshoursDict, setBusinesshours] = useSynchedBusinesshoursDict();
	const [canteens, setCanteens] = useSynchedCanteensDict();
	const [profile, setProfile] = useSynchedProfile();
	const [chatroomsDict, setChatroomsDict] = useSynchedChatroomsDict();
	const [chatroomTopicsDict, setChatroomTopicsDict] = useSynchedChatroomTopicsDict();

	const [deviceInformation, setDeviceInformation] = DeviceInformationHelper.useLocalDeviceInformation();
	// @ts-ignore
	const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();

	const [profileNotFound, setProfileNotFound] = useState(false);
	const [remoteProfileLoaded, setRemoteProfileLoaded] = useState(undefined);

	const remoteLoadedProfileSameAsLocal = JSON.stringify(remoteProfileLoaded)===JSON.stringify(profile)
	const profileLoadingFinished = (isOffline || profileNotFound || remoteLoadedProfileSameAsLocal);

	const [syncedMenu, setSyncedMenu] = useState(false)
	const syncedMenuStatus = syncedMenu;

	const [status, setStatus] = useState("Starting")

	if(!!props?.getSetProfileFunction){
		props.getSetProfileFunction((newProfile, offline) => {
			setProfile(newProfile, offline);
			//setSyncingFinished(false);
		});
	}

	const variablesToBeLoadedDict = {
		syncedMenuStatus: syncedMenuStatus,
		deviceInformation: deviceInformation,
		remoteAppTranslations: rawAppTranslations,
		directusLanguages: directusLanguages,
		directusSettings: directusSettings,
		remoteAppSettings: remoteAppSettings,
		remoteAppFields: remoteAppFields,
		settingsFoods: settingsFoods,
		utilizationSettings: utilizationSettings,
		settingsAccountBalance: settingsAccountBalance,
		settingsCourseTimetable: settingsCourseTimetable,
		settingsChatrooms: settingsChatrooms,
		settingsNotifications: settingsNotifications,
		settingsHousing: settingsHousing,
		settingsNews: settingsNews,
		settingsBuildings: settingsBuildings,
		notificationObj: notificationObj,
		profileLoadingFinished: profileLoadingFinished,
		news: news,
		wikis: wikis,
		buildings: buildings,
		apartments: apartments,
		washingmachines: washingmachines,
		canteens: canteens,
		imageOverlays: imageOverlays,
		allMarkingsDict: allMarkingsDict,
		businesshoursDict: businesshoursDict,
		chatroomsDict: chatroomsDict,
		chatroomTopicsDict: chatroomTopicsDict
	}

	const variablesToBeLoaded = [];
	for(let key in variablesToBeLoadedDict){
		variablesToBeLoaded.push(variablesToBeLoadedDict[key]);
	}

	const amountVariablesToBeLoaded = variablesToBeLoaded.length;
	const amountVariablesLoaded = countNotNull(variablesToBeLoaded)
	const allVariablesLoaded = amountVariablesLoaded === amountVariablesToBeLoaded;
	const percentage = amountVariablesLoaded*100/amountVariablesToBeLoaded;


	function countNotNull(variables){
		if(!!variables){
			let notNull = 0;
			for(let variable of variables){
				if(!!variable){
					notNull+=1;
				} else {

				}
			}
			return notNull;
		} else {
			return 0;
		}
	}

	async function loadDirectusFields(){
		let directus = ServerAPI.getClient();
		try{
			let fields = await directus.fields.readAll()
			if(!!fields && fields?.data){
				fields = fields.data;
			}
			let fieldsByCollection = {};
			if(!!fields){
				//console.log("loadDirectusFields", fields)
				for(let field of fields){
					let collection = field.collection;
					let fieldname = field?.field;
					let fieldsInCollection = fieldsByCollection[collection] || {};
					fieldsInCollection[fieldname] = field;
					fieldsByCollection[collection] = fieldsInCollection;
				}
			}
			//console.log("loadDirectusFields", fieldsByCollection)
			setRemoteAppFields(fieldsByCollection);
		} catch (err){
			//console.log(err);
		}
	}

	async function loadDirectusSettings(){
		let remoteDirectusSettingsLoaded = await RemoteDirectusSettingsLoader.getRemoteDirectusSettings();
		if(!!remoteDirectusSettingsLoaded){
			let asString = JSON.stringify(remoteDirectusSettingsLoaded)
			if(asString!==JSON.stringify(directusSettings)){
				setDirectusSettings(remoteDirectusSettingsLoaded);
			}
		}
	}

	async function loadProfile(){
		let remoteProfile = await loadProfileRemote();

		if(!!remoteProfile){
			setProfile(remoteProfile, true); // we want to save it locally, because otherwise the field "updated_at" would be updated
			setRemoteProfileLoaded(remoteProfile)
		} else {
			setProfileNotFound(true)
		}
	}

	async function loadDeviceInformation(){
		let deviceInformation = await DeviceInformationHelper.getDeviceInformation();
		setDeviceInformation(deviceInformation);
	}

	async function loadNotificationInformation(){
		let notificationObj = await NotificationHelper.loadDeviceNotificationPermission();
		setNotificationObj(notificationObj);
	}

	async function load(){
		if(!isOffline){
			// TODO: Make sure to load all data always
			// Idea 1: A list of request which will be loaded step by step? Resolving only parts of it?
			// Idea 2: Add a table which list which table was updated when. Then only load changes and not all
			// Maybe combine both ideas?

			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings", remoteAppSettings, setRemoteAppSettings, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_foods", settingsFoods, setSettingsFoods, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_utilizations", utilizationSettings, setUtilizationSettings, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_account_balance", settingsAccountBalance, setSettingsAccountBalance, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_chatrooms", settingsChatrooms, setSettingsChatrooms, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_course_timetable", settingsCourseTimetable, setSettingsCourseTimetable, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_notifications", settingsNotifications, setSettingsNotifications, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_housing", settingsHousing, setSettingsHousing, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_news", settingsNews, setSettingsNews, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_settings_buildings", settingsBuildings, setSettingsBuildings, SyncCollectionLoader.getFieldsForAllAndTranslations());
			SyncCollectionLoader.setCacheOfRemoteCollection("app_translations", remoteAppTranslations, setRemoteAppTranslations, SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("languages", directusLanguages, setDirectusLanguages);
			SyncCollectionLoader.setCacheOfRemoteCollection("news", news, setNews, SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, ["-date_created"]);
			SyncCollectionLoader.setCacheOfRemoteCollection("markings", allMarkingsDict, setAllMarkingsDict ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("wikis", wikis, setWikis ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("buildings", buildings, setBuildings ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("image_overlays", imageOverlays, setImageOverlays ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("apartments", apartments, setApartments ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("washingmachines", washingmachines, setWashingmachines ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("canteens", canteens, setCanteens ,SyncCollectionLoader.getFieldsForAllAndTranslations(["businesshours.*"]), CollectionHelper.transformCollectionToDict, undefined);
			SyncCollectionLoader.setCacheOfRemoteCollection("businesshours", businesshoursDict, setBusinesshours ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			ConversationHelper.loadAllChatrooms(chatroomsDict, setChatroomsDict);
			SyncCollectionLoader.setCacheOfRemoteCollection("chatroom_topics", chatroomTopicsDict, setChatroomTopicsDict ,SyncCollectionLoader.getFieldsForAllAndTranslations(), CollectionHelper.transformCollectionToDict, undefined);
			loadDeviceInformation();
			loadNotificationInformation();
			loadDirectusSettings();
			loadDirectusFields();
			loadProfile();
		}
	}


	function checkSyncOrder(){
		if(isOffline){
			if(syncedMenuStatus){
				ConfigHolder.instance.setSyncFinished(true);
			}
		}
		if(!isOffline){
			//authenthicated user
			if(!!userInstance && allVariablesLoaded && syncedMenuStatus){
				ConfigHolder.instance.setSyncFinished(true);
			}
			if(!userInstance && allVariablesLoaded && syncedMenuStatus){ // an unauthenticated user
				ConfigHolder.instance.setSyncFinished(true);
			}
		}
	}

	checkSyncOrder()

	function renderCancelButton(){
		if(!cancelVisible){
			return null;
		}

		return(
			<View style={{width: "100%", height: "100%", flex: 1, justifyContent: "flex-end"}}>
				<View style={{padding: "10%", alignItems: "center"}}>
					<MyTouchableOpacity
						onPress={async () => {
							try{
								await ServerAPI.handleLogout();
							} catch (err){
								//console.log(err);
							}
						}}
						style={{flex: 1, width: "100%"}}>
						<ViewPercentageBorderradius style={{padding: 10, borderRadius: "10%", width: "100%", backgroundColor: "orange", alignItems: "center"}} >
							<AppTranslation color={"white"} id={"cancel"} />
						</ViewPercentageBorderradius>
					</MyTouchableOpacity>
				</View>
			</View>
		)
	}

	function renderNotLoadedVariables(){
		return null;
		let output = [];
		for(let key in variablesToBeLoadedDict){
			if(!variablesToBeLoadedDict[key]){
				output.push(
					<Text>{"Not loaded: "+key}</Text>
				)
			}
		}
		return output;
	}

	function renderLoading(){
		let message = profileLoadingFinished ? "Profile loaded" : "Loading profile";

		return <View style={{width: "100%", height: "100%"}}>
			<UpdateScreen receivedBytes={percentage} totalBytes={100} message={status+"\n"+message} ignoreBytes={true} >
				{renderNotLoadedVariables()}
			</UpdateScreen>
			{renderCancelButton()}
		</View>
	}

	useEffect(() => {
		setTimeout(() => {
			load();
		}, 0);
		setTimeout(() => {
			setCancelVisible(true);
		}, cancelVisibleTime*1000);
	}, [props])

	const renderedMenuLoader = profileLoadingFinished ? <SyncMenuLoader setSyncedMenu={setSyncedMenu} /> : null;



	return [
		renderLoading(),
		<DebugConsole />,
		renderedMenuLoader
	];

}
