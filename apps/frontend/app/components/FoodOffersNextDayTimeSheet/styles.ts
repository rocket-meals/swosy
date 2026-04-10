import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	sheetView: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 28,
		borderTopLeftRadius: 28,
		padding: 16,
		paddingBottom: 24,
		alignItems: 'center',
	},
	sheetHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	sheetHeading: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 24,
		textAlign: 'center',
	},
	description: {
		marginTop: 12,
		fontFamily: 'Poppins_400Regular',
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	inputContainer: {
		width: '100%',
		marginTop: 20,
	},
	buttonContainer: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 28,
	},
	buttonBase: {
		flex: 1,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
	},
	secondaryButton: {
		borderWidth: 1,
	},
	primaryButton: {},
	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
});
