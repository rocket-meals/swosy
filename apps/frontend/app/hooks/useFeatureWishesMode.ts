import { FeatureWishesMode, FeatureWishHelper } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';

/**
 * The feature wishes mode the app shows: from the app settings of the server, or "vote and submit"
 * while the debug switch "simulate feature wishes" in the settings is on. The simulation only
 * changes what the app shows, the server still decides what may be created.
 */
export function useFeatureWishesMode(): FeatureWishesMode {
	const appSettings = useAppSelector(state => state.settings.appSettings);
	const simulateEnabled = useAppSelector(state => state.settings.simulateFeatureWishesEnabled);
	return simulateEnabled ? FeatureWishesMode.VOTE_AND_SUBMIT : FeatureWishHelper.getMode(appSettings);
}
