import React, { useCallback } from 'react';
import { useModal } from '@/components/GlobalModal/useModal';
import FoodOfferDetailsContent from '@/components/FoodOfferDetailsContent/FoodOfferDetailsContent';

const useFoodOfferDetailsModal = () => {
    const { show, close } = useModal();

    const openFoodOfferDetailsModal = useCallback((offerId?: string, foodId?: string) => {
        show(
            <FoodOfferDetailsContent offerId={offerId} foodId={foodId} />,
        );
    }, [show]);

    return { openFoodOfferDetailsModal, closeFoodOfferDetailsModal: close };
};

export default useFoodOfferDetailsModal;
