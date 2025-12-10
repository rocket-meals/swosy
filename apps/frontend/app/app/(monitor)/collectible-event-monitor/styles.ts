import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
        container: {
                flex: 1,
        },
        contentContainer: {
                flexGrow: 1,
                padding: 20,
                gap: 20,
        },
        heading: {
                fontSize: 24,
                fontWeight: '700',
        },
        card: {
                padding: 16,
                borderRadius: 12,
        },
        code: {
                fontFamily: 'monospace',
                fontSize: 14,
        },
});

export default styles;
