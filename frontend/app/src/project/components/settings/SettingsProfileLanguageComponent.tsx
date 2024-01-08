// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {ConfigHolder, Icon, MyActionsheet, MyThemedBox, ServerAPI} from "../../../kitcheningredients";
import {ProfileAPI, useSynchedProfile} from "../../components/profile/ProfileAPI";

import {SettingsRow} from "../../components/settings/SettingsRow";
import {useSynchedDirectusLanguage} from "../../helper/synchedJSONState";
import {ScrollView, View, Text} from "native-base";
import {useAppTranslation} from "../translations/AppTranslation";
import {StringHelper} from "../../helper/StringHelper";
import {useProfileLanguageCode} from "../translations/DirectusTranslationUseFunction";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    onChange?: (value: string) => void;
    shadeLevel?: number
}
export const SettingsProfileLanguageComponent: FunctionComponent<AppState> = (props) => {

    const actionsheet = MyActionsheet.useActionsheet();
    const [profile, setProfile] = useSynchedProfile();
    const [directusLanguages, setDirectusLanguages] = useSynchedDirectusLanguage();
    const profilesLanguageCode = useProfileLanguageCode()
    const languageTitle = useAppTranslation("language");
    const translationEdit = useAppTranslation("edit");
    const translationSelect = useAppTranslation("select");

    const languageOptions = {}

    const languageCodeToName = {}
    if(!!directusLanguages){
        for(let directusLanguage of directusLanguages){
            languageCodeToName[directusLanguage?.code] = directusLanguage?.name
        }
    }

    if(!!directusLanguages){
        for(let directusLanguage of directusLanguages){
            languageOptions[directusLanguage?.code] = {
                label: directusLanguage?.name+" ("+directusLanguage?.code+")",
            }
        }
    }

    let profilesLanguageName = null;
    if(!!languageCodeToName[profilesLanguageCode]){
        profilesLanguageName = languageCodeToName[profilesLanguageCode];
    }
    let profileSelectedLanguageName = profilesLanguageName || profilesLanguageCode;

    function onSelectLanguage(language){
        profile[ProfileAPI.getLanguageFieldName()] = language;
        setProfile(profile);
        ConfigHolder.instance.reload()
    }

  return (
          <SettingsRow
              accessibilityRole={AccessibilityRoles.adjustable}
              shadeLevel={props?.shadeLevel}
              accessibilityLabel={translationEdit+": "+languageTitle + " " + profileSelectedLanguageName}
              onPress={() => {
              actionsheet.show({
                  title: StringHelper.capitalizeFirstLetter(translationSelect)+": "+languageTitle,
                  onOptionSelect: onSelectLanguage,
              }, languageOptions);
          }} leftContent={languageTitle} rightContent={profileSelectedLanguageName} leftIcon={<Icon name={"translate"}  />} />
  )
}
