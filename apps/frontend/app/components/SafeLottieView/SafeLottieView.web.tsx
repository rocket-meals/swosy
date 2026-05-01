import React, { forwardRef, useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';

type SafeLottieViewProps = {
	style?: any;
	source?: any;
	autoPlay?: boolean;
	loop?: boolean;
	resizeMode?: 'contain' | 'cover' | 'center' | 'stretch' | 'repeat';
};

const SafeLottieView = forwardRef<any, SafeLottieViewProps>(({ style, source, autoPlay, loop }, _ref) => {
	const [LottiePlayer, setLottiePlayer] = useState<any>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			import('@lottiefiles/react-lottie-player').then(mod => {
				setLottiePlayer(() => mod.Player);
			});
		}
	}, []);

	const { width, height } = useMemo(() => {
		const w = typeof style?.width === 'number' ? style.width : 220;
		const h = typeof style?.height === 'number' ? style.height : 220;
		return { width: w, height: h };
	}, [style?.width, style?.height]);

	if (!source) {
		return <View style={style} />;
	}

	return (
		<View style={[style, { width, height }]}>
			{LottiePlayer && (
				<LottiePlayer
					autoplay={!!autoPlay}
					loop={!!loop}
					src={source}
					style={{ width, height }}
				/>
			)}
		</View>
	);
});

SafeLottieView.displayName = 'SafeLottieView';

export default SafeLottieView;
