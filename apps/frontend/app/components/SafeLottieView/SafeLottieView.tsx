import React, { forwardRef } from 'react';
import { View } from 'react-native';

type SafeLottieViewProps = {
	style?: any;
	source?: any;
	autoPlay?: boolean;
	loop?: boolean;
	resizeMode?: 'contain' | 'cover' | 'center' | 'stretch' | 'repeat';
};

const SafeLottieView = forwardRef<any, SafeLottieViewProps>(({ style }, _ref) => {
	return <View style={style} />;
});

SafeLottieView.displayName = 'SafeLottieView';

export default SafeLottieView;
