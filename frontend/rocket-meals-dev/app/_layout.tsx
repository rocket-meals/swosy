import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect, useState} from 'react';

import { useColorScheme } from '@/components/useColorScheme';

import { GluestackUIProvider, Text, Box } from "@gluestack-ui/themed"
import { config } from "@gluestack-ui/config"
import {StoreProvider} from "easy-peasy";
import {SyncState} from "@/helper/sync_state_helper/SyncState"; // Optional if you want to use default theme

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const syncState = new SyncState();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storageLoaded, setStorageLoaded] = useState(false);


  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    async function loadStorage() {
        await syncState.init();
        setStorageLoaded(true);
    }

    loadStorage();
  }, []);

  useEffect(() => {
    if (fontsLoaded && storageLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageLoaded]);

  if (!fontsLoaded || !storageLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  let store = syncState.getStore();

  return (
      <StoreProvider store={store}>
        <GluestackUIProvider config={config}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </GluestackUIProvider>
      </StoreProvider>
  );
}
