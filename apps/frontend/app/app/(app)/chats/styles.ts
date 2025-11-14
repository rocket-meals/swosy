import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
        list: {
                padding: 20,
        },
        chatItem: {
                padding: 15,
                borderRadius: 10,
        },
        chatTitle: {
                fontSize: 16,
                fontFamily: 'Poppins_400Regular',
        },
        headerActions: {
                marginBottom: 16,
                flexDirection: 'row',
                flexWrap: 'wrap',
                columnGap: 12,
                rowGap: 8,
        },
        actionButton: {
                alignSelf: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
        },
        actionButtonDisabled: {
                opacity: 0.6,
        },
        actionButtonText: {
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
        },
        secondaryActionButton: {
                backgroundColor: 'transparent',
                borderWidth: 1,
        },
        rightIconWrapper: {
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
        },
        itemNotificationDot: {
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
        },
});
