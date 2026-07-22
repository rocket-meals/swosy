import type { AvatarConfig } from 'repo-depkit-common-ui';

/**
 * Display identity shared by a friend, an in-game player, and an archived
 * game-history participant (see FriendsStorage, GameStorage, GameHistoryStorage).
 */
export type PlayerIdentity = {
	name: string;
	color: string;
	/** Snapshot avatar config, when one has been set. */
	avatarConfig?: AvatarConfig;
};
