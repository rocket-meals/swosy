// @ts-nocheck
import React, {FunctionComponent} from "react";
import {MyActionsheet} from "../../../kitcheningredients";
import {ProfileAPI, useSynchedProfile} from "../../components/profile/ProfileAPI";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {Text} from "native-base";

interface AppState {

}
export const ProfileResetRow: FunctionComponent<AppState> = (props) => {

    const [profile, setProfile] = useSynchedProfile();
    const actionsheet = MyActionsheet.useActionsheet();
    const translationResetProfile = useAppTranslation("resetProfile");

  return (
      <SettingsRow accessibilityLabel={translationResetProfile} leftContent={translationResetProfile} leftIcon={"account-convert"} rightIcon={null} onPress={() => {
          actionsheet.show({
              title: <Text>{translationResetProfile+"?"}</Text>,
              acceptLabel: <AppTranslation id={"reset"} />,
              cancelLabel: <AppTranslation id={"cancel"} />,
              onAccept: async () => {
                  let newProfile = ProfileAPI.getObjToResetProfile(profile);
                  setProfile(newProfile);
              },
          });
      }} />
  )
}
