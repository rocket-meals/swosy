import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Canteens} from '@/helper/database/databaseTypes/types';
import React from 'react';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';
import {MyModal} from "@/components/modal/MyModal";

export type MyCanteenSelectionModalProps = {
	visible: boolean,
	setVisible?: React.Dispatch<React.SetStateAction<boolean>>,
}
export const MyCanteenSelectionModal = (props: MyCanteenSelectionModalProps) => {
	const translation_title = useTranslation(TranslationKeys.canteen)

	const onPress = (canteen: Canteens | undefined) => {
		if(props.setVisible){
			props.setVisible(false);
		}
	}

	return <MyModal visible={props.visible} setVisible={props.setVisible} title={translation_title} >
		<CanteenSelectGridList onPress={onPress} />
	</MyModal>
}
