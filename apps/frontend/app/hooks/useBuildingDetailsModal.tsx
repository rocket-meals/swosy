import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import BuildingDetailsContent from '@/components/BuildingDetailsContent/BuildingDetailsContent';

const useBuildingDetailsModal = () => {
    const { show, close } = useMyScrollViewModal();

    const openBuildingDetailsModal = useCallback((id?: string) => {
        show({
            children: <BuildingDetailsContent id={id} />,
            disableHorizontalPadding: true,
        });
    }, [show]);

    return { openBuildingDetailsModal, closeBuildingDetailsModal: close };
};

export default useBuildingDetailsModal;
