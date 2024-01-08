// @ts-nocheck
import React from 'react';
import {Box, Fab, useColorMode, View} from 'native-base';
import {Ionicons} from '@expo/vector-icons';
import {ThemeChanger} from "../theme/ThemeChanger";
import {Icon} from "../components/Icon";

export const ThemeFloaterButton = () => {
	const { colorMode, toggleColorMode } = useColorMode();

	const renderedFab =
		<View key={"themeChangerFloater"} style={{
			position: "absolute",
			bottom: 16,
			right: 16
		}}>
			<ThemeChanger key={"FabKey"}>
				<View
					style={{
						padding: 16,
						borderRadius: 32
					}}
					_dark={{
						bg: 'orange.50',
					}}
					_light={{
						bg: 'blueGray.900',
					}}
					shadow={7}
				>
					<Icon
						as={Ionicons}
						_dark={{ name: 'sunny', color: 'orange.400' }}
						_light={{ name: 'moon', color: 'blueGray.100' }}
						size="md"
					/>
				</View>
			</ThemeChanger>
		</View>;

	return renderedFab
};
