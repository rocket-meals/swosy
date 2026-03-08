export interface SettingsListLikeDislikeProps {
	like: boolean | null | undefined;
	onPressLike: () => void;
	onPressDislike: () => void;
	likeTooltipText?: string;
	dislikeTooltipText?: string;
	likeLoading?: boolean;
	dislikeLoading?: boolean;
	likeCount?: number;
	dislikeCount?: number;
}
