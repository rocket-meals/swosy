import React from 'react';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { FriendsContent } from '@/components/FriendsContent';

export { FriendsContent } from '@/components/FriendsContent';
export type { FriendsContentProps } from '@/components/FriendsContent';

/* Main Friendships Screen */
const FriendshipsScreen = () => {
	useSetPageTitle(TranslationKeys.friendships);
	return <FriendsContent showHeading={true} />;
};

export default FriendshipsScreen;
