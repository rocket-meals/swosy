// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {View, Text, Input, Button, useToast} from "native-base";
import {ConfigHolder, Icon, MyThemedBox, ServerAPI} from "../../../kitcheningredients";
import {ProfileAPI, useSynchedProfile} from "../../components/profile/ProfileAPI";
import {SettingsRowNavigator} from "../../components/settings/SettingsRowNavigator";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {SettingsUsersNicknameComponent} from "../../components/settings/SettingsUsersNicknameComponent";
import {ProfileRawInformation} from "./ProfileRawInformation";
import {TextWithClipboard} from "../../helper/TextWithClipboard";
import {MyActionsheet} from "../../../kitcheningredients";
import {ProfilesFoodFeedbacks} from "./ProfilesFoodFeedbacks";
import {SettingMarking} from "../settings/SettingMarking";
import {MarkingIcon} from "../../components/marking/MarkingIcon";
import {SettingCanteen} from "../settings/SettingCanteen";
import {CanteenIcon} from "../../components/canteen/CanteenIcon";
import {SettingsProfileLanguageComponent} from "../../components/settings/SettingsProfileLanguageComponent";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {SettingsProfileAccountBalanceComponent} from "../../components/accountBalance/SettingsProfileAccountBalanceComponent";
import {SettingsRowMarking} from "../../components/settings/SettingsRowMarking";
import {SettingsRowCanteen} from "../../components/settings/SettingsRowCanteen";
import {DeleteIcon} from "../../components/icons/DeleteIcon";
import {IdIcon} from "../../components/icons/IdIcon";
import {ProfileResetRow} from "../../components/profile/ProfileResetRow";
import {ProfileDeleteAccount} from "../../components/profile/ProfileDeleteAccount";
import {SettingsRowCanteenPriceGroup} from "../../components/settings/SettingsRowCanteenPriceGroup";
import {SettingsRowCourseTimetable} from "../../components/courseTimetable/SettingsRowCourseTimetable";

interface AppState {

}
export const Profiles: FunctionComponent<AppState> = (props) => {

    const param_profile_id = props?.route?.params?.id;
    let userInstance = ConfigHolder.instance.getUser();
    const user_id = userInstance?.id;

    const [profile, setProfile] = useSynchedProfile();
    const [displayProfile, setDisplayProfile] = useState(profile)

    const translationRole = useAppTranslation("role");

    const user_instance = ConfigHolder.instance.getUser()
    const [displayUser, setDisplayUser] = useState(user_instance);
    const [role, setRole] = useState(undefined);
    const kitchenRole = ConfigHolder.instance.getRole();

    const displayProfileId = displayProfile?.id;
    const isOwnProfile = displayProfileId === param_profile_id;
    const profileExistsRemote = !!displayProfileId; //TODO: what if user id exists but not profile id

    async function loadData(){
        try{
            let directus = ServerAPI.getClient();
            let remoteUser = await directus.users.readOne(displayProfileId);
            setDisplayUser(remoteUser);

            let remoteRole = await ServerAPI.loadRole(remoteUser.role);
            setRole(remoteRole);
        } catch (err){
            //console.log(err);
        }
    }

    // corresponding componentDidMount
    useEffect(() => {
        loadData();
    }, [props?.route?.params])

    function renderProfileIdIcon(){
        return <IdIcon />
    }

    function renderRoleIcon(){
        return <Icon name={"check-decagram"} />
    }

    function renderProfileId(){
        let rightContent = (
            <TextWithClipboard text={displayProfileId} >
                <Text>{displayProfileId}</Text>
            </TextWithClipboard>
        )

        return (
            <SettingsRow leftContent={"ID"} leftIcon={renderProfileIdIcon()} rightContent={rightContent} />
        )
    }

    function renderNickname(){
        if(profileExistsRemote){
            return <SettingsUsersNicknameComponent />
        }
        return null;
    }

    function renderProfileSpecific(){
        if(profileExistsRemote){
            return(
                <>
                    <SettingsRow leftContent={<Text>{"Avatar"}</Text>} leftIcon={<Icon name={"face-outline"} />} />
                    {renderProfileId()}
                    {renderNickname()}
                </>
            )
        } else {
            return(
                <>
                    <SettingsRow leftContent={<AppTranslation id={"guestAccount"} />} leftIcon={renderProfileIdIcon()} rightIcon={null} />
                </>
            )
        }
    }

    function renderResetPassword(){
        if(!!displayUser?.id){
            const displayUserProvider = displayUser?.provider;
            if(displayUserProvider==="default"){
                return(
                    <SettingsRowNavigator leftContent={"TODO: Change Password"} leftIcon={"key"} rightIcon={null} />
                )
            } else {
                return(
                    <SettingsRow leftContent={<><AppTranslation id={"loggedInWith"} /><Text>{": "+displayUserProvider}</Text></>} leftIcon={"key"} rightIcon={null} />
                )
            }
        }
        return null;
    }

    function renderRole(){
        let roleDisplay = displayUser?.role
        if(!!role){
            roleDisplay = role?.name;
        }

        return(
            <>
                <SettingsRow leftContent={translationRole} rightContent={roleDisplay} leftIcon={renderRoleIcon()} />
            </>
        )
    }

  return (
      <View style={{width: "100%"}}>
          {renderProfileSpecific()}
          <SettingsSpacer />
          <SettingsProfileLanguageComponent />
          <SettingsProfileAccountBalanceComponent />
          <SettingsRowMarking />
          <SettingsRowCanteen />
          <SettingsRowCanteenPriceGroup />
          <SettingsRowNavigator accessibilityLabel={useAppTranslation("profilesFoodFeedbacks")}  destinationComponent={ProfilesFoodFeedbacks} leftContent={<AppTranslation id={"profilesFoodFeedbacks"} />} leftIcon={"star"} />
          <SettingsRowCourseTimetable />
          <SettingsSpacer />
          {renderResetPassword()}
          {renderRole()}
          <SettingsRowNavigator accessibilityLabel={useAppTranslation("showAllMyInformations")} destinationComponent={ProfileRawInformation} leftContent={<AppTranslation id={"showAllMyInformations"} />} leftIcon={"folder-text"} rightIcon={null} />
          <SettingsSpacer />
          <ProfileResetRow />
          <ProfileDeleteAccount />
      </View>
  )
}
