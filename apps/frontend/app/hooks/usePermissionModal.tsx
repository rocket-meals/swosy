import React, { useCallback, useMemo, useState } from 'react';

import PermissionModal from '@/components/PermissionModal/PermissionModal';

export const usePermissionModal = () => {
	const [isPermissionModalVisible, setPermissionModalVisible] = useState(false);

	const openPermissionModal = useCallback(() => {
		setPermissionModalVisible(true);
	}, []);

	const closePermissionModal = useCallback(() => {
		setPermissionModalVisible(false);
	}, []);

	const permissionModal = useMemo(
		() => <PermissionModal isVisible={isPermissionModalVisible} setIsVisible={setPermissionModalVisible} />,
		[isPermissionModalVisible]
	);

	return {
		closePermissionModal,
		isPermissionModalVisible,
		openPermissionModal,
		permissionModal,
		setPermissionModalVisible,
	};
};

export default usePermissionModal;
