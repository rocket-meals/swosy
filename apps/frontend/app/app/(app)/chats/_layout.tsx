import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import CustomMenuHeader from '@/components/CustomMenuHeader/CustomMenuHeader';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export default function ChatsLayout() {
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const router = useRouter();
        return (
                <Stack
                        screenOptions={{
				headerStyle: { backgroundColor: theme.header.background },
				headerTintColor: theme.header.text,
			}}
		>
                        <Stack.Screen
                                name="index"
                                options={{
                                        header: () => <CustomMenuHeader label={translate(TranslationKeys.chats)} />,
                                }}
                        />
                        <Stack.Screen
                                name="details/index"
                                options={{
                                        header: () => (
                                                <CustomStackHeader
                                                        label={translate(TranslationKeys.chat)}
                                                        rightElement={
                                                                <TouchableOpacity
                                                                        onPress={() =>
                                                                                router.setParams({ refreshKey: `${Date.now()}` })
                                                                        }
                                                                        style={{ padding: 10 }}
                                                                >
                                                                        <MaterialCommunityIcons
                                                                                name="refresh"
                                                                                size={24}
                                                                                color={theme.header.text}
                                                                        />
                                                                </TouchableOpacity>
                                                        }
                                                />
                                        ),
                                }}
                        />
                </Stack>
        );
}
