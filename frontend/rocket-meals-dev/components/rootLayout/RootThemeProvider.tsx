import React, {createContext, useContext, useState} from 'react';
import {ThemeProvider} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {View, Text, useViewBackgroundColor, Icon} from '@/components/Themed'; // Import View from your themed components
import {RootFabHolder} from '@/components/rootLayout/RootFabHolder';
import {useIsDarkTheme, useThemeDetermined} from '@/states/ColorScheme';
import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {MyModalActionSheetGlobal} from "@/components/modal/MyModalActionSheetGlobal";
import {MyModalActionSheetItem, MyModalActionSheetProps} from "@/components/modal/MyModalActionSheet";
import {IconNames} from "@/constants/IconNames";
import {useIconWithInPixel} from "@/components/shapes/Rectangle";

// Create a Context for the modal
const ModalContext = createContext<{
	modalValue: MyModalActionSheetItem | null;
	setModalValue: React.Dispatch<React.SetStateAction<MyModalActionSheetItem | null>>;
} | undefined>(undefined);

// Provider component
export const ModalProvider = ({ children }: {children: React.ReactNode | React.ReactNode[]}) => {
	const [modalValue, setModalValue] = useState<MyModalActionSheetItem | null>(null); // Initially empty object

	return (
		<ModalContext.Provider value={{ modalValue, setModalValue }}>
			{children}
		</ModalContext.Provider>
	);
};

// Custom hook to use the modal context
export const useModalGlobalContext: () => [MyModalActionSheetItem | null, React.Dispatch<React.SetStateAction<MyModalActionSheetItem | null>>] = () => {
	const context = useContext(ModalContext);
	if (context === undefined) {
		throw new Error('useModalContext must be used within a ModalProvider');
	}
	return [context?.modalValue, context?.setModalValue];
};

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}

const RootContent = (props: RootThemeProviderProps) => {
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const backgroundColor = useViewBackgroundColor();

	const [textDimensions, setTextDimensions] = useSyncState(NonPersistentStore.textDimensions);
	const [iconDimensions, setIconDimensions] = useSyncState(NonPersistentStore.iconDimensions);
	const imageWidth = useIconWithInPixel(1);

	const appIsAccessible = !modalConfig

	return(
		<>
			<View style={{height: '100%', width: '100%', backgroundColor: backgroundColor}} accessible={appIsAccessible} accessibilityElementsHidden={!appIsAccessible}>
				{/* Render the children respecting the action sheet's visibility */}
				{props.children}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
//				width: 0, // has to be outcommented to get the width on iOS
//				height: 0, // has to be outcommented to get the height on iOS
				// hide the view
				opacity: 0,
			}}
				  accessible={false} accessibilityElementsHidden={true}
			>
				<View style={{
					backgroundColor: "red",
					flexDirection: "row"
				}}>
					<Text onLayout={(event) => {
						const {width, height} = event.nativeEvent.layout;
						setTextDimensions((currentDimensions) => {
							return {
								width: width,
								height: height
							}
						})
					}}>{"M"}</Text>
				</View>
				<Text>{textDimensions?.width}</Text>
				<View style={{
					backgroundColor: "blue",
					width: textDimensions?.width,
					height: 10,
				}} />
				<View style={{
					backgroundColor: "red",
					flexDirection: "row"
				}}>
					<Icon name={IconNames.star_active_icon} onLayout={(event) => {
						const {width, height} = event.nativeEvent.layout;
						setIconDimensions((currentDimensions) => {
							console.log("SetIconDimensions: "+width);
							return {
								width: width,
								height: height
							}
						})
					}} />
				</View>
				<Text>{iconDimensions?.width}</Text>
				<Text>{imageWidth}</Text>
				<View style={{
					backgroundColor: "blue",
					width: iconDimensions?.width,
					height: 10,
				}} />
			</View>
			<RootFabHolder />
		</>
	)
}

export const RootThemeProvider = (props: RootThemeProviderProps) => {
	const theme = useThemeDetermined();
	const isDarkTheme = useIsDarkTheme();
	const statusbarTextColorStyle = isDarkTheme ? 'light' : 'dark';



	return (
		<ThemeProvider value={theme}>
			<ModalProvider>
				<StatusBar style={statusbarTextColorStyle} />
				{/* Set View to occupy all available space and control accessibility based on action sheet visibility */}
				<RootContent>
					{props.children}
				</RootContent>
				<MyModalActionSheetGlobal />
			</ModalProvider>

		</ThemeProvider>
	);
}
