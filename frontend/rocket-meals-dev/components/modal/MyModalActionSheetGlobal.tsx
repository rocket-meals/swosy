import React from 'react';
import {Modal} from 'react-native';
import {Heading, useViewBackgroundColor, View} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/states/ProjectInfo";
import {DrawerConfigPosition, useDrawerPosition} from "@/states/DrawerSyncConfig";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";
import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {MyModal, MyModalProps} from "@/components/modal/MyModal";
import {
	MyModalActionSheet,
	MyModalActionSheetItem,
	MyModalActionSheetProps
} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

export const MyModalActionSheetGlobal = () => {
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const visible = !!modalConfig
	const setVisible = (visible: boolean) => {
		if(!visible){
			setModalConfig(null);
		}
	}

	if(!modalConfig){
		return null;
	}

	return <MyModalActionSheet visible={visible} setVisible={setVisible} item={modalConfig} />

}
