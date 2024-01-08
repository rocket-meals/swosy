// @ts-nocheck
import {
	BaseNoPaddingTemplate,
	BaseNoScrollTemplate,
	BaseTemplate, ConfigHolder,
	MenuItem,
	Navigation,
	PluginInterface
} from "../kitcheningredients";
import {SynchedStateKeys} from "./helper/synchedVariables/SynchedStateKeys";
import {StorageKeys} from "./helper/synchedVariables/StorageKeys";
import {FoodOfferList} from "./screens/food/FoodOfferList";
import {FoodDetails} from "./screens/food/FoodDetails";
import React from "react";
import {SettingCanteen} from "./screens/settings/SettingCanteen";
import {Settings} from "./screens/settings/Settings";
import {SettingMarking} from "./screens/settings/SettingMarking";
import {MyHome} from "./screens/home/MyHome";
import {SyncComponent} from "./helper/syncAndSetup/SyncComponent";
import {Wikis} from "./screens/wiki/Wikis";
import {FoodList} from "./screens/food/FoodList";
import {SettingProfile} from "./screens/settings/SettingProfile";
import {Users} from "./screens/user/Users";
import {UserItem} from "@directus/sdk";
import {ImageFullscreen} from "./screens/other/ImageFullscreen";
import {ProfileRawInformation} from "./screens/user/ProfileRawInformation";
import {Profiles} from "./screens/user/Profiles";
import {ProfilesFoodFeedbacks} from "./screens/user/ProfilesFoodFeedbacks";
import {AppTranslation, useAppTranslation} from "./components/translations/AppTranslation";
import {AccountBalance} from "./screens/accountBalance/AccountBalance";
import {UpdateScreen} from "./codepush/UpdateScreen";
import {SetupComponent} from "./helper/syncAndSetup/SetupComponent";
import {BuildingsScreen} from "./screens/buildings/BuildingsScreen";
import {NewsList} from "./screens/news/NewsList";
import {NewsContent} from "./screens/news/NewsContent";
import {BuildingsContent} from "./screens/buildings/BuildingsContent";
import {CanteenContent} from "./screens/canteen/CanteenContent";
import {HousingScreen} from "./screens/housing/HousingScreen";
import {ApartmentContent} from "./screens/housing/ApartmentContent";
import {IntercardReaderExample} from "./screens/debug/cardReader/IntercardReaderExample";
import {CourseTimetable} from "./screens/courseTimetable/CourseTimetable";
import {SettingCourseTimetable} from "./screens/settings/SettingCourseTimetable";
import {SettingTranslationCourseTimetable} from "./components/courseTimetable/SettingTranslationCourseTimetable";
import {VoiceoverExample} from "./screens/debug/accessibility/VoiceoverExample";
import {PositionDebug} from "./screens/debug/systemAndStyle/PositionDebug";
import {SynchedVariableText} from "./screens/debug/systemAndStyle/SynchedVariableText";
import {IconListExample} from "./screens/debug/systemAndStyle/IconListExample";
import {CodePush} from "./screens/debug/systemAndStyle/CodePush";
import {StyleExample} from "./screens/debug/systemAndStyle/StyleExample";
import {SystemSettingsLinks} from "./screens/debug/systemAndStyle/SystemSettingsLinks";
import {DeviceInformationDebug} from "./screens/debug/systemAndStyle/DeviceInformationDebug";
import {DebugPlayground} from "./screens/debug/DebugPlayground";
import {DirectusSettings} from "./screens/debug/DirectusSettings";
import {KeyboardAvoidingScrollviewExample} from "./screens/debug/inputs/KeyboardAvoidingScrollviewExample";
import {NotificationExample} from "./screens/debug/notification/NotificationExample";
import {MapLeaflet} from "./screens/debug/map/MapLeaflet";
import {CourseTimetableEvent} from "./screens/courseTimetable/CourseTimetableEvent";
import {ExampleSettingsRow} from "./screens/debug/systemAndStyle/ExampleSettingsRow";
import {Conversations} from "./screens/conversations/Conversations";
import {Conversation} from "./screens/conversations/Conversation";
import {SettingPriceGroup} from "./screens/settings/SettingPriceGroup";
import {LoginLanguageSelector} from "./screens/login/LoginLanguageSelector";
import {StringHelper} from "./helper/StringHelper";
import {CommonSystemActionHelper} from "./helper/SystemActionHelper";

