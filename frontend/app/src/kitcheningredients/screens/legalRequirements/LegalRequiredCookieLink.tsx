// @ts-nocheck
import React from "react";
import {Text, View} from "native-base";
import {ConfigHolder} from "../../ConfigHolder";
import {TranslationKeys} from "../../translations/TranslationKeys";
import {TransparentButton} from "../../components/buttons/TransparentButton";
import {RequiredSynchedStates} from "../../synchedstate/RequiredSynchedStates";
import {useSynchedJSONState} from "../../synchedstate/SynchedState";

export const LegalRequiredCookieLink = (props) => {

  let [isOpen, setIsOpen] = useSynchedJSONState(RequiredSynchedStates.showCookies)

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();

  const translation_cookies = useTranslation(TranslationKeys.cookies);

  return (
    <View>
      <TransparentButton accessibilityLabel={translation_cookies} onPress={async () => {
        setIsOpen(true);
      }}>
        <Text underline={true} fontSize={"sm"}>
          {translation_cookies}
        </Text>
      </TransparentButton>
    </View>
  )
}
