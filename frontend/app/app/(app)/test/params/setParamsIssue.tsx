import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {router, useGlobalSearchParams, useLocalSearchParams, useRouter} from 'expo-router';
import {MyButton} from "@/components/buttons/MyButton";

export default function HomeScreen() {
	const globalSearchParams = useGlobalSearchParams(); // TODO: Need to check which one to use
	const routerFromUseRouter = useRouter();

	return (
		<View style={styles.container}>
			<Text>{'This page shall show the params setting issue'}</Text>
			<Text>{'On npm run web, everything works fine.'}</Text>
			<Text>{'The issue occurs only on npm run deploy:local (and of course for github pages then).'}</Text>
			<Text>{'When you visit the page via /test/params/setParamsIssue everything works fine'}</Text>
			<Text>{'When you visit the page via /test/params/setParamsIssue?test=123 the url wont update correct but the printed params'}</Text>
			<MyButton text={"Set test"}
				onPress={() => {
					router.setParams({test: '123'})
				}}
			/>
			<MyButton text={"Clear params"}
				onPress={() => {
					router.setParams({test: undefined})
				}}
					  />
			<Text>{'routerFromUseRouter: '}</Text>
			<MyButton text={"Set test"}
				onPress={() => {
					routerFromUseRouter.setParams({test: '123'})
				}}
			/>
			<MyButton text={"Clear params"}
				onPress={() => {
					routerFromUseRouter.setParams({test: undefined})
				}}
			/>
			<Text>{'globalSearchParams: '}</Text>
			<Text>{JSON.stringify(globalSearchParams, null, 2)}</Text>
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
