import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import {
	CommonUiComponentIds,
	KnobDefinition,
	KnobValue,
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
	SettingsListNumberInput,
	SettingsListTextInput,
	buildPlaybookProps,
	getPlaybookEntry,
} from 'repo-depkit-common-ui';

type GroupPosition = 'single' | 'top' | 'bottom' | 'middle';

function getGroupPosition(index: number, total: number): GroupPosition {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

/**
 * Playbook detail – renders one common-ui component from the playbook
 * registry (packages/common-ui/src/playbook) with live-configurable props.
 *
 * The URL is the single source of truth: every knob is read from the query
 * parameters (falling back to the registry defaults) and every change writes
 * back via router.setParams. A specific component state is therefore always
 * shareable and directly openable by Maestro tests, e.g.
 * `/experimentell/playbook/SettingsListBoolean?isEnabled=false&variant=with-icon`.
 */
const PlaybookComponentScreen = () => {
	const { theme } = useTheme();
	const params = useLocalSearchParams<Record<string, string | string[]>>();
	const componentParam = Array.isArray(params.component) ? params.component[0] : params.component;
	const entry = componentParam ? getPlaybookEntry(componentParam) : undefined;

	useSetPageTitle(entry ? `Playbook: ${entry.name}` : 'Playbook');

	if (!entry) {
		return (
			<View style={{ ...styles.container, ...styles.centered, backgroundColor: theme.screen.background }}>
				<Text style={{ ...styles.body, color: theme.screen.text }}>Unknown playbook component: {String(componentParam)}</Text>
			</View>
		);
	}

	const setKnob = (knobName: string, value: KnobValue) => {
		router.setParams({ [knobName]: String(value) });
	};

	const { componentProps, knobValues, variantName } = buildPlaybookProps(entry, params, setKnob);
	const TargetComponent = entry.component;

	const knobEntries = Object.entries(entry.knobs);
	const variantNames = entry.variants ? Object.keys(entry.variants) : [];

	const cycleSelectKnob = (knobName: string, knob: KnobDefinition) => {
		const options = knob.options ?? [];
		if (options.length === 0) return;
		const currentIndex = options.indexOf(String(knobValues[knobName]));
		const nextOption = options[(currentIndex + 1) % options.length];
		if (nextOption !== undefined) {
			setKnob(knobName, nextOption);
		}
	};

	const renderKnob = (knobName: string, knob: KnobDefinition, groupPosition: GroupPosition) => {
		const nativeID = CommonUiComponentIds.PLAYBOOK_KNOB_PREFIX + knobName;
		const label = knob.label ?? knobName;
		const value = knobValues[knobName];

		switch (knob.type) {
			case 'boolean':
				return <SettingsListBoolean key={knobName} nativeID={nativeID} label={label} isEnabled={value === true} onToggle={() => setKnob(knobName, value !== true)} groupPosition={groupPosition} />;
			case 'number':
				return <SettingsListNumberInput key={knobName} nativeID={nativeID} label={label} value={String(value)} initialValue={Number(value)} allowDecimal={true} onSave={(saved) => setKnob(knobName, saved)} groupPosition={groupPosition} />;
			case 'select':
				return <SettingsList key={knobName} nativeID={nativeID} title={label} value={String(value)} handleFunction={() => cycleSelectKnob(knobName, knob)} groupPosition={groupPosition} />;
			case 'text':
				return <SettingsListTextInput key={knobName} nativeID={nativeID} label={label} placeholder={label} value={String(value)} initialValue={String(value)} onSave={(saved) => setKnob(knobName, saved)} groupPosition={groupPosition} />;
		}
	};

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<Text style={{ ...styles.heading, color: theme.screen.text }}>{entry.name}</Text>
				{!!entry.description && <Text style={{ ...styles.body, color: theme.screen.text }}>{entry.description}</Text>}

				<SettingsListGroupTitle title="Preview" />
				<View nativeID={CommonUiComponentIds.PLAYBOOK_TARGET} style={[styles.target, entry.targetContainerStyle]}>
					<TargetComponent {...componentProps} />
				</View>

				{variantNames.length > 0 && (
					<>
						<SettingsListGroupTitle title="Variant" />
						{['default', ...variantNames].map((name, index) => {
							const isActive = name === 'default' ? variantName === undefined : variantName === name;
							return (
								<SettingsList
									key={name}
									nativeID={CommonUiComponentIds.PLAYBOOK_VARIANT_PREFIX + name}
									title={name}
									value={isActive ? '✓' : ''}
									handleFunction={() => router.setParams({ variant: name === 'default' ? '' : name })}
									groupPosition={getGroupPosition(index, variantNames.length + 1)}
								/>
							);
						})}
					</>
				)}

				{knobEntries.length > 0 && (
					<>
						<SettingsListGroupTitle title="Knobs" />
						{knobEntries.map(([knobName, knob], index) => renderKnob(knobName, knob, getGroupPosition(index, knobEntries.length)))}
					</>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	content: {
		width: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	body: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		marginBottom: 10,
	},
	target: {
		width: '100%',
		marginBottom: 10,
	},
});

export default PlaybookComponentScreen;
