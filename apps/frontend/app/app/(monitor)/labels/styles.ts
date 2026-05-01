import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#f5f5f5',
	},
	headerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f4f4f4',
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	gridItem: {
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	iconText: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	},
	iconSlot: {
		width: 30,
		height: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconPlaceholder: {
		width: 30,
		height: 30,
	},
	title: {
		marginLeft: 8,
		fontSize: 17,
		flex: 1,
		flexShrink: 1,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	labelText: {
		marginLeft: 10,
	},
	logo: {
		width: 300,
		height: 100,
		marginRight: 10,
	},
	label: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#000',
	},
	timestamp: {
		fontSize: 14,
		color: '#555',
	},
	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		padding: 10,
	},
});
