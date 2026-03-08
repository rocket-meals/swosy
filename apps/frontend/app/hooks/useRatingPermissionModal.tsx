// Deprecated: use useAccountRequiredModal instead
import useAccountRequiredModal from '@/hooks/useAccountRequiredModal';

const useRatingPermissionModal = () => {
	const { openAccountRequiredModal, closeAccountRequiredModal } = useAccountRequiredModal();
	return { openRatingPermissionModal: openAccountRequiredModal, closeRatingPermissionModal: closeAccountRequiredModal };
};

export default useRatingPermissionModal;
