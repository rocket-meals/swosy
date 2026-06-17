import React, { memo, useCallback } from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { CardWithText as BaseCardWithText, CardWithTextProps } from 'repo-depkit-common-ui';
import MyImage from '@/components/MyImage';

const CardWithText: React.FC<CardWithTextProps> = ({ renderImage, ...props }) => {
	const defaultRenderImage = useCallback((source: ImageSourcePropType, style: StyleProp<ImageStyle>) => {
		const src = source as { uri?: string };
		if (src?.uri) {
			return (
				<MyImage
					remote_image_url={src.uri}
					style={style}
					contentFit="cover"
				/>
			);
		}
		return (
			<MyImage
				defaultImage={source}
				style={style}
				contentFit="cover"
			/>
		);
	}, []);

	return <BaseCardWithText renderImage={renderImage ?? defaultRenderImage} {...props} />;
};

export default memo(CardWithText);
export type { CardWithTextProps } from 'repo-depkit-common-ui';

