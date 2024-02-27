import {Navigator, Slot} from 'expo-router';
import React, {useEffect} from 'react';
import {useSyncState} from "@/helper/syncState/SyncState";
import {ServerAPI} from "@/helper/database/server/ServerAPI";
import {Text} from "@/components/Themed";
import {
  useIsServerCached,
  useIsServerOnline,
  useServerInfo,
  useServerInfoRaw
} from "@/states/SyncStateServerInfo";
import {PersistentSecureStore} from "@/helper/syncState/PersistentSecureStore";
import {AuthenticationData} from "@directus/sdk";
import {
  getIsCachedUserAnonymous,
  useCachedUserRaw,
  useCurrentUser,
  useCurrentUserRaw
} from "@/states/User";
import {RootSyncDatabase} from "@/components/rootLayout/RootSyncDatabase";

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// https://docs.expo.dev/versions/latest/sdk/notifications/#handle-push-notifications-with-navigation
function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }

    Notifications.getLastNotificationResponseAsync()
        .then(response => {
          if (!isMounted || !response?.notification) {
            return;
          }
          redirect(response?.notification);
        });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

export interface RootNotificationDeepLinkProps {
  children?: React.ReactNode;
}
export const RootNotificationDeepLink = (props: RootNotificationDeepLinkProps) => {
    useNotificationObserver();

  // Show notification when app is in foreground
  // https://stackoverflow.com/questions/56689701/expo-dont-show-notification-if-app-is-open-in-foreground
  Notifications.setNotificationHandler(null);

  return(
      <Slot />
  )
}