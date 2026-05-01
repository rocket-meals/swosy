import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import LottieView from 'lottie-react-native';

type LottieViewProps = React.ComponentProps<typeof LottieView>;

const SafeLottieView = forwardRef<LottieView, LottieViewProps>(({ autoPlay, ...rest }, ref) => {
	const internalRef = useRef<LottieView>(null);

	useImperativeHandle(ref, () => internalRef.current as unknown as LottieView);

	useEffect(() => {
		if (!autoPlay) return;
		internalRef.current?.play?.();
	}, [autoPlay]);

	return <LottieView ref={internalRef} autoPlay={autoPlay} {...rest} />;
});

SafeLottieView.displayName = 'SafeLottieView';

export default SafeLottieView;
