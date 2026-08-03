import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import TranslatedMenuHeader from '@/components/CustomMenuHeader/TranslatedMenuHeader';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

// `Stack.Screen`'s `options.header` calls this as a plain function (never as
// a JSX tag), so a factory returning a stable function avoids defining a new
// arrow (and thus a new "component") on every render — same pattern as
// `makeDrawerIcon` used for `drawerIcon` elsewhere.
function makeTranslatedMenuHeader(labelKey: TranslationKeys, headerKey?: string) {
	return () => <TranslatedMenuHeader labelKey={labelKey} headerKey={headerKey} />;
}

// Hooks must not run in the function passed to `header` itself (react-navigation
// calls it as a plain function, so hooks would register on the surrounding
// navigator component) — they live in this content component instead, rendered
// as an element by the stable ChatDetailsHeader render function below.
function ChatDetailsHeaderContent() {
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

const ChatDetailsHeader = () => <ChatDetailsHeaderContent />;

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
                                        header: makeTranslatedMenuHeader(TranslationKeys.chats),
                                }}
                        />
                        <Stack.Screen
                                name="details/index"
                                options={{
                                        header: ChatDetailsHeader,
                                }}
                        />
                </Stack>
        );
}
