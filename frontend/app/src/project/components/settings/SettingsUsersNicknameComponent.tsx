// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {useSynchedProfile} from "../../components/profile/ProfileAPI";
import {AppTranslation, useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowTextEditComponent} from "./SettingsRowTextEditComponent";
import {NameIcon} from "../icons/NameIcon";

interface AppState {
    onChange?: (value: string) => void;
}
export const SettingsUsersNicknameComponent: FunctionComponent<AppState> = (props) => {

    const [profile, setProfile] = useSynchedProfile();
    const [editNickname, setEditNickname] = useState(false);
    const [nicknameValue, setNicknameValue] = useState(profile?.nickname || "");
    const textInput = useRef(null);

    let initialValue = profile?.nickname || "";
    const description = useAppTranslation("nickname");
    const translationSave = useAppTranslation("save");
    const translationCancel = useAppTranslation("cancel");
    const icon = <NameIcon />

    async function onChange(text): boolean{
        profile.nickname = text;
        let savedNickname = await setProfile(profile);
        if(savedNickname){
            if(props?.onChange){
                props.onChange(text);
            }
            return true;
        }
        return false;
    }

    //load user with corresponding profile?

    // corresponding componentDidMount
    useEffect(() => {
        if(editNickname){
            textInput.current.focus()
        }
    }, [props?.route?.params, editNickname])

  return (
          <SettingsRowTextEditComponent
              saveText={translationSave}
              cancelText={translationCancel}
              placeholder={initialValue}
              initialValue={initialValue}
              onChange={onChange}
              description={description}
              icon={icon}
          />
  )
}
