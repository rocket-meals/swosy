import React, { useCallback } from 'react';
import { View } from 'react-native';
import DataAcess from '../../../components/DataAcces/DataAccess';
import DataSheet from '../../../components/DataAccesheet/DataSheet';
import styles from './styles';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const Index = () => {
	useSetPageTitle(TranslationKeys.dataAccess);
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();

	const handleOpenBottomSheet = useCallback((data: any) => {
		showScrollViewModal({
			children: <DataSheet closeSheet={closeScrollViewModal} content={data} />,
		});
	}, [showScrollViewModal, closeScrollViewModal]);

	return (
		<View style={styles.container}>
			<DataAcess onOpenBottomSheet={handleOpenBottomSheet} />
		</View>
	);
};

export default Index;
