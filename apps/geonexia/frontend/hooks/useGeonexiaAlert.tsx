import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';

export interface GeonexiaAlertButton {
	text: string;
	onPress?: () => void;
	style?: 'default' | 'cancel' | 'destructive';
}

export const useGeonexiaAlert = () => {
	const { show, close } = useMyScrollViewModal();
	const { theme } = useTheme();

	const showAlert = (title: string, message?: string, buttons?: GeonexiaAlertButton[]) => {
		const effectiveButtons: GeonexiaAlertButton[] = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

		show({
			title,
			children: (
				<View style={{ paddingBottom: 8 }}>
					{!!message && (
						<Text style={{ color: theme.screen.text, fontSize: 15, marginBottom: 16, lineHeight: 22 }}>
							{message}
						</Text>
					)}
					{effectiveButtons.map((btn, idx) => {
						const isDestructive = btn.style === 'destructive';
						const isCancel = btn.style === 'cancel';
						const textColor = isDestructive ? '#ef4444' : isCancel ? theme.screen.icon : '#2563eb';
						return (
							<TouchableOpacity
								key={idx}
								onPress={() => {
									close();
									btn.onPress?.();
								}}
								style={{
									paddingVertical: 12,
									paddingHorizontal: 4,
									borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
									borderTopColor: '#e5e7eb',
								}}
							>
								<Text style={{ color: textColor, fontSize: 16, fontWeight: isDestructive ? '600' : '400', textAlign: 'center' }}>
									{btn.text}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			),
		});
	};

	return { showAlert };
};

export default useGeonexiaAlert;
