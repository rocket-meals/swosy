import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from 'redux-persist';

// expo-sqlite's web support needs Metro wasm config plus COOP/COEP response headers
// (for SharedArrayBuffer/OPFS) that this app's static web export doesn't set up, and the
// 2MB ceiling being worked around on native is an Android/AsyncStorage-specific limit
// anyway - so web keeps using AsyncStorage (its localStorage-backed shim) unchanged.
// Metro picks this file over sqliteStorage.native.ts for web builds, so expo-sqlite's
// wasm-dependent web module is never pulled into the web bundle.
export const sqliteStorage: Storage = AsyncStorage;
