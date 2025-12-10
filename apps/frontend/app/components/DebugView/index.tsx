import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';

import styles from './styles';

interface DebugViewProps {
        isVisible?: boolean;
        children?: ReactNode;
}

export const DebugView: React.FC<DebugViewProps> = ({ isVisible = true, children }) => {
        if (!isVisible) return null;
        return <>{children}</>;
};

const MyDebugView: React.FC<DebugViewProps> = ({ isVisible = true, children }) => {
        if (!isVisible) return null;

        return (
                <View style={styles.container}>
                        <Text style={styles.label}>Debug</Text>
                        <View style={styles.content}>{children}</View>
                </View>
        );
};

export default MyDebugView;
