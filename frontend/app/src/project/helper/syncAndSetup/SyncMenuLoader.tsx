import React, {useEffect} from "react";
import {ConfigHolder, Icon, MenuItem, Navigation} from "../../../kitcheningredients";

import {MaterialIcons} from "@expo/vector-icons";
import {getAccountBalanceVisiblity} from "../../components/accountBalance/AccountBalanceHelper";
import {WikiMenuContent} from "../../screens/wiki/WikiMenuContent";
import {WikiLoader} from "../../components/wiki/WikiLoader";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {NewsList} from "../../screens/news/NewsList";
import {AccountBalance} from "../../screens/accountBalance/AccountBalance";
import {NewsIcon} from "../../components/news/NewsIcon";
import {AccountBalanceIcon} from "../../components/accountBalance/AccountBalanceIcon";
import Project from "../../Project";
import {Wikis} from "../../screens/wiki/Wikis";
import {
	useDebugMode, useSynchedChatroomsSettings,
	useSynchedSettingsBuildings,
	useSynchedSettingsFoods,
	useSynchedSettingsNews,
	useSynchedWikis
} from "../synchedJSONState";
import {BuildingsScreen} from "../../screens/buildings/BuildingsScreen";
import {BuildingsIcon} from "../../components/buildings/BuildingsIcon";
import {StringHelper} from "../StringHelper";
import {HousingHelper} from "../../components/housing/HousingHelper";
import {HousingScreen} from "../../screens/housing/HousingScreen";
import {HousingIcon} from "../../components/housing/HousingIcon";
import {getCourseTimetableVisiblity} from "../../components/courseTimetable/CourseTimetableHelper";
import {CourseTimetable} from "../../screens/courseTimetable/CourseTimetable";
import {CourseTimetableIcon} from "../../components/courseTimetable/CourseTimetableIcon";
import {Conversations} from "../../screens/conversations/Conversations";
import {ConversationIcon} from "../../components/conversations/ConversationIcon";
import {FoodOfferList} from "../../screens/food/FoodOfferList";
import {CanteenIcon} from "../../components/canteen/CanteenIcon";
import {CommonSystemActionHelper} from "../SystemActionHelper";
import {RoleHelper} from "../RoleHelper";
import {DirectusRoles} from "../../directusTypes/types";

