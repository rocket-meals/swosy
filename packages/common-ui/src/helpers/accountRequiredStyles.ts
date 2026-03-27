import { StyleSheet } from 'react-native';

export const accountRequiredStyles = StyleSheet.create({
	wrapper: {
		position: 'relative',
		overflow: 'hidden',
		borderStyle: 'dashed',
	},
	dimOverlay: {
		backgroundColor: 'rgba(128,128,128,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
	},
});
