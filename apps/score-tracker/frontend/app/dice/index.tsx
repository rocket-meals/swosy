import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';

const MAX_DICE = 6;
const ROLL_ANIMATION_MS = 600;
const ROLL_ANIMATION_STEP_MS = 75;

const DICE_ICONS = [
	'dice-1',
	'dice-2',
	'dice-3',
	'dice-4',
	'dice-5',
	'dice-6',
] as const;

function rollDie(): number {
	return Math.floor(Math.random() * 6) + 1;
}

export default function DiceScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const [diceCount, setDiceCount] = useState(2);
	const [values, setValues] = useState<number[]>([rollDie(), rollDie()]);
	const [isRolling, setIsRolling] = useState(false);
	const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const handleSelectCount = useCallback((count: number) => {
		setDiceCount(count);
		setValues((prev) => {
			const next = prev.slice(0, count);
			while (next.length < count) next.push(rollDie());
			return next;
		});
	}, []);

	// Shuffle the faces rapidly for a moment before settling on the final roll -
	// cheap "animation" without needing reanimated.
	const handleRoll = useCallback(() => {
		if (isRolling) return;
		setIsRolling(true);
		const startedAt = Date.now();
		animationRef.current = setInterval(() => {
			setValues(Array.from({ length: diceCount }, rollDie));
			if (Date.now() - startedAt >= ROLL_ANIMATION_MS && animationRef.current) {
				clearInterval(animationRef.current);
				animationRef.current = null;
				setValues(Array.from({ length: diceCount }, rollDie));
				setIsRolling(false);
			}
		}, ROLL_ANIMATION_STEP_MS);
	}, [diceCount, isRolling]);

	React.useEffect(() => {
		return () => {
			if (animationRef.current) clearInterval(animationRef.current);
		};
	}, []);

	const total = values.reduce((sum, value) => sum + value, 0);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
				<SettingsListGroupTitle title="Anzahl Würfel" />
				<View style={styles.countRow}>
					{Array.from({ length: MAX_DICE }, (_, i) => i + 1).map((count) => (
						<TouchableOpacity
							key={count}
							style={[
								styles.countButton,
								{
									borderColor: PRIMARY_COLOR,
									backgroundColor: diceCount === count ? PRIMARY_COLOR : 'transparent',
								},
							]}
							onPress={() => handleSelectCount(count)}
							activeOpacity={0.7}
						>
							<Text style={[styles.countButtonText, { color: diceCount === count ? '#ffffff' : PRIMARY_COLOR }]}>
								{count}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Dice faces - tapping the dice also rolls */}
				<TouchableOpacity style={styles.diceArea} onPress={handleRoll} activeOpacity={0.8}>
					<View style={styles.diceRow}>
						{values.map((value, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<MaterialCommunityIcons
								key={index}
								name={DICE_ICONS[value - 1] ?? 'dice-1'}
								size={diceCount <= 2 ? 112 : diceCount <= 4 ? 88 : 72}
								color={PRIMARY_COLOR}
							/>
						))}
					</View>
					{values.length > 1 && (
						<Text style={[styles.totalText, { color: theme.screen.text }]}>Summe: {total}</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					nativeID={ComponentIds.DICE_ROLL_BUTTON}
					style={[styles.rollButton, { backgroundColor: PRIMARY_COLOR, opacity: isRolling ? 0.6 : 1 }]}
					onPress={handleRoll}
					disabled={isRolling}
					activeOpacity={0.8}
				>
					<MaterialCommunityIcons name="dice-multiple-outline" size={24} color="#ffffff" />
					<Text style={styles.rollButtonText}>{isRolling ? 'Würfeln...' : 'Würfeln'}</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	countRow: {
		flexDirection: 'row',
		gap: 8,
	},
	countButton: {
		flex: 1,
		borderWidth: 1.5,
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: 'center',
	},
	countButtonText: {
		fontSize: 16,
		fontWeight: '700',
	},
	diceArea: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	diceRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 8,
	},
	totalText: {
		fontSize: 22,
		fontWeight: '700',
		marginTop: 16,
	},
	rollButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
		height: 52,
		borderRadius: 12,
	},
	rollButtonText: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: '600',
	},
});
