import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppUsageEventName } from 'repo-depkit-common';

import { trackScreenOpened } from '@/helper/AppUsageEventHelper';

/**
 * Sends an anonymous `screen_view` usage event each time the screen gets the
 * focus, also when the user comes back to it. Whether it is sent at all is
 * decided by `app_settings.app_usage_events_enabled`.
 */
const useTrackScreenOpened = (eventName: AppUsageEventName, screenName: string) => {
	useFocusEffect(
		useCallback(() => {
			void trackScreenOpened({ eventName, screenName });
		}, [eventName, screenName])
	);
};

export default useTrackScreenOpened;
