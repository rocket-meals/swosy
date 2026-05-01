import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	background: {
		flex: 1,
	},
	backgroundImage: {
		opacity: 0.35,
	},
	overlay: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	headerContainer: {
		marginBottom: 10,
	},
	fullscreenHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	fullscreenHeaderTitle: {
		fontSize: 18,
		fontWeight: '600',
		flexShrink: 1,
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
		paddingVertical: 12,
		gap: 16,
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
	actionButton: {
		padding: 10,
		borderRadius: 50,
		borderWidth: 1,
	},
});

export default styles;
