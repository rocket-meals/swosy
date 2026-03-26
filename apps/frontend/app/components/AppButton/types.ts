import { ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface AppButtonProps {
	text: string;
	onPress?: () => void;
	variant?: 'primary' | 'outline' | 'ghost';
	iconLeft?: ReactNode;
	iconRight?: ReactNode;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	disabled?: boolean;
	loading?: boolean;
}
