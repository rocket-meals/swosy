import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import React from 'react';
import {useSyncState} from '@/helper/syncState/SyncState';
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {MyButton} from "@/components/buttons/MyButton";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {getDemoFoodFeedback} from "@/states/SynchedFoods";
import {loadMarkingsFromServer} from "@/states/SynchedMarkings";

export const MyTestItem = ({id, usePersistentState}: {id: string, usePersistentState: boolean}) => {
	const [testStateNonPersistent, setTestStateNonPersistent] = useSyncState(NonPersistentStore.test);
	const [testStatePersistent, setTestStatePersistent] = useSyncState(PersistentStore.test);

	console.log("renderItem", id)

	let usedState = usePersistentState ? testStatePersistent : testStateNonPersistent;
	let usedSetState = usePersistentState ? setTestStatePersistent : setTestStateNonPersistent;

	let item = usedState?.[id];
	if (!item) {
		return null;
	}
	let itemKey = item.id;
	let active = item.notify;

	const onPressItem = async () => {
		console.log("onPressItem", id)
		await loadMarkingsFromServer();
		await loadMarkingsFromServer();
		let newItems = {...usedState};
		newItems[itemKey].notify = !active;
		usedSetState(newItems);
	}

	return <SettingsRow active={active} labelLeft={itemKey} accessibilityLabel={itemKey} labelRight={""+active} onPress={onPressItem} />
}

export default function HomeScreen() {
	const [modalConfig, setModalConfig] = useModalGlobalContext();
	const [testStateNonPersistent, setTestStateNonPersistent] = useSyncState(NonPersistentStore.test);
	const [testStatePersistent, setTestStatePersistent] = useSyncState(PersistentStore.test);

	let [usePersistentState, setUsePersistentState] = React.useState(false);

	let usedTestState = usePersistentState ? testStatePersistent : testStateNonPersistent;
	let usedSetTestState = usePersistentState ? setTestStatePersistent : setTestStateNonPersistent;

	const onPress = () => {
		let newItems = [];
		let amount = 20;
		for (let i = 0; i < amount; i++) {
			let demoFoodFeedback = getDemoFoodFeedback(i, "demoFoodId");
			newItems.push(demoFoodFeedback);
		}

		let itemsAsDict = {};
		newItems.forEach((item) => {
			itemsAsDict[item.id] = item;
		});

		usedSetTestState(itemsAsDict)

		let itemsForModal: MyModalActionSheetItem[] = [];
		for (let key in itemsAsDict) {
			let item = itemsAsDict[key];
			itemsForModal.push({
				accessibilityLabel: "",
				label: "",
				key: item.id,
				renderAsItem: (key, hide) => {
					return <MyTestItem id={key} usePersistentState={usePersistentState} />
				}
			});
		}

		setModalConfig({
			title: 'Test',
			items: itemsForModal,
			accessibilityLabel: "",
			active: false,
			key: "",
			label: "",
			value: undefined
		});
	};

	return (
		<MySafeAreaView>
			<ScrollViewWithGradient>
				<MyButton accessibilityLabel={'Use Persistent State'} onPress={() => setUsePersistentState(!usePersistentState)} text={'Use Persistent State: '+usePersistentState} />
				<MyButton accessibilityLabel={'Open Modal'} onPress={onPress} text={'Open Modal'} />
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}
