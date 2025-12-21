import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	sheetView: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 28,
		borderTopLeftRadius: 28,
		padding: 10,
		paddingBottom: 0,
	},
	contentContainer: {
		alignItems: 'center',
	},
	sheetHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderTopRightRadius: 28,
		borderTopLeftRadius: 28,
	},
	sheetHeading: {
		fontFamily: 'Poppins_700Bold',
	},
        optionsContainer: {
                width: '100%',
                paddingHorizontal: 10,
                marginTop: 20,
        },
        flagIcon: {
                width: 32,
                height: 20,
                marginLeft: 4,
        },
        selectionIndicator: {
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
        },
});