const employeeMenu = new MenuItem({
	key: "employee",
	label: "Mitarbeiter",
	icon: "office-building",
	position: -1,
});

const debugMenu = new MenuItem({
	key: "debug",
	label: "Debug",
	icon: "bug",
	position: -2,
});



export default class Project extends PluginInterface{
	private setProfile: any;

	constructor(props) {
		super(props);
		StringHelper.enableReplaceAllOnOldDevices(); // TODO: why is this need even in super already called?
	}

	getSynchedStateKeysClass(){
		return SynchedStateKeys;
	}

	getStorageKeysClass(){
		return StorageKeys;
	}

	myRegisterRoute(component, template, titleTranslation, webTitle, route, params?, override?){
/**
		const myComponent = (props) => {
			let newProps = {...props}; //props are immutable, so we need to copy them
			newProps.title = titleTranslation; //We cant use template.bind here, so we just set the title
			return <View style={{width: "100%", height: "100%"}}>
				{template(newProps)}
			</View>
		}
*/
		Navigation.routeRegister({
			component: component,
			//path: route,
			template: template,
			title: titleTranslation,
			params: params,
		})
	}

	async registerRoutes(user, role, permissions){
		//console.log("registerRoutes");
		//console.log(user);
		//console.log(role);
		if(!!user){
			this.myRegisterRoute(FoodOfferList, null, <AppTranslation id={"foods"} useHeaderTextColor={true} />, "Foodoffers", "foodoffers", "/:canteenid/:date");
			this.myRegisterRoute(Profiles, BaseNoPaddingTemplate, <AppTranslation id={"profiles"} useHeaderTextColor={true} />, "Profiles", "profiles", "/:id");
			this.myRegisterRoute(FoodList, null, <AppTranslation id={"foods"} useHeaderTextColor={true} />, "Foods", "foods");
			this.myRegisterRoute(FoodDetails, BaseNoPaddingTemplate, <AppTranslation id={"foodDetails"} useHeaderTextColor={true} />, "Food Details", "foodDetails");

			this.myRegisterRoute(ImageFullscreen, null, "ImageFullscreen", "ImageFullscreen", "imagefullscreen");

			this.myRegisterRoute(Conversations, null, <AppTranslation id={"conversations"} useHeaderTextColor={true} />, "Conversations", "conversations");
			this.myRegisterRoute(Conversation, null, <AppTranslation id={"conversation"} useHeaderTextColor={true} />, "Conversation", "conversation", "/:id");

			// Side Menu for User
//		let mockMenu = new MenuItem("MockMenu", "MockMenu", null, null, null, null, false);
			//Menu.registerCommonMenu(new MenuItem("FoodOfferList", <AppTranslation id={"foods"} />, FoodOfferList, undefined, undefined, undefined, undefined, () => {return <CanteenIcon />}));

			this.myRegisterRoute(Wikis, null, "Wiki", "Wiki", "wikis", "/:id", true);

			this.myRegisterRoute(Users, BaseNoPaddingTemplate, "Profile", "Profile", "users", "/:id?", true);

			this.myRegisterRoute(AccountBalance, BaseTemplate, <AppTranslation id={"screenNameAccountBalance"} useHeaderTextColor={true} />, "Account balance", "accountBalance");
			this.myRegisterRoute(CourseTimetable, null, <AppTranslation id={"screenNameCourseTimetable"} useHeaderTextColor={true} />, "Course Timetable", "courseTimetable");
			this.myRegisterRoute(CourseTimetableEvent, BaseNoPaddingTemplate, <AppTranslation id={"event"} useHeaderTextColor={true} />, "Course Timetable Event", "courseTimetableEvent", "/:id");

			this.myRegisterRoute(HousingScreen, null, <AppTranslation id={"housing"} useHeaderTextColor={true} />, "Housings", "housing");
			this.myRegisterRoute(ApartmentContent, null, <AppTranslation id={"apartment"} useHeaderTextColor={true} />, "Apartment", "apartmentsResource", "/:id");

			this.myRegisterRoute(BuildingsScreen, null, <AppTranslation id={"buildings"} useHeaderTextColor={true} />, "Buildings", "buildings");
			this.myRegisterRoute(BuildingsContent, null, <AppTranslation id={"buildings"} useHeaderTextColor={true} />, "Buildings", "buildingsResource", "/:id");

			this.myRegisterRoute(CanteenContent, null, <AppTranslation id={"canteen"} useHeaderTextColor={true} />, "Canteen", "canteensResource", "/:id");

			this.myRegisterRoute(NewsList, BaseNoPaddingTemplate, <AppTranslation id={"news"} useHeaderTextColor={true} />, "News", "news");
			this.myRegisterRoute(NewsContent, null, <AppTranslation id={"news"} useHeaderTextColor={true} />, "News", "newsResource", "/:id");



			// Settings
			this.myRegisterRoute(Settings, null, <AppTranslation id={"settings"} useHeaderTextColor={true} />, "Settings", "settings", undefined, true);
			this.myRegisterRoute(SettingCourseTimetable, BaseNoPaddingTemplate, <SettingTranslationCourseTimetable useHeaderTextColor={true} />, "Settings Course Timetable", "settingCourseTimetable");
			this.myRegisterRoute(SettingProfile, BaseNoPaddingTemplate, <AppTranslation id={"settingsProfile"} useHeaderTextColor={true} />, "Settings Profile", "settingprofile");
			this.myRegisterRoute(ProfilesFoodFeedbacks, BaseNoPaddingTemplate, <AppTranslation id={"profilesFoodFeedbacks"} useHeaderTextColor={true} />, "Food Feedbacks", "profilesFoodFeedbacks");
			this.myRegisterRoute(ProfileRawInformation, BaseTemplate, <AppTranslation id={"profileRawInformation"} useHeaderTextColor={true} />, "Profile Raw Information", "profileRawInformation");
			this.myRegisterRoute(SettingCanteen, BaseNoPaddingTemplate, <AppTranslation id={"settingcanteen"} useHeaderTextColor={true} />, "Setting Canteen", "settingcanteen");
			this.myRegisterRoute(SettingPriceGroup, null, <AppTranslation id={"price_group"} useHeaderTextColor={true} />, "Setting Price Group", "setting_price_group");

			this.myRegisterRoute(SettingMarking, BaseNoScrollTemplate, <AppTranslation id={"settingmarking"} useHeaderTextColor={true} />, "Setting Marking", "settingmarking");


			Project.registerEmployeeMenus();

			Project.registerDebugMenus()
		}
	}

