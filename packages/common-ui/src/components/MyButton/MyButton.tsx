/**
 * MyButton – the one button of common-ui, plus ready-made action buttons (save, submit, update,
 * edit, cancel, delete) that bring their icon, look and translated text along.
 *
 * Screens use these instead of building a new `TouchableOpacity` with its own styles each time.
 * The texts of the action buttons come from the shared catalogue (`CommonTranslationKeys`) in the
 * language of the `SettingsProvider`; a `text` prop overrides them.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonTranslationKeys } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';
import { useCommonTranslation, useSettingsContext } from '../../context/SettingsContext';
import { myContrastColor } from '../../helpers/ColorHelper';

export type MyButtonVariant = 'primary' | 'secondary' | 'danger';

export interface MyButtonProps {
	text: string;
	onPress: () => void;
	/** `primary` is filled with the primary color, `secondary` is outlined, `danger` is filled red. */
	variant?: MyButtonVariant;
	/** Name of a MaterialCommunityIcons glyph shown before the text. */
	icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
	/** Greyed out and not pressable, e.g. while a form has no changes. */
	disabled?: boolean;
	/** Shows a spinner instead of the content and ignores presses. */
	loading?: boolean;
	accessibilityLabel?: string;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const DANGER_COLOR = '#C62828';

const MyButton: React.FC<MyButtonProps> = ({ text, onPress, variant = 'primary', icon, disabled = false, loading = false, accessibilityLabel, testID, style }) => {
	const { theme, isDark } = useTheme();
	const primaryColor = useSettingsContext()?.primaryColor ?? theme.primary;

	let backgroundColor = 'transparent';
	if (variant === 'primary') {
		backgroundColor = primaryColor;
	} else if (variant === 'danger') {
		backgroundColor = DANGER_COLOR;
	}
	const contentColor = variant === 'secondary' ? theme.screen.text : myContrastColor(backgroundColor, theme, isDark);
	const inactive = disabled || loading;

	return (
		<Pressable
			onPress={inactive ? undefined : onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? text}
			accessibilityState={{ disabled: inactive, busy: loading }}
			testID={testID}
			style={({ pressed }) => [
				styles.button,
				{ backgroundColor, borderColor: variant === 'secondary' ? theme.screen.placeholder : backgroundColor },
				disabled ? styles.disabled : undefined,
				pressed && !inactive ? styles.pressed : undefined,
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={contentColor} />
			) : (
				<>
					{icon ? <MaterialCommunityIcons name={icon} size={18} color={contentColor} /> : null}
					<Text style={[styles.text, { color: contentColor }]}>{text}</Text>
				</>
			)}
		</Pressable>
	);
};

export type MyActionButtonProps = Omit<MyButtonProps, 'text' | 'variant' | 'icon'> & {
	/** Overrides the translated default text. */
	text?: string;
};

function createActionButton(key: CommonTranslationKeys, variant: MyButtonVariant, icon: MyButtonProps['icon']): React.FC<MyActionButtonProps> {
	const ActionButton: React.FC<MyActionButtonProps> = ({ text, ...props }) => {
		const translate = useCommonTranslation();
		return <MyButton {...props} text={text ?? translate(key)} variant={variant} icon={icon} />;
	};
	return ActionButton;
}

export const MySaveButton = createActionButton(CommonTranslationKeys.save, 'primary', 'content-save-outline');
export const MySubmitButton = createActionButton(CommonTranslationKeys.submit, 'primary', 'send-outline');
export const MyUpdateButton = createActionButton(CommonTranslationKeys.update, 'primary', 'content-save-edit-outline');
export const MyEditButton = createActionButton(CommonTranslationKeys.edit, 'secondary', 'pencil-outline');
export const MyCancelButton = createActionButton(CommonTranslationKeys.cancel, 'secondary', 'close');

export type MyDeleteButtonProps = MyActionButtonProps & {
	/** When set, a press first asks this question and deletes only after the user confirms. */
	confirmQuestion?: string;
};

/** Delete button, optionally with an inline confirmation (question, cancel, delete). */
export const MyDeleteButton: React.FC<MyDeleteButtonProps> = ({ text, confirmQuestion, onPress, loading, ...props }) => {
	const { theme } = useTheme();
	const translate = useCommonTranslation();
	const [asking, setAsking] = useState(false);
	const deleteText = text ?? translate(CommonTranslationKeys.delete);

	if (!confirmQuestion) {
		return <MyButton {...props} text={deleteText} onPress={onPress} loading={loading} variant="danger" icon="delete-outline" />;
	}
	if (!asking) {
		return <MyButton {...props} text={deleteText} onPress={() => setAsking(true)} variant="secondary" icon="delete-outline" />;
	}
	return (
		<View style={[styles.confirmBox, { backgroundColor: theme.screen.iconBg }]}>
			<Text style={[styles.confirmQuestion, { color: theme.screen.text }]}>{confirmQuestion}</Text>
			<View style={styles.confirmButtons}>
				<MyCancelButton onPress={() => setAsking(false)} disabled={loading} style={styles.confirmButton} />
				<MyButton {...props} text={deleteText} onPress={onPress} loading={loading} variant="danger" icon="delete-outline" style={styles.confirmButton} />
			</View>
		</View>
	);
};

export default MyButton;

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		minHeight: 44,
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 10,
		borderWidth: 1,
	},
	text: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	disabled: {
		opacity: 0.4,
	},
	pressed: {
		opacity: 0.7,
	},
	confirmBox: {
		borderRadius: 10,
		padding: 12,
		gap: 10,
	},
	confirmQuestion: {
		fontSize: 15,
		lineHeight: 22,
	},
	confirmButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		gap: 10,
	},
	confirmButton: {
		flexGrow: 1,
	},
});
