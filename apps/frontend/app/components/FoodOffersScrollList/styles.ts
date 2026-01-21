import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	dayContainer: {
		paddingVertical: 10,
		paddingHorizontal: 0,
	},
	dateHeader: {
		fontSize: 18,
		marginBottom: 8,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	foodContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'stretch',
		flexWrap: 'wrap',
		marginTop: 20,
	},
	feebackContainer: {
		width: '100%',
		marginTop: 12,
	},
	elementContainer: {
		width: '100%',
		marginTop: 12,
		paddingHorizontal: 10,
	},
	dayDivider: {
		height: 1,
		marginTop: 12,
		marginHorizontal: 10,
	},
});
