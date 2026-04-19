import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ApartmentDetailsContent from '@/components/ApartmentDetailsContent/ApartmentDetailsContent';
import useLastOpenedBuildings from '@/hooks/useLastOpenedBuildings';

const useApartmentDetailsModal = () => {
    const { show, close } = useMyScrollViewModal();
    const { trackBuildingOpened } = useLastOpenedBuildings();

    const openApartmentDetailsModal = useCallback((id?: string, buildingId?: string) => {
        const buildingIdToTrack = buildingId || id;
        if (buildingIdToTrack) {
            trackBuildingOpened(buildingIdToTrack);
        }
        show({
            children: <ApartmentDetailsContent id={id} />,
            disableHorizontalPadding: true,
        });
    }, [show, trackBuildingOpened]);

    return { openApartmentDetailsModal, closeApartmentDetailsModal: close };
};

export default useApartmentDetailsModal;
