import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import usePlatformHelper from '@/helper/platformHelper';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';

interface ExpoUpdateLoaderProps {
  children?: React.ReactNode;
}

const TIMEOUT_MS = 10000; // 10 Sekunden

const ExpoUpdateLoader: React.FC<ExpoUpdateLoaderProps> = ({ children }) => {
  const { isSmartPhone } = usePlatformHelper();
  const { translate } = useLanguage();
  const [loading, setLoading] = useState<boolean>(isSmartPhone());
  const [status, setStatus] = useState<TranslationKeys>(
    TranslationKeys.CHECK_FOR_APP_UPDATES
  );

  useEffect(() => {
    async function loadUpdates() {
      if (!isSmartPhone()) {
        setLoading(false);
        return;
      }

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TIMEOUT_MS)
      );

      try {
        setStatus(TranslationKeys.CHECK_FOR_APP_UPDATES);
        const update = (await Promise.race([
          Updates.checkForUpdateAsync(),
          timeoutPromise,
        ])) as Updates.CheckForUpdateResult | null;

        if (!update || !update.isAvailable) {
          setLoading(false);
          return;
        }

        setStatus(TranslationKeys.DOWNLOAD_NEW_APP_UPDATE);
        const fetchResult = await Promise.race([
          Updates.fetchUpdateAsync(),
          timeoutPromise,
        ]);

        if (fetchResult) {
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.error('Error while applying updates', e);
      } finally {
        setLoading(false);
      }
    }

    loadUpdates();
  }, []);

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{translate(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default ExpoUpdateLoader;
