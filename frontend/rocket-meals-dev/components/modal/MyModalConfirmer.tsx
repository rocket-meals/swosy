import React from 'react';
import {Modal} from 'react-native';
import {useViewBackgroundColor, View} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyModal, MyModalProps} from "@/components/modal/MyModal";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";


export type MyModalPropsConfirmer = {
	confirmLabel?: string
	cancelLabel?: string
	onConfirm: () => void | Promise<boolean | void> | void,
} & MyModalProps
export const MyModalConfirmer = (props: MyModalPropsConfirmer) => {
	const translation_confirm = useTranslation(TranslationKeys.confirm);
	const translation_cancel = useTranslation(TranslationKeys.cancel);

	let items = []

	const usedConfirmLabel = props.confirmLabel || translation_confirm
	items.push(<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.confirm_icon} accessibilityLabel={usedConfirmLabel} tooltip={usedConfirmLabel} text={usedConfirmLabel} onPress={async () => {
		const result = await props.onConfirm()
		if(result!==false){

		}
	} } />)

	const onCancel = props.onCancel
	if(onCancel){
		const usedCancelLabel = props.cancelLabel || translation_cancel
		items.push(<View style={{width: 10}} />)
		items.push(<MyButton useOnlyNecessarySpace={true} leftIcon={IconNames.cancel_icon} accessibilityLabel={usedCancelLabel} tooltip={usedCancelLabel} text={usedCancelLabel} onPress={async () => {
		} } />)
	}

	return <MyModal {...props}>
		{props.children}
		{items}
	</MyModal>
}
