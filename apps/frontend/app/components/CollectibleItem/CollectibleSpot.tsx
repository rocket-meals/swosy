import React from 'react';
import { View } from 'react-native';
import { CollectibleAt } from 'repo-depkit-common';

import CollectibleItem from './index';

type CollectibleSpotProps = {
        collectibleKey: CollectibleAt;
};

const CollectibleSpot: React.FC<CollectibleSpotProps> = ({ collectibleKey }) => {
        return (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <CollectibleItem collectibleKey={collectibleKey} />
                </View>
        );
};

export default CollectibleSpot;
