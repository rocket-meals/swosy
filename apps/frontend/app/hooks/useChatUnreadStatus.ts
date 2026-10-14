import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { ChatHelper, DatabaseTypes } from 'repo-depkit-common';


/**
 * Date of the newest message. A server that knows `date_last_message` sets it on every message, so
 * while it is empty the chat has no message yet: e.g. a chat support just opened on a feedback, which
 * only shows the own comment (`initial_message`) and is nothing new. Only older servers without the
 * field fall back to the chat dates.
 */
export const getChatTimestamp = (chat: DatabaseTypes.Chats): string | null => {
        if (chat && 'date_last_message' in chat) {
                return chat.date_last_message || null;
        }
        return chat?.date_updated || chat?.date_created || null;
};

/**
 * The read status of the chats.
 * - `chats`: all chats, e.g. for the chats of the own food feedbacks.
 * - `visibleChats`: the chats of the screen "Chats". Chats of food feedbacks are not part of it, they
 *   are found at the own ratings, unless the dev setting `showFoodFeedbackChatsInChats` is on.
 * - `hasUnreadChats`: whether one of the `visibleChats` is unread, for the dots on the way there.
 */
const useChatUnreadStatus = () => {
        const { chats = [], readStatus = {} } = useAppSelector((state) => state.chats ?? {});
        const showFoodFeedbackChatsInChats = useAppSelector((state) => state.settings.showFoodFeedbackChatsInChats);

        const readStatusMap = readStatus ?? {};

        const visibleChats = useMemo(() => (showFoodFeedbackChatsInChats ? chats : chats.filter(chat => !ChatHelper.isFoodFeedbackChat(chat))), [chats, showFoodFeedbackChatsInChats]);

        const hasUnreadChats = useMemo(() => {
                return visibleChats.some(chat => Boolean(chat?.id) && ChatHelper.isUnread(getChatTimestamp(chat), readStatusMap[chat.id]));
        }, [visibleChats, readStatus]);

        const isChatUnread = useCallback(
                (chat: DatabaseTypes.Chats) => {
                        if (!chat?.id) {
                                return false;
                        }
                        return ChatHelper.isUnread(getChatTimestamp(chat), readStatusMap[chat.id]);
                },
                [readStatus],
        );

        return { chats, visibleChats, showFoodFeedbackChatsInChats, readStatus: readStatusMap, hasUnreadChats, isChatUnread };
};

export default useChatUnreadStatus;