	private static registerEmployeeMenus(){
		let employeeMenu = Project.getEmployeeMenu();


		let employeeMenuBackend = new MenuItem({
			key: "employeeBackend",
			label: "Admin Bereich",
			command: () => {
				let url = ConfigHolder.instance.getBackendUrl()
				CommonSystemActionHelper.openExternalURL(url)
			}
		});
		employeeMenu.addChildMenuItems([employeeMenuBackend]);

		/**
		let employeeMenuStatistics = new MenuItem({
			key: "employeeStatistics",
			label: "Statistiken",
		});

		employeeMenu.addChildMenuItems([employeeMenuStatistics]);
			*/

		// TODO: Project.registerRouteAndGetDefaultMenuItems(employeeMenu, [TODO:]);

		// Tabellen:
		// - Users
		// - Geräte
		// - Allergene
		// - Speisefeedbacks (Bewertungen und Kommentare)
		// - Messages
		// - Event Teilnahmen
		// - Rollen
		// - Nutzer Rollen
		// - Feedbacks
		// - Allgemeine Informationen

		// Berichte:
		// - Speisefeedbacks - Senden/Generieren/Anzeigen lassen

		// Push-Nachrichten:
		// - Nutzer Anschreiben


	}

	private static registerDebugMenus(){
		let debugMenu = Project.getDebugMenu();

		let debugCardReaderMenu = new MenuItem({
			key: "debugCardReader",
			label: "Debug Card Reader",
		});
		debugMenu.addChildMenuItems([debugCardReaderMenu]);
		Project.registerRouteAndGetDefaultMenuItems(debugCardReaderMenu, [IntercardReaderExample]);

		let debugAccessibilityMenu = new MenuItem({
			key: "debugAccessibility",
			label: "Debug Accessibility",
		});
		debugMenu.addChildMenuItems([debugAccessibilityMenu]);
		Project.registerRouteAndGetDefaultMenuItems(debugAccessibilityMenu, [VoiceoverExample]);

		let systemAndStyleMenu = new MenuItem({
			key: "systemAndStyle",
			label: "System & Style",
		});
		debugMenu.addChildMenuItems([systemAndStyleMenu]);
		Project.registerRouteAndGetDefaultMenuItems(systemAndStyleMenu, [ExampleSettingsRow, PositionDebug, StyleExample, CodePush, SynchedVariableText, IconListExample, SystemSettingsLinks, DeviceInformationDebug, DebugPlayground]);

		let serverDebugMenu = new MenuItem({
			key: "serverDebug",
			label: "Server Debug",
		});
		Project.registerRouteAndGetDefaultMenuItems(serverDebugMenu, [DirectusSettings]);
		debugMenu.addChildMenuItems([serverDebugMenu]);

		let debugInputMenu = new MenuItem({
			key: "debugInput",
			label: "Debug Input",
		});
		Project.registerRouteAndGetDefaultMenuItems(debugInputMenu, [KeyboardAvoidingScrollviewExample]);
		debugMenu.addChildMenuItems([debugInputMenu]);

		let debugNotificationMenu = new MenuItem({
			key: "debugNotification",
			label: "Debug Notification",
		});
		Project.registerRouteAndGetDefaultMenuItems(debugNotificationMenu, [NotificationExample]);
		debugMenu.addChildMenuItems([debugNotificationMenu]);

		let debugMapMenu = new MenuItem({
			key: "debugMap",
			label: "Debug Map",
		});
		Project.registerRouteAndGetDefaultMenuItems(debugMapMenu, [MapLeaflet]);
		debugMenu.addChildMenuItems([debugMapMenu]);

		/**
		 Project.registerRouteAndGetDefaultMenuItems(debugMenu, [AvatarsExample, ColorSliderExample]);
		 */
	}

