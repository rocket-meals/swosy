import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		width: '100%',
	},
	checkboxContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#3A3A3A',
	},
	checkboxLabel: {
		marginLeft: 8,
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		color: '#333',
	},
	optionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 8,
	},
	optionContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#2E2E2E',
	},
	optionBox: {
		width: 28,
		height: 28,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	optionLabel: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
	},
});
