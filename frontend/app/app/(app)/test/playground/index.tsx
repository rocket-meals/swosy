import {Text, View} from '@/components/Themed';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {useCallback, useMemo, useState} from "react";
import {action, createStore, StoreProvider, thunk, useStoreActions, useStoreState} from "easy-peasy";
import {TouchableOpacity} from "react-native";


const store = createStore({
	options: {},
	updateOptions: action((state, payload) => {
		state.options = payload;
	}),
	setOptions: thunk(async (actions, payload, { getState }) => {
		let currentState = getState().options;
		const newValue = await payload(currentState)
		actions.updateOptions(newValue);
	}),
});

function useFlipOptions() {
	const options = useStoreState((state) => state.options);
	const setOptions = useStoreActions((actions) => actions.setOptions);

	const flipOptions = useCallback((option: string) => {
		setOptions((currentOptions) => {
			let newOptions = currentOptions ? {...currentOptions} : {};
			newOptions[option] = !newOptions[option];
			return newOptions;
		})
	}, [])

	return {options, flipOptions}
}

function useFlipOptionsWithKey(optionKey: string) {
	// Böse
	//const options = useStoreState((state) => state.options);
	//const optionValue = options?.[optionKey];

	// Gut
	const optionValue = useStoreState((state) => state.options?.[optionKey]);

	const setOptions = useStoreActions((actions) => actions.setOptions);

	const flipOptions = useCallback((option: string) => {
		setOptions((currentOptions) => {
			let newOptions = currentOptions ? {...currentOptions} : {};
			newOptions[option] = !newOptions[option];
			return newOptions;
		})
	}, [])

	const specificFlipOption = useCallback(() => flipOptions(optionKey), [optionKey])

	const memorizedReturn = useMemo(() => {
		return {optionValue, specificFlipOption}
	}, [optionValue])

	return memorizedReturn
}

// memoize this component
function MyButtonRowWithOptionKey ({optionKey}: {optionKey: string}) {
	const {optionValue, specificFlipOption} = useFlipOptionsWithKey(optionKey);

	console.log(`Rendering MyButtonRowWithOptionKey ${optionKey}`)

	return (
		<View>
			<Text>{optionKey+": "+optionValue}</Text>
			<TouchableOpacity style={{
				backgroundColor: 'orange',
				padding: 10,
				margin: 10,
			}} onPress={specificFlipOption}>
				<Text>Flip {optionKey}</Text>
			</TouchableOpacity>
		</View>
	)

	/**
	return useMemo(() => {
		console.log(`Rendering MyButtonRowWithOptionKey ${optionKey}`)

		return (
			<View>
				<Text>{optionKey+": "+optionValue}</Text>
				<TouchableOpacity style={{
					backgroundColor: 'orange',
					padding: 10,
					margin: 10,
				}} onPress={specificFlipOption}>
					<Text>Flip {optionKey}</Text>
				</TouchableOpacity>
			</View>
		)
	}, [optionValue])
		*/
}

export default function PlaygroundTestScreen() {

	return (
		<MySafeAreaViewThemed>
			<StoreProvider store={store}>
			<View style={{
				flex: 1,
				height: '100%',
				width: '100%',
			}}
			>
				<Text>Options:</Text>
				<MyButtonRowWithOptionKey optionKey={'option1'} />
				<MyButtonRowWithOptionKey optionKey={'option2'} />
			</View>
			</StoreProvider>
		</MySafeAreaViewThemed>
	);
}
