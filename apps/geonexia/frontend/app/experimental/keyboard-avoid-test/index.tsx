import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SettingsListGroupTitle, SettingsListTextInput, SettingsListNumberInput, useTheme } from 'repo-depkit-common-ui';

export default function KeyboardAvoidTestScreen() {
	const { theme } = useTheme();

	const [textValue, setTextValue] = useState('');
	const [multilineValue, setMultilineValue] = useState('');
	const [numberValue, setNumberValue] = useState(42);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.content}>
				<SettingsListGroupTitle title="Text Input" />
				<SettingsListTextInput
					label="Single-line text"
					value={textValue || undefined}
					placeholder="Enter some text…"
					initialValue={textValue}
					onSave={setTextValue}
					groupPosition="top"
				/>
				<SettingsListTextInput
					label="Multiline text"
					value={multilineValue || undefined}
					placeholder="Enter multiple lines…"
					initialValue={multilineValue}
					onSave={setMultilineValue}
					multiline
					numberOfLines={4}
					textAlignVertical="top"
					groupPosition="bottom"
				/>

				<SettingsListGroupTitle title="Number Input" />
				<SettingsListNumberInput
					label="Number"
					value={String(numberValue)}
					initialValue={numberValue}
					onSave={setNumberValue}
					min={0}
					max={100}
					step={1}
					groupPosition="single"
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingVertical: 16,
	},
});
