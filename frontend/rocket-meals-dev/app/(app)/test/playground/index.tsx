import {Text, View} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyButton} from "@/components/buttons/MyButton";
import {useCallback, useState} from "react";
import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";

export default function PlaygroundTestScreen() {

	const [options, setOptions] = useSyncState(NonPersistentStore.test);

	const flipOptions = useCallback((option: string) => {
		setOptions((currentOptions) => {
			let newOptions = currentOptions ? {...currentOptions} : {};
			newOptions[option] = !newOptions[option];
			return newOptions;
		})
	}, [])

	return (
		<MySafeAreaView>
			<View style={{
				flex: 1,
				height: '100%',
				width: '100%',
			}}
			>
				<Text>Options:</Text>
				<Text>{`A: ${options?.a}`}</Text>
				<Text>{`B: ${options?.b}`}</Text>
				<MyButton accessibilityLabel={"A"} text={"A"} onPress={() => flipOptions("a")} />
				<MyButton accessibilityLabel={"B"} text={"B"} onPress={() => flipOptions("b")} />
			</View>
		</MySafeAreaView>
	);
}
