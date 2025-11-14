import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	header: {
		width: '100%',
		height: 60,
		justifyContent: 'center',
		gap: 20,
	},
	row: {
		width: '100%',
	},
        col1: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
        },
        heading: {
                fontSize: 18,
                fontFamily: 'Poppins_400Regular',
        },
        menuButton: {
                padding: 10,
        },
        menuIconWrapper: {
                position: 'relative',
        },
        notificationDot: {
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
        },
});
