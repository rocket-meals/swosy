import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {View} from '@/components/Themed';
import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import React from "react";
import {SettingsRowLogout} from "@/components/settings/SettingsRowLogout";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";
import {SettingsRowColorScheme} from "@/components/theme/SettingsRowColorScheme";
import {SettingsRowDrawerPosition} from "@/modules/settings/SettingsRowDrawerPosition";
import {SettingsRowProfile} from "@/modules/settings/SettingsRowProfile";
import {SettingsRowUser} from "@/modules/settings/SettingsRowUser";
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import {SettingsRowProfileCanteen} from "@/modules/settings/SettingsRowProfileCanteen";

export default function SettingsScreen() {

  const isDebug = useIsDebug()

  const [currentUser, setCurrentUser] = useCurrentUser()
  const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

  return (
     <SafeAreaView style={{width: "100%", height: "100%"}}>
       <ScrollView style={{width: "100%", height: "100%"}}>
         <View style={styles.container}>
           <SettingsRowSpacerWithDivider />
           <SettingsRowUser />
           <SettingsRowProfile />
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
         </View>
       </ScrollView>
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
