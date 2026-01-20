import { StyleSheet } from 'react-native';
import { horizontalScreenPadding } from '@/constants/Constants';

export default StyleSheet.create({
	dayContainer: {
		padding: 10,
		width: '100%',
		maxWidth: 1420,
		alignSelf: 'center',
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
		marginTop: 20,
		paddingHorizontal: horizontalScreenPadding,
	},
});
