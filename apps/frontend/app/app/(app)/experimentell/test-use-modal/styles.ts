import { StyleSheet } from 'react-native';

export default StyleSheet.create({
        container: {
                flex: 1,
        },
        contentContainer: {
                padding: 20,
        },
        content: {
                gap: 16,
        },
        heading: {
                fontFamily: 'Poppins_700Bold',
                fontSize: 24,
        },
        description: {
                fontFamily: 'Poppins_400Regular',
                fontSize: 16,
                lineHeight: 22,
        },
        button: {
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
        },
        buttonText: {
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 16,
        },
        modalContent: {
                padding: 20,
                borderRadius: 14,
                borderWidth: 1,
                gap: 12,
        },
        modalTitle: {
                fontFamily: 'Poppins_700Bold',
                fontSize: 20,
        },
        modalBody: {
                fontFamily: 'Poppins_400Regular',
                fontSize: 16,
                lineHeight: 22,
        },
        modalButton: {
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                alignItems: 'center',
        },
        modalButtonText: {
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 16,
        },
});
