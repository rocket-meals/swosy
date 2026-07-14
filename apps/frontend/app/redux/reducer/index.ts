import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authReducer';
import canteenReducer from './canteenReducer';
import foodOffersReducer from './foodOffersReducer';
import settingReducer from './settingsReducer';
import foodReducer from './foodReducer';
import newsReducer from './newsReducer';
import collectibleEventsReducer from './collectibleEventsReducer';
import campusReducer from './campusReducer';
import apartmentsReducer from './apartmentReducer';
import managementReducer from './managementReducer';
import formReducer from './formReducer';
import foodAttributesReducer from './FoodAttributes';
import appElementsReducer from './appElementsReducer';
import lastUpdatedReducer from './lastUpdatedReducer';
import popupEventsHashReducer from './popupEventsHashReducer';
import chatsReducer from './chatsReducer';
import friendshipsReducer from './friendshipsReducer';
import { ApartmentsState, AppElementState, AuthState, CampusState, CanteensState, ChatsState, CollectibleEventsState, FoodAttributesState, FoodOffersState, FoodState, FormState, FriendshipsState, LastUpdatedState, ManagementState, NewsState, PopupEventsHashState, SettingsState } from '../Types/stateTypes';

// FoodOffers gets its own persisted AsyncStorage item ("persist:foodOffers") instead of
// living inside "persist:root" - see redux/store/store.ts for why (Android's ~2MB
// per-item AsyncStorage limit).
const foodOffersPersistedReducer = persistReducer(
	{ key: 'foodOffers', version: 1, storage: AsyncStorage },
	foodOffersReducer
);

export const reducer = combineReducers({
	state: (state = {}) => state,
	authReducer,
	canteenReducer,
        food: foodReducer,
        foodOffers: foodOffersPersistedReducer,
        settings: settingReducer,
        news: newsReducer,
        collectibleEvents: collectibleEventsReducer,
        campus: campusReducer,
        apartment: apartmentsReducer,
        management: managementReducer,
	form: formReducer,
	foodAttributes: foodAttributesReducer,
	appElements: appElementsReducer,
	lastUpdated: lastUpdatedReducer,
	popup_events_hash: popupEventsHashReducer,
	chats: chatsReducer,
	friendships: friendshipsReducer,
});

export type RootState = {
	authReducer: AuthState;
	apartment: ApartmentsState;
	appElements: AppElementState;
	campus: CampusState;
	canteenReducer: CanteensState;
	food: FoodState;
	foodOffers: FoodOffersState;
	form: FormState;
        foodAttributes: FoodAttributesState;
        lastUpdated: LastUpdatedState;
        management: ManagementState;
        news: NewsState;
        collectibleEvents: CollectibleEventsState;
        settings: SettingsState;
        popup_events_hash: PopupEventsHashState;
        chats: ChatsState;
        friendships: FriendshipsState;
};
