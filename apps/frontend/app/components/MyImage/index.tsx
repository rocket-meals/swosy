import React, { useMemo } from 'react';
import { ImageProps as RNImageProps, ImageSourcePropType } from 'react-native';
import { Image, ImageProps as ExpoImageProps } from 'expo-image';

import { getHighResImageUrl } from '@/constants/HelperFunctions';
import { getAppIconInsideExpoLocalSaved } from '@/config';

export type MyImageProps = {
        remote_image_url?: string | null;
        directus_asset_id?: string | number | { id?: string | number } | null;
        defaultImage?: ImageSourcePropType;
        defaultImageUrl?: string | null;
} & Omit<ExpoImageProps, 'source'>;

const MyImage: React.FC<MyImageProps> = ({
        remote_image_url,
        directus_asset_id,
        defaultImage,
        defaultImageUrl,
        ...props
}) => {
        const directusAssetId = useMemo(() => {
                if (typeof directus_asset_id === 'object' && directus_asset_id !== null) {
                        return (directus_asset_id as any).id ?? directus_asset_id;
                }

                return directus_asset_id;
        }, [directus_asset_id]);

        const fallbackImage = defaultImage ?? getAppIconInsideExpoLocalSaved();

        const source = useMemo(() => {
                if (remote_image_url) {
                        return { uri: remote_image_url };
                }

                if (directusAssetId) {
                        return { uri: getHighResImageUrl(String(directusAssetId)) || undefined };
                }

                if (defaultImageUrl) {
                        return { uri: defaultImageUrl };
                }

                // fallbackImage is usually a require() number or object. expo-image handles it.
                return fallbackImage;
        }, [defaultImageUrl, directusAssetId, fallbackImage, remote_image_url]);

        if (!source) {
                return null;
        }

        // Map resizeMode to contentFit if present in props (compatibility)
        const { resizeMode, ...rest } = props as any;
        let contentFit = props.contentFit;
        if (resizeMode && !contentFit) {
             if (resizeMode === 'cover') contentFit = 'cover';
             else if (resizeMode === 'contain') contentFit = 'contain';
             else if (resizeMode === 'stretch') contentFit = 'fill';
             else if (resizeMode === 'center') contentFit = 'none';
        }

        return <Image source={source} contentFit={contentFit} {...rest} />;
};

export default React.memo(MyImage);
