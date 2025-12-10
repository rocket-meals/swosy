import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/reducer';

import styles from './styles';

interface DebugViewProps {
  children?: ReactNode;
}

const useIsDebugEnabled = () => useSelector((state: RootState) => state.settings.debugMode);

export const DebugView: React.FC<DebugViewProps> = ({ children }) => {
  const isDebug = useIsDebugEnabled();
  if (!isDebug) return null;
  return <>{children}</>;
};

const MyDebugView: React.FC<DebugViewProps> = ({ children }) => {
  const isDebug = useIsDebugEnabled();
  if (!isDebug) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Debug</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default MyDebugView;
