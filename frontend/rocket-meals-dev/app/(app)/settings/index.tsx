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
import {SettingsRowDrawerPosition} from "@/modules/settings/SettingsRowDrawerPosition";
import {SettingsRowProfileNickname} from "@/modules/settings/SettingsRowProfileNickname";
import {SettingsRowUser} from "@/modules/settings/SettingsRowUser";
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import {SettingsRowProfileCanteen} from "@/modules/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";

export default function SettingsScreen() {

  return (
     <MySafeAreaView>
       <ScrollViewWithGradient>
           <SettingsRowSpacerWithDivider />
           <SettingsRowUser />
           <SettingsRowProfileNickname />
           <SettingsRowProfileCanteen />
           <SettingsRowSpacerWithDivider />
           <SettingsRowColorScheme />
           <SettingsRowDrawerPosition />
           <SettingsRowSpacerWithDivider />
           <SettingsRowLogout />
           <SettingsRowSpacerWithDivider />
           <SettingsRowSyncBooleanSwitch label={"Debug"} leftIcon={"bug"} accessibilityLabel={"Debug"} variable={PersistentStore.debug} />
           <SettingsRowSyncBooleanSwitch label={"Demo"} leftIconOn={"test-tube"} leftIconOff={"test-tube-empty"} accessibilityLabel={"Demo"} variable={PersistentStore.demo} />
           <SettingsRowSyncBooleanSwitch label={"Developer"} leftIconOn={"test-tube"} leftIconOff={"test-tube-empty"} accessibilityLabel={"Developer"} variable={PersistentStore.develop} />
       </ScrollViewWithGradient>
     </MySafeAreaView>
  );
}