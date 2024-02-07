import React, {useEffect, useState} from 'react';
import {useFonts} from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {View, Text, ScrollView} from 'react-native';

// Importing components and helpers
import {GluestackUIProvider} from "@gluestack-ui/themed";
import {config} from "@gluestack-ui/config";
import {StoreProvider} from "easy-peasy";
import {SyncState} from "@/helper/sync_state_helper/SyncState";
import {RootServerStatusFlowLoader} from "@/components/rootLayout/RootServerStatusFlowLoader";
import {RootAuthUserFlowLoader} from "@/components/rootLayout/RootAuthUserFlowLoader";
import {Navigator} from 'expo-router';
import {RootThemeProvider} from "@/components/rootLayout/RootThemeProvider";
import {RootSyncDatabase} from "@/components/rootLayout/RootSyncDatabase";
import Slot = Navigator.Slot;
import {SecureStorageHelperAbstractClass} from "@/helper/storage_helper/SecureStorageHelperAbstractClass";
import {SecureStorageHelper} from "@/helper/storage_helper/SecureStorageHelper";
import {KeyboardAvoidingView, Platform} from "react-native";
import {useInsets} from "@/helper/device/DeviceHelper";

// Setting up Secure Storage and Sync State
// Preventing the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(app)',
};

SecureStorageHelperAbstractClass.setInstance(new SecureStorageHelper());

export default function RootLayout() {
  // State for checking if fonts and storage are loaded
  const [storageLoaded, setStorageLoaded] = useState<boolean>(false);
  const [reloadNumber, setReloadNumber] = useState(0);
  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const reset = (bool: boolean) => {
    console.log("RootLayout: reset: "+bool);
    setStorageLoaded(bool);
  }

  async function loadStorage() {
    console.log("Load storage asynchronously and update state")
    if(!storageLoaded){
      let instance = SyncState.getInstance();
      SyncState.setLoadState(reset);
      await instance.init();
      setReloadNumber(reloadNumber+1)
    }
  }

  // Load storage asynchronously and update state
  useEffect(() => {
    loadStorage();
  }, [storageLoaded]);

  // Hide SplashScreen after fonts and storage are loaded
  useEffect(() => {
    if (fontsLoaded && storageLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageLoaded]);

  // Throw font error if exists
  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  // Return null if fonts or storage are not loaded
  if (!fontsLoaded || !storageLoaded) {
    return null;
  }

  const store = SyncState.getInstance().getStore();

  // Render the Root Layout
  return (
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "height" : "height"}
          style={{ flex: 1, zIndex: 999 }}
      >
      <StoreProvider store={store} key={reloadNumber+""}>
        <GluestackUIProvider config={config} key={reloadNumber+""}>
          <RootThemeProvider key={reloadNumber+""}>
            <RootServerStatusFlowLoader key={reloadNumber+""} >
              <RootAuthUserFlowLoader key={reloadNumber+""}>
              </RootAuthUserFlowLoader>
            </RootServerStatusFlowLoader>
          </RootThemeProvider>
        </GluestackUIProvider>
      </StoreProvider>
      </KeyboardAvoidingView>
  );
}
