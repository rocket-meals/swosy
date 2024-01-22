import React, {useEffect, useState} from 'react';
import {useFonts} from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Importing components and helpers
import {GluestackUIProvider} from "@gluestack-ui/themed";
import {config} from "@gluestack-ui/config";
import {StoreProvider} from "easy-peasy";
import {SyncState} from "@/helper/sync_state_helper/SyncState";
import {SecureStorageHelper} from "@/helper/storage_helper/SecureStorageHelper";
import {SecureStorageHelperAbstractClass} from "@/helper/storage_helper/SecureStorageHelperAbstractClass";
import {RootServerStatusFlowLoader} from "@/components/rootLayout/RootServerStatusFlowLoader";
import {RootAuthUserFlowLoader} from "@/components/rootLayout/RootAuthUserFlowLoader";
import {Navigator} from 'expo-router';
import {RootThemeProvider} from "@/components/rootLayout/RootThemeProvider";
import Slot = Navigator.Slot;

// Setting up Secure Storage and Sync State
const syncState = new SyncState();
SecureStorageHelperAbstractClass.setInstance(new SecureStorageHelper());

// Preventing the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(app)',
};

export default function RootLayout() {
  // State for checking if fonts and storage are loaded
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Load storage asynchronously and update state
  useEffect(() => {
    async function loadStorage() {
      await SecureStorageHelperAbstractClass.init();
      await syncState.init();
      setStorageLoaded(true);
    }

    loadStorage();
  }, []);

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

  const store = syncState.getStore();

  // Render the Root Layout
  return (
      <StoreProvider store={store}> {/* StoreProvider has to be the most outer component */}
        <GluestackUIProvider config={config}>
          <RootThemeProvider>
            <RootServerStatusFlowLoader>
              <RootAuthUserFlowLoader>
                {/* Render the children */}
                  <Slot />
              </RootAuthUserFlowLoader>
            </RootServerStatusFlowLoader>
          </RootThemeProvider>
        </GluestackUIProvider>
      </StoreProvider>
  );
}
