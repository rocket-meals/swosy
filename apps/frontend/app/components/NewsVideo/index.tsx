import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import MyImage from '@/components/MyImage';
import Server from '@/constants/ServerUrl';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

/** The video of a news (`news.video`, a Directus file); not in the generated types until they are regenerated. */
export type NewsWithVideo = { video?: string | { id?: string | null } | null };

export type NewsVideoProps = {
	/** The id of the Directus file. */
	videoId: string;
	/** Shown with a play button until the video is started, so nothing is downloaded before a tap. */
	posterUrl?: string | null;
	height?: number;
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: '#000000',
	},
	fill: {
		width: '100%',
		height: '100%',
	},
	playButtonContainer: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	playButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
	},
});

export function getNewsVideoId(news: NewsWithVideo | null | undefined): string | null {
	const video = news?.video;
	const id = typeof video === 'object' && video !== null ? video.id : video;
	return id ? String(id) : null;
}

/** The file itself, without the image transformations of `getImageUrl`. */
function getVideoUrl(videoId: string): string {
	return `${Server.ServerUrl}/assets/${encodeURIComponent(videoId)}`;
}

/** Only mounted after the tap: creating the player starts loading the video. */
const NewsVideoPlayer: React.FC<{ videoId: string }> = ({ videoId }) => {
	const player = useVideoPlayer(getVideoUrl(videoId));
	// Not in the setup of useVideoPlayer: on web that runs before the VideoView registered its <video>, so play() did nothing.
	useEffect(() => {
		player.play();
	}, [player]);
	return <VideoView player={player} style={styles.fill} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture={false} contentFit="contain" />;
};

/**
 * The video of a news in its large view (popup, food offers card, events): a still with a play button,
 * a tap starts the video with the controls of the platform. The player is released when the sheet closes.
 */
const NewsVideo: React.FC<NewsVideoProps> = ({ videoId, posterUrl, height = 300 }) => {
	const { translate } = useLanguage();
	const [started, setStarted] = useState(false);

	return (
		<View style={[styles.container, { height }]}>
			{started ? (
				<NewsVideoPlayer videoId={videoId} />
			) : (
				<>
					{posterUrl ? <MyImage style={styles.fill} contentFit="contain" remote_image_url={posterUrl} /> : null}
					<View style={styles.playButtonContainer}>
						<TouchableOpacity style={styles.playButton} onPress={() => setStarted(true)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.play_video)}>
							<MaterialCommunityIcons name="play" size={44} color="#FFFFFF" />
						</TouchableOpacity>
					</View>
				</>
			)}
		</View>
	);
};

export default NewsVideo;
