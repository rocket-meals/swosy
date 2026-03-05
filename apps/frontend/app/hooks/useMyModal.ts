import { useCallback, useState } from 'react';

const useMyModal = () => {
        const [isVisible, setIsVisible] = useState(false);

        const openModal = useCallback(() => setIsVisible(true), []);
        const closeModal = useCallback(() => setIsVisible(false), []);

        // Single-modal state has no stack, so these behave the same as open/close
        const openAndDiscardOthers = useCallback(() => setIsVisible(true), []);
        const closeAll = useCallback(() => setIsVisible(false), []);

        return {
                isVisible,
                openModal,
                closeModal,
                openAndDiscardOthers,
                closeAll,
        };
};

export default useMyModal;
