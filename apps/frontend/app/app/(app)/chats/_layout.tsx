import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import TranslatedMenuHeader from '@/components/CustomMenuHeader/TranslatedMenuHeader';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';
import { AppScreens, ChatHelper } from 'repo-depkit-common';

// `Stack.Screen`'s `options.header` calls this as a plain function (never as
// a JSX tag), so a factory returning a stable function avoids defining a new
// arrow (and thus a new "component") on every render — same pattern as
// `makeDrawerIcon` used for `drawerIcon` elsewhere.
function makeTranslatedMenuHeader(labelKey: TranslationKeys, headerKey?: string) {
	return () => <TranslatedMenuHeader labelKey={labelKey} headerKey={headerKey} />;
}

/** `opened_from` of a chat opened from the chat list: only then "back" returns to the list. */
export const CHAT_OPENED_FROM_LIST = 'chats';

// Hooks must not run in the function passed to `header` itself (react-navigation
// calls it as a plain function, so hooks would register on the surrounding
// navigator component) — they live in this content component instead, rendered
// as an element by the stable ChatDetailsHeader render function below.
function ChatDetailsHeaderContent() {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const router = useRouter();
	const navigation = useNavigation();
	const chats = useAppSelector(state => state.chats?.chats);
	const showFoodFeedbackChatsInChats = useAppSelector(state => state.settings.showFoodFeedbackChatsInChats);
	// Back returns to the screen the chat was opened from. A chat opened elsewhere (food offers, own ratings, support)
	// goes back in the drawer's history, since the chat list can still lie below it in this stack from an earlier visit.
	const goBack = () => {
		// The params come from the stack state: in this header `useLocalSearchParams` does not reliably return the ones of the shown chat.
		const stackState = navigation.getState();
		const params = (stackState?.routes[stackState.index]?.params ?? {}) as { chat_id?: string; opened_from?: string };
		if (params.opened_from === CHAT_OPENED_FROM_LIST && router.canGoBack()) {
			router.back();
			return;
		}
		const drawerNavigation = navigation.getParent();
		if (drawerNavigation?.canGoBack()) {
			drawerNavigation.goBack();
			return;
		}
		// The chat of a food feedback is not listed under "Chats" (see useChatUnreadStatus), so it falls back to the own ratings.
		const chat = (chats ?? []).find(entry => String(entry?.id) === String(params.chat_id));
		router.navigate(ChatHelper.isFoodFeedbackChat(chat) && !showFoodFeedbackChatsInChats ? `/${AppScreens.NOTIFICATION}` : '/chats');
	};
	return (
		<CustomStackHeader
			label={translate(TranslationKeys.chat)}
			onGoBack={goBack}
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