export const SyncMenuLoader = (props) => {
	const setSyncedMenu = props?.setSyncedMenu || (() => {});

	const accountBalanceVisiblity = getAccountBalanceVisiblity();
	const courseTimetableVisiblity = getCourseTimetableVisiblity();

	const [settingsChatrooms, setSettingsChatrooms] = useSynchedChatroomsSettings();
	const chatroomsVisibility = settingsChatrooms?.["enabled"]
	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods();
	const foodVisibility = foodSettings?.["enabled"]
	const [newsSettings, setNewsSettings] = useSynchedSettingsNews();
	const newsVisibility = newsSettings?.["enabled"];

	const [buildingsSettings, setBuildingsSettings] = useSynchedSettingsBuildings();
	const buildingsVisibility = buildingsSettings?.["enabled"]

	const translationScreenNameAccountBalance = useAppTranslation("screenNameAccountBalance")
	const translationScreenNameCourseTimetable = useAppTranslation("screenNameCourseTimetable")
	const translationScreenNameFoods = useAppTranslation("screenNameFoods")
	const translationScreenNameNews = useAppTranslation("news")
	const translationScreenNameHousing = useAppTranslation("housing")
	const translationScreenNameBuildings = useAppTranslation("buildings")
	const translationScreenNameConversations = useAppTranslation("conversations")

	const translationScreenNameLegalRequirements = useAppTranslation("legalRequirements")

	const housingVisibility = HousingHelper.useHousingVisiblity();
	const [debug, setDebug] = useDebugMode()
	const [wikis, setWikis, useWikiByIdOrCustomId, useWikiTitle] = useSynchedWikis();

	const wiki_title_about_us = useWikiTitle(null, "about_us")
	const wiki_title_license = useWikiTitle(null, "license")
	const wiki_title_privacy_policy = useWikiTitle(null, "privacy_policy");
	const wiki_title_accessibility = useWikiTitle(null, "accessibility");


	function getMenuItemFromWiki(wiki){
		let items = [];
		let children = wiki?.children || [];
		for(let child of children){
			items.push(getMenuItemFromWiki(child));
		}

		let content = <WikiMenuContent wiki={wiki} />;

		let icon = wiki?.icon;
		let renderIcon = undefined;
		if(icon){
			let transformedIcon = StringHelper.replaceAll(icon, "_", "-") // Directus gives us underscores, but we need dashes
			renderIcon = () => <Icon as={MaterialIcons} name={transformedIcon} />
		}

		let command = () => {Navigation.navigateTo(Wikis, {id: wiki?.id})}
		if(wiki?.url){
			command = () => {
				CommonSystemActionHelper.openExternalURL(wiki?.url)
			}
		}

		let menu = new MenuItem({
			key: "wiki"+wiki?.id,
			content: content,
			command: command,
			icon: renderIcon,
		})
		menu.addChildMenuItems(items);
		return menu;
	}

	function loadLegalRequirementMenus(){
		let legalMenuItems = Navigation.menuGetRequiredMenuDict();

		let legalMenuItemChildTitleMapping = {
			[Navigation.DEFAULT_MENU_KEY_ABOUT_US]: wiki_title_about_us,
			[Navigation.DEFAULT_MENU_KEY_LICENSE]: wiki_title_license,
			[Navigation.DEFAULT_MENU_KEY_PRIVACY_POLICY]: wiki_title_privacy_policy,
			[Navigation.DEFAULT_MENU_KEY_ACCESSIBILITY]: wiki_title_accessibility,
		}

		let legalMenuItemsKeys = Object.keys(legalMenuItems)
		for(let legalMenuItemKey of legalMenuItemsKeys){
			let legalMenuItem = legalMenuItems[legalMenuItemKey]
			let title_translation = legalMenuItemChildTitleMapping[legalMenuItemKey];
			if(!!title_translation && !!legalMenuItem){
				legalMenuItem.label = title_translation;
			}
		}
	}

	function canSeeEmployeeMenu(role: DirectusRoles){
		return RoleHelper.isAdmin(role) || RoleHelper.isEmployee(role)
	}

	function loadMenus(){

		loadLegalRequirementMenus();


/**
		let registeredMenuKeys = Object.keys(registeredMenus);
		for (let menuKey of registeredMenuKeys) {
			Menu.unregisterMenuForRoleId(Menu.ROLE_PUBLIC, registeredMenus[menuKey]);
			delete registeredMenus[menuKey];
		}
*/

		let user = ConfigHolder.instance.getUser();
		let role = ConfigHolder.instance.getRole();

		if(!!user){ // user needs atleast to be anonymous, guest or logged in, to see the wiki items
			let wikisMenuItems = WikiLoader.getWikisMenuItems(wikis);
			if (!!wikisMenuItems) {
				for (let wiki of wikisMenuItems) {
					let menu = getMenuItemFromWiki(wiki);
					Navigation.menuRegister(menu);
				}
			}

			if(foodVisibility){
				let menuItem = new MenuItem({
					key: "foods",
					label: translationScreenNameFoods,
					command: () => {Navigation.navigateTo(FoodOfferList)},
					icon: () => <CanteenIcon />,
					position: 6,
				})
				Navigation.menuRegister(menuItem);
			}

			if(accountBalanceVisiblity){
				let menuItem = new MenuItem({
					key: "accountBalance",
					label: translationScreenNameAccountBalance,
					command: () => {Navigation.navigateTo(AccountBalance)},
					icon: () => <AccountBalanceIcon />,
					position: 5,
				})
				Navigation.menuRegister(menuItem);
			}

			if(courseTimetableVisiblity){
				let menuItem = new MenuItem({
					key: "courseTimetable",
					label: translationScreenNameCourseTimetable,
					command: () => {Navigation.navigateTo(CourseTimetable)},
					icon: () => <CourseTimetableIcon />,
					position: 4,
				})
				Navigation.menuRegister(menuItem);
			}

			if(newsVisibility){
				let menuItem = new MenuItem({
					key: "news",
					label: translationScreenNameNews,
					command: () => {Navigation.navigateTo(NewsList)},
					icon: () => <NewsIcon />,
					position: 3,
				})
				Navigation.menuRegister(menuItem);
			}

			if(housingVisibility){
				let menuItem = new MenuItem({
					key: "housing",
					label: translationScreenNameHousing,
					command: () => {Navigation.navigateTo(HousingScreen)},
					icon: () => <HousingIcon />,
					position: 2,
				})
				Navigation.menuRegister(menuItem);
			}

			if(buildingsVisibility){
				let menuItem = new MenuItem({
					key: "buildings",
					label: translationScreenNameBuildings,
					command: () => {Navigation.navigateTo(BuildingsScreen)},
					icon: () => <BuildingsIcon />,
					position: 1,
				})
				Navigation.menuRegister(menuItem);
			}

			let conversationsVisibility = chatroomsVisibility;
			if(conversationsVisibility){
				let menuItem = new MenuItem({
					key: "conversations",
					label: translationScreenNameConversations,
					command: () => {Navigation.navigateTo(Conversations)},
					icon: () => <ConversationIcon />,
					position: 1,
				})
				Navigation.menuRegister(menuItem);
			}

			if(canSeeEmployeeMenu(role)){
				Navigation.menuRegister(Project.getEmployeeMenu());
			}

			if(debug){
				let menuItem = Project.getDebugMenu()
				Navigation.menuRegister(menuItem);
			}
		}

		setSyncedMenu(true);
	}

	useEffect(() => {
		loadMenus();
	}, [props, debug, wikis]);

	return null;

}
