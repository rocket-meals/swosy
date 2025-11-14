import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		width: '100%',
	},
	inputContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
	},
	selectorButton: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 10,
		height: 50,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	selectorButtonWithPrefix: {
		borderTopLeftRadius: 0,
		borderBottomLeftRadius: 0,
		borderLeftWidth: 0,
	},
	selectorButtonWithSuffix: {
		borderTopRightRadius: 0,
		borderBottomRightRadius: 0,
		borderRightWidth: 0,
	},
	selectorText: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	placeholderText: {
		opacity: 0.7,
	},
	chevronIcon: {
		marginLeft: 12,
	},
	prefixSuffix: {
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#3A3A3A',
		paddingHorizontal: 12,
	},
	prefixSuffixLeft: {
		borderTopLeftRadius: 10,
		borderBottomLeftRadius: 10,
	},
	prefixSuffixRight: {
		borderTopRightRadius: 10,
		borderBottomRightRadius: 10,
	},
	prefixSuffixLabel: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	customInputContainer: {
		marginTop: 10,
	},
	errorText: {
		marginTop: 6,
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		color: '#ff4d4f',
	},
	sheetContent: {
		paddingHorizontal: 20,
		width: '100%',
		paddingBottom: 24,
	},
	sheetHeading: {
		fontSize: 24,
		fontFamily: 'Poppins_600SemiBold',
		textAlign: 'center',
		marginBottom: 16,
	},
	optionsList: {
		paddingBottom: 8,
	},
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 12,
		marginBottom: 10,
	},
	optionLabel: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
});
