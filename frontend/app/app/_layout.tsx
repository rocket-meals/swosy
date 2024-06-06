import React, {useEffect, useState} from 'react';
import {useFonts} from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Importing components and helpers
// Todo remove this comment. just for testing snorkel.ai
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {StoreProvider} from 'easy-peasy';
import {SyncState} from '@/helper/syncState/SyncState';
import {RootServerStatusFlowLoader} from '@/components/rootLayout/RootServerStatusFlowLoader';
import {RootAuthUserFlowLoader} from '@/components/rootLayout/RootAuthUserFlowLoader';
import {Navigator} from 'expo-router';
import {RootThemeProvider} from '@/components/rootLayout/RootThemeProvider';
import {SecureStorageHelperAbstractClass} from '@/helper/storage/SecureStorageHelperAbstractClass';
import {SecureStorageHelper} from '@/helper/storage/SecureStorageHelper';
import {KeyboardAvoidingView, Platform} from 'react-native';
import {RootAppUpdateChecker} from "@/components/rootLayout/RootAppUpdateChecker";
import {RootCustomerAdaptions} from "@/components/rootLayout/RootCustomerAdaptions";
import Slot = Navigator.Slot;
import {LoadingLogoProvider} from "@/compositions/loadingScreens/LoadingLogoProvider";

// Setting up Secure Storage and Sync State
// Preventing the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	initialRouteName: '(app)',
};

const INITIAL_RELOAD_NUMBER = 0;

SecureStorageHelperAbstractClass.setInstance(new SecureStorageHelper());

export default function RootLayout() {
	// State for checking if fonts and storage are loaded
	//const [storageLoaded, setStorageLoaded] = useState<boolean>(false);

	const [reloadData, setReloadData] = useState
	<{
			reloadNumber: number,
			store: any
		}>
	({
		reloadNumber: INITIAL_RELOAD_NUMBER,
		store: null,
	});
	const reloadNumber = reloadData.reloadNumber;
	const store = reloadData.store;
	const storageLoaded = store !== null;

	const [fontsLoaded, fontsError] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		...FontAwesome.font,
	});

	const reset = (storageLoaded: boolean) => {
		console.log('RootLayout: reset: '+storageLoaded);
		if(!storageLoaded) {
			setReloadData({
				reloadNumber: reloadData.reloadNumber,
				store: null,
			});
		} else {
			const store = SyncState.getInstance().getStore();
			setReloadData({
				reloadNumber: reloadData.reloadNumber + 1,
				store: store,
			})
		}
	}

	async function loadStorage() {
		console.log('Load storage asynchronously and update state - reloadNumber: '+reloadNumber);
		if (!storageLoaded) {
			const instance = SyncState.getInstance();
			SyncState.setLoadState(reset);
			await instance.init();
			// init() will call the reset function
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
	const hotReloadOrFirstLoad = reloadNumber === INITIAL_RELOAD_NUMBER // Expo hot reload would cause storage to stay loaded, which would result in a double render
	if (!fontsLoaded || !storageLoaded || hotReloadOrFirstLoad) {
		return null;
	}

  // Render the Root Layout
  return (
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "height" : "height"}
          style={{ flex: 1, zIndex: 999 }}
      >
      <StoreProvider store={store} key={reloadNumber+""}>
        <GluestackUIProvider config={config} key={reloadNumber+""}>
          <RootThemeProvider key={reloadNumber+""}>
			  <LoadingLogoProvider key={reloadNumber+""}>
				  <RootAppUpdateChecker key={reloadNumber+""} reloadNumber={reloadNumber+""}>
					  <RootServerStatusFlowLoader key={reloadNumber+""} >
						  <RootAuthUserFlowLoader key={reloadNumber+""}>
							  <RootCustomerAdaptions key={reloadNumber}>
								  <Slot key={reloadNumber} />
							  </RootCustomerAdaptions>
						  </RootAuthUserFlowLoader>
					  </RootServerStatusFlowLoader>
				  </RootAppUpdateChecker>
			  </LoadingLogoProvider>
          </RootThemeProvider>
        </GluestackUIProvider>
      </StoreProvider>
      </KeyboardAvoidingView>
  );
}
