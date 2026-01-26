import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { TranslationKeys } from '@/locales/keys';

interface CampusEmptyStateProps {
    loading: boolean;
    theme: any;
    translate: (key: string) => string;
}

const CampusEmptyState: React.FC<CampusEmptyStateProps> = ({ loading, theme, translate }) => {
    if (loading) {
        return (
            <View style={emptyStyles.container}>
                <ActivityIndicator size={30} color={theme.screen.text} />
            </View>
        );
    }

    return (
        <View style={emptyStyles.container}>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: theme.screen.text }}>
                {translate(TranslationKeys.no_campus_found)}
            </Text>
        </View>
    );
};

const emptyStyles = StyleSheet.create({
    container: {
        height: 200,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default memo(CampusEmptyState);
