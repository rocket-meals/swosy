import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import BuildingDetailsContent from '@/components/BuildingDetailsContent/BuildingDetailsContent';
import useLastOpenedBuildings from '@/hooks/useLastOpenedBuildings';

const useBuildingDetailsModal = () => {
    const { show, close } = useMyScrollViewModal();
    const { trackBuildingOpened } = useLastOpenedBuildings();

    const openBuildingDetailsModal = useCallback((id?: string) => {
        if (id) {
            trackBuildingOpened(id);
        }
        show({
            children: <BuildingDetailsContent id={id} />,
            disableHorizontalPadding: true,
        });
    }, [show, trackBuildingOpened]);

    return { openBuildingDetailsModal, closeBuildingDetailsModal: close };
};

export default useBuildingDetailsModal;
