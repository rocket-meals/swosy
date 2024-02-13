import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {View} from '@/components/Themed';
import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useCurrentUser} from "@/states/User";
import React from "react";
import {SettingsRowLogout} from "@/components/settings/SettingsRowLogout";
import {useIsDebug} from "@/states/Debug";
import {useSyncState} from "@/helper/syncState/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/syncState/PersistentSecureStore";
import {SettingsRowColorScheme} from "@/components/theme/SettingsRowColorScheme";
import {SettingsRowDrawerPosition} from "@/compositions/settings/SettingsRowDrawerPosition";
import {SettingsRowProfileNickname} from "@/compositions/settings/SettingsRowProfileNickname";
import {SettingsRowUser} from "@/compositions/settings/SettingsRowUser";
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import {SettingsRowProfileCanteen} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {SettingsRowProfileLanguage} from "@/compositions/settings/SettingsRowProfileLanguage";
import {IconNames} from "@/constants/IconNames";

export default function SettingsScreen() {

  return (
     <MySafeAreaView>
       <ScrollViewWithGradient>
           <SettingsRowSpacerWithDivider />
           <SettingsRowUser />
           <SettingsRowProfileNickname />
           <SettingsRowProfileLanguage />
           <SettingsRowProfileCanteen />
           <SettingsRowSpacerWithDivider />
           <SettingsRowColorScheme />
           <SettingsRowDrawerPosition />
           <SettingsRowSpacerWithDivider />
           <SettingsRowLogout />
           <SettingsRowSpacerWithDivider />
           <SettingsRowSyncBooleanSwitch labelLeft={"Debug"} leftIcon={IconNames.debug_icon} accessibilityLabel={"Debug"} variable={PersistentStore.debug} />
           <SettingsRowSyncBooleanSwitch labelLeft={"Demo"} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={"Demo"} variable={PersistentStore.demo} />
           <SettingsRowSyncBooleanSwitch labelLeft={"Developer"} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={"Developer"} variable={PersistentStore.develop} />
       </ScrollViewWithGradient>
     </MySafeAreaView>
  );
}