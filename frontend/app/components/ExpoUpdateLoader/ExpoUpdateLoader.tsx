import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import usePlatformHelper from '@/helper/platformHelper';

interface ExpoUpdateLoaderProps {
  children?: React.ReactNode;
}

const TIMEOUT_MS = 10000; // 10 Sekunden

const ExpoUpdateLoader: React.FC<ExpoUpdateLoaderProps> = ({ children }) => {
  const { isSmartPhone } = usePlatformHelper();
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [loading, setLoading] = useState<boolean>(isSmartPhone());

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
        const update = (await Promise.race([
          Updates.checkForUpdateAsync(),
          timeoutPromise,
        ])) as Updates.CheckForUpdateResult | null;

        if (!update || !update.isAvailable) {
          setLoading(false);
          return;
        }

        const subscription = Updates.addListener((event) => {
          if (event.type === Updates.UpdateEventType.DOWNLOAD_PROGRESS) {
            setProgress({
              received: event.receivedBytes,
              total: event.totalBytes ?? 0,
            });
          }
        });

        const fetchResult = await Promise.race([
          Updates.fetchUpdateAsync(),
          timeoutPromise,
        ]);

        subscription.remove();

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

  const receivedMb = progress.received / (1024 * 1024);
  const totalMb = progress.total / (1024 * 1024);
  const progressRatio = progress.total
    ? progress.received / progress.total
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lade Update...</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progressRatio * 100}%` }]} />
      </View>
      <Text style={styles.text}>
        {receivedMb.toFixed(2)} MB
        {progress.total ? ` / ${totalMb.toFixed(2)} MB` : ''}
      </Text>
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
  barBackground: {
    width: '80%',
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  text: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default ExpoUpdateLoader;
