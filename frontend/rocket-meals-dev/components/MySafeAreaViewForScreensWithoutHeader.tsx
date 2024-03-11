import React from 'react';
import {useInsets} from '@/helper/device/DeviceHelper';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {SafeAreaViewProps} from 'react-native-safe-area-context';

/**
 * Since SafeAreaView is not correctly working in screens without a header, we need to set the padding manually
 * @param props
 * @constructor
 */
export function MySafeAreaViewForScreensWithoutHeader({...props}: SafeAreaViewProps) {
	const insets = useInsets()

	return (
		<MySafeAreaView {...props} style={{paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom}} />
	)
}