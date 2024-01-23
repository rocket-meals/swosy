import {ScrollView, StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {isUserLoggedIn, useCurrentUser} from "@/helper/sync_state_helper/custom_sync_states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import React from "react";
import {SettingsRowLogout} from "@/components/settings/SettingsRowLogout";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {AuthenticationData} from "@directus/sdk";
import {PersistentSecureStore} from "@/helper/sync_state_helper/PersistentSecureStore";

export default function SettingsScreen() {

  const isDebug = useIsDebug()

  const [currentUser, setCurrentUser] = useCurrentUser()
  const [authData, setAuthData] = useSyncState<AuthenticationData>(PersistentSecureStore.authentificationData)

  return (
      <ScrollView style={{width: "100%", height: "100%"}}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <SettingsRowSyncBooleanSwitch accessibilityLabel={"Debug"} variable={PersistentStore.debug} />
          <SettingsRowLogout />
          <Text >{"currentUser: "}</Text>
          <Text >{JSON.stringify(currentUser, null, 2)}</Text>
          <Text >{"authData: "}</Text>
          <Text >{JSON.stringify(authData, null, 2)}</Text>
        </View>
      </ScrollView>
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
