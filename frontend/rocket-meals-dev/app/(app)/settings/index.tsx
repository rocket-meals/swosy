import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";
import {SettingsRow} from "@/components/settings/SettingsRow";
import React from "react";
import {SettingsRowLogout} from "@/components/settings/SettingsRowLogout";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";

export default function SettingsScreen() {

  const isDebug = useIsDebug()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text >{"isDebug: "+isDebug}</Text>
      <SettingsRowSyncBooleanSwitch accessibilityLabel={"Debug"} variable={PersistentStore.debug} />
        <SettingsRowLogout />
    </View>
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
