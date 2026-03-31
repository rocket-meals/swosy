import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import { Player } from '@lottiefiles/react-lottie-player';

type SafeLottieViewProps = {
	style?: any;
	source?: any;
	autoPlay?: boolean;
	loop?: boolean;
	resizeMode?: 'contain' | 'cover' | 'center' | 'stretch' | 'repeat';
};

const SafeLottieView = forwardRef<any, SafeLottieViewProps>(({ style, source, autoPlay, loop }, _ref) => {
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
			<Player
				autoplay={!!autoPlay}
				loop={!!loop}
				src={source}
				style={{ width, height }}
			/>
		</View>
	);
});

SafeLottieView.displayName = 'SafeLottieView';

export default SafeLottieView;
