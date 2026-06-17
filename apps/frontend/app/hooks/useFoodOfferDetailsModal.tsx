import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import FoodOfferDetailsContent from '@/components/FoodOfferDetailsContent/FoodOfferDetailsContent';

const useFoodOfferDetailsModal = () => {
    const { show, close } = useMyScrollViewModal();

    const openFoodOfferDetailsModal = useCallback((offerId?: string, foodId?: string, initialImageAssetId?: string | number | null, initialImageRemoteUrl?: string | null) => {
        show({
            children: <FoodOfferDetailsContent offerId={offerId} foodId={foodId} initialImageAssetId={initialImageAssetId} initialImageRemoteUrl={initialImageRemoteUrl} />,
            disableHorizontalPadding: true,
        });
    }, [show]);

    return { openFoodOfferDetailsModal, closeFoodOfferDetailsModal: close };
};

export default useFoodOfferDetailsModal;
