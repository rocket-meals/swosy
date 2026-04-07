import React from 'react';
import { CollectibleAtType } from 'repo-depkit-common';

import CollectibleItem from './index';

type CollectibleSpotProps = {
	collectibleKey: CollectibleAtType;
	isPreview?: boolean;
};

const CollectibleSpot: React.FC<CollectibleSpotProps> = ({ collectibleKey, isPreview }) => {
        return (
                <CollectibleItem
                        collectibleKey={collectibleKey}
                        hideOnCollect={isPreview ? false : undefined}
                        isPreview={isPreview}
                        hideCounter
                        wrapperStyle={{ alignItems: 'center', marginVertical: 8 }}
                />
        );
};

export default CollectibleSpot;
