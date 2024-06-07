import {Heading, Text} from '@/components/Themed';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MyLottieAnimation} from '@/components/lottie/MyLottieAnimation';
//import * as rocketSource from "../../../../assets/animations/rocket_purple.json"
import * as rocketSource from '@/assets/animations/rocket_purple.json'
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
//const rocketSource = require("@/assets/animations/rocket_purple.json")

export default function LottieTestScreen() {
	const testLottieUrl = 'https://raw.githubusercontent.com/FireboltCasters/directus-extension-auto-backup/main/assets/stats-lottie.json'

	return (
		<MySafeAreaViewThemed>
			<MyScrollView>
				<Heading>{'Lottie Test Screen'}</Heading>
				<Text>{'Normal Lottie from assets'}</Text>
				<MyLottieAnimation source={rocketSource} accessibilityLabel={'Test Rocket'} style={{width: 200, height: 200, backgroundColor: 'blue'}}/>
				<Text>{'Colored Lottie from assets'}</Text>
				<MyLottieAnimation source={rocketSource}
					accessibilityLabel={'Test Rocket Custom'}
					style={{width: 200, height: 200, backgroundColor: 'blue'}}
					colorReplaceMap={{
						'#FF00FF': '#FF0000'
					}}
				/>
				<Text>{'lottie project colored'}</Text>
				<MyProjectColoredLottieAnimation source={rocketSource} accessibilityLabel={'Test Rocket Colored'} style={{width: 200, height: 200, backgroundColor: 'blue'}} />
				<Text>{'Lottie from url'}</Text>
				<MyLottieAnimation url={testLottieUrl} accessibilityLabel={'Test Rocket Remote'} style={{width: 200, height: 200, backgroundColor: 'blue'}}/>
			</MyScrollView>
		</MySafeAreaViewThemed>
	);
}
