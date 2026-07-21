import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import TranslatedMenuHeader from '@/components/CustomMenuHeader/TranslatedMenuHeader';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

function ChatDetailsHeader() {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const router = useRouter();
	return (
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
	);
}

export default function ChatsLayout() {
        const { theme } = useTheme();
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
                                        header: () => <TranslatedMenuHeader labelKey={TranslationKeys.chats} />,
                                }}
                        />
                        <Stack.Screen
                                name="details/index"
                                options={{
                                        header: () => <ChatDetailsHeader />,
                                }}
                        />
                </Stack>
        );
}
