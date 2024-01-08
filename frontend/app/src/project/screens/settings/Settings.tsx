// @ts-nocheck
import React, {FunctionComponent, useEffect} from "react";
import {View, Text} from "native-base";
import {SettingsRowNavigator} from "../../components/settings/SettingsRowNavigator";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {SettingsRowThemeSwitch} from "../../components/settings/SettingsRowThemeSwitch";
import {Users} from "../user/Users";
import {UsersAvatar} from "../user/UsersAvatar";
import {BaseNoPaddingTemplate, ConfigHolder, LegalRequiredLinks, Icon} from "../../../kitcheningredients";
import {SettingsRowSynchedBooleanSwitch} from "../../components/settings/SettingsRowSynchedBooleanSwitch";
import {SettingsProfileLanguageComponent} from "../../components/settings/SettingsProfileLanguageComponent";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {StorageKeys} from "../../helper/synchedVariables/StorageKeys";
import {SettingsRowMarking} from "../../components/settings/SettingsRowMarking";
import {SettingsRowCanteen} from "../../components/settings/SettingsRowCanteen";
import {useDebugMode, usePerformanceMode} from "../../helper/synchedJSONState";
import {DebugIcon} from "../../components/icons/DebugIcon";
import {DemoIcon} from "../../components/icons/DemoIcon";
import {SettingsRowCourseTimetable} from "../../components/courseTimetable/SettingsRowCourseTimetable";
import {Profiles} from "../user/Profiles";
import {useSynchedProfile} from "../../components/profile/ProfileAPI";
import {SettingsRowCanteenPriceGroup} from "../../components/settings/SettingsRowCanteenPriceGroup";
import {SettingsLogoutButton} from "./SettingsLogoutButton";
import {SettingsRowDrawerPosition} from "../../components/settings/SettingsRowDrawerPosition";
import {PerformanceIcon} from "../../components/icons/PerformanceIcon";

interface AppState {

}
export const Settings: FunctionComponent<AppState> = (props) => {

    let userInstance = ConfigHolder.instance.getUser();

    const [profile, setProfile] = useSynchedProfile();
    const [debug, setDebug] = useDebugMode();

    const title = useAppTranslation("settings");

    // corresponding componentDidMount
    useEffect(() => {

    }, [props?.route?.params])

    function renderAccountRow(){
        if(!!userInstance){
            return <SettingsRowNavigator accessibilityLabel={useAppTranslation("account")} destinationComponent={Profiles} destinationParams={{id: profile?.id, showbackbutton: true}} leftContent={<AppTranslation id={"account"} />} leftIcon={<UsersAvatar />} />
        }
        return null;
    }

    function renderDebugModeSetting(){
        return(
            <SettingsRowSynchedBooleanSwitch accessibilityLabel={useAppTranslation("debugMode")} variable={StorageKeys.CACHED_DEBUG_MODE} onPress={(debugMode) => {
                ConfigHolder.instance.reload()
            }} leftContent={<AppTranslation id={"debugMode"} />} leftIcon={<DebugIcon />} />
        )
    }

    function renderDemoModeSetting(){
        if(debug){
            return <SettingsRowSynchedBooleanSwitch accessibilityLabel={useAppTranslation("demoMode")} variable={StorageKeys.CACHED_DEMO_MODE} leftContent={<AppTranslation id={"demoMode"} />} leftIcon={<DemoIcon />} />
        }
    }

    function renderPerformanceSettings(){
        if(debug) {
            return <SettingsRowSynchedBooleanSwitch accessibilityLabel={"Performance Mode"}
                                                    variable={StorageKeys.CACHED_LOCAL_PERFORMANCE_MODE}
                                                    leftContent={"Performance Mode"}
                                                    leftIcon={<PerformanceIcon/>}/>
        }
    }

    function renderDebugSettings(){
        return(
            <>
                {renderDebugModeSetting()}
                {renderDemoModeSetting()}
                {renderPerformanceSettings()}
            </>
        )
    }

  return (
      <BaseNoPaddingTemplate title={title}>
          <View style={{width: "100%"}}>
              {renderAccountRow()}
              <SettingsSpacer />
              <SettingsProfileLanguageComponent />
              <SettingsRowMarking />
              <SettingsRowCanteen />
              <SettingsRowCanteenPriceGroup />
              <SettingsRowCourseTimetable />
              <SettingsSpacer />
              <SettingsRowThemeSwitch />
              <SettingsRowDrawerPosition />
              <SettingsSpacer />
              <SettingsLogoutButton />
              <SettingsSpacer />
              <SettingsSpacer />
              {renderDebugSettings()}
              <SettingsSpacer />
              <View style={{width: "100%", flexDirection: "row", flexWrap: "wrap", flex: 1, justifyContent: "center", alignItems: "center"}}>
                  <LegalRequiredLinks />
              </View>
          </View>
      </BaseNoPaddingTemplate>
  )
}
