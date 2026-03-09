import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ApartmentDetailsContent from '@/components/ApartmentDetailsContent/ApartmentDetailsContent';

const useApartmentDetailsModal = () => {
    const { show, close } = useMyScrollViewModal();

    const openApartmentDetailsModal = useCallback((id?: string) => {
        show({
            children: <ApartmentDetailsContent id={id} />,
            disableHorizontalPadding: true,
        });
    }, [show]);

    return { openApartmentDetailsModal, closeApartmentDetailsModal: close };
};

export default useApartmentDetailsModal;
