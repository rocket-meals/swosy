import { Text, View} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
//import * as rocketSource from "../../../../assets/animations/rocket_purple.json"
//const rocketSource = require("@/assets/animations/rocket_purple.json")

export default function PlaygroundTestScreen() {
	return (
		<MySafeAreaView>
			<View style={{
				flex: 1,
				height: '100%',
				width: '100%',
				backgroundColor: 'red'
			}}
			>
				<Text>{'HI'}</Text>
				<View style={{
					height: '50%',
					width: '50%',
					backgroundColor: 'blue'
				}}
				>
					<View style={{
						height: '50%',
						width: '50%',
						backgroundColor: 'green'
					}}
					>

					</View>
				</View>
			</View>
		</MySafeAreaView>
	);
}
