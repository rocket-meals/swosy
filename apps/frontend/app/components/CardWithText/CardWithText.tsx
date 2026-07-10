import React, { memo } from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { CardWithText as BaseCardWithText, CardWithTextProps } from 'repo-depkit-common-ui';
import MyImage from '@/components/MyImage';

function defaultRenderImage(source: ImageSourcePropType, style: StyleProp<ImageStyle>, imageAccessibilityLabel?: string): React.ReactNode {
	if (typeof source === 'object' && source !== null && !Array.isArray(source) && 'uri' in source) {
		return (
			<MyImage
				remote_image_url={(source as { uri?: string }).uri}
				style={style}
				contentFit="cover"
				accessibilityLabel={imageAccessibilityLabel}
			/>
		);
	}
	return (
		<MyImage
			defaultImage={source}
			style={style}
			contentFit="cover"
			accessibilityLabel={imageAccessibilityLabel}
		/>
	);
}

const CardWithText: React.FC<CardWithTextProps> = ({ renderImage, ...props }) => {
	return <BaseCardWithText renderImage={renderImage ?? defaultRenderImage} {...props} />;
};

export default memo(CardWithText);
export type { CardWithTextProps } from 'repo-depkit-common-ui';

