import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
        container: {
                flex: 1,
        },
        content: {
                padding: 16,
        },
        section: {
                marginBottom: 16,
        },
        contentWithBottomPadding: {
                paddingBottom: 120,
        },
        title: {
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 8,
        },
        description: {
                fontSize: 14,
                lineHeight: 20,
        },
        label: {
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 6,
        },
        input: {
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
        },
        button: {
                marginTop: 12,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
        },
        buttonText: {
                fontSize: 16,
                fontWeight: '700',
        },
        info: {
                textAlign: 'center',
                fontSize: 16,
                marginTop: 24,
        },
        inline: {
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
        },
        notice: {
                fontSize: 12,
                lineHeight: 18,
                marginTop: 12,
        },
        debugCollectibleSpot: {
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                borderRadius: 12,
                borderWidth: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        debugCollectibleSpotText: {
                fontSize: 16,
                fontWeight: '700',
        },
        debugCollectibleSpotSubtext: {
                fontSize: 14,
                marginTop: 4,
        },
});

export default styles;