	static registerRouteAndGetDefaultMenuItems(menu: MenuItem, listOfFunctionComponents){
		for(let fc of listOfFunctionComponents){
			let route = Navigation.routeRegister({
				component: fc,
				template: BaseTemplate,
			})
			menu.addChildMenuItems([MenuItem.fromRoute(route)]);
		}
	}

	async initApp() {
		//console.log("Project init")
	}

	async onLogin(user, role){
		//console.log("onLogin");
	}

	setSetProfile(setProfile){
		this.setProfile = setProfile;
	}

	async onLogout(error){
		//console.log("onLogout");
		if(!!this.setProfile){
			this.setProfile({}, true);
		}
		if(!error){
			//normal logout
		} else {
			//logout on error
		}
	}

	getAboutUsComponent() {
		return <Wikis custom_id={"about_us"} hideHeader={true} />
	}

	getPrivacyPolicyComponent() {
		return <Wikis custom_id={"privacy_policy"} hideHeader={true} />
	}

	getAccessibilityComponent(): null {
		return <Wikis custom_id={"accessibility"} hideHeader={true} />
	}

	getTermsAndConditionsComponent() {
		return <Wikis custom_id={"terms_and_conditions"} hideHeader={true} />
	}

	getUseTranslationFunction(){
		return useAppTranslation;
	}

	getBottomNavbarComponent(){
		return null;
	}

	renderLoginTemplateTopRight(){
		return <LoginLanguageSelector />;
	}

	getHomeComponent(): any {
		return <MyHome />
	}

	getLoadingComponent(){
		return <UpdateScreen message={""} ignoreBytes={true} receivedBytes={0} />;
	}

	getSyncComponent(){
		return <SyncComponent getSetProfileFunction={this.setSetProfile.bind(this)} />;
	}

	getRootComponent(){
		return <SetupComponent />;
//		return null;
	}

	renderCustomAuthProviders(serverInfo): []{
		//@ts-ignore
		return null;
	}

	renderCustomUserAvatar(user: UserItem): JSX.Element{
		//return <UsersAvatar user={user} own={true} />;
	}

	getSettingsComponent(): any {
		//return null // we have overwritten it
	}

	getCustomProjectLogoComponent(): any {

	}

	/**
	 * Own Helper
	 */

	static getDebugMenu(): MenuItem {
		return debugMenu
	}

	static getEmployeeMenu(): MenuItem {
		return employeeMenu
	}

	/**
	 * Cookies
	 */

	getCookieDetails(cookieName: string){
		let defaultDetails = super.getCookieDetails(cookieName);
		defaultDetails.provider = "Rocket Meals";
		return defaultDetails;
	}

	getCookieGroupName(cookieGroup: string): string{
		return super.getCookieGroupName(cookieGroup);
	}

	getCookieAdditionalGroups(){
		return [];
	}

	getCookieComponentConsent(){
		return <Wikis custom_id={"cookieComponentConsent"} hideHeader={true} />
	}

	getCookieComponentAbout(){
		return <Wikis custom_id={"cookieComponentAbout"} hideHeader={true} />
	}

}
