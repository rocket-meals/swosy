import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {useInsets} from '@/helper/device/DeviceHelper';

export default function HomeScreen() {
	const insets = useInsets()


	/**
     * example insets
     * {
     *  "top": 44,
     *  "left": 0,
     *  "right": 0,
     *  "bottom": 34
     */

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Device Information</Text>
			<Text>{'insets'}</Text>
			<Text>{JSON.stringify(insets, null, 2)}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: '80%',
	},
});
