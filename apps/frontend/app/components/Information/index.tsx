import { Text, View } from 'react-native';
import React from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import * as Clipboard from 'expo-clipboard';
import { Entypo, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import useToast from '@/hooks/useToast';
import { TranslationKeys } from '@/locales/keys';
import SettingsList from '@/components/SettingsList';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import useLinkCoordinateModal from '@/hooks/useLinkCoordinateModal';

const Information: React.FC<any> = ({ campusDetails }) => {
	const { theme } = useTheme();
	const toast = useToast();
	const { translate } = useLanguage();
	const { openLinkCoordinateModal } = useLinkCoordinateModal();
	const { appSettings, primaryColor } = useSelector((state: RootState) => state.settings);
	const campusAreaColor = appSettings?.campus_area_color ?? primaryColor;

	const coordinates = campusDetails?.coordinates?.coordinates;
	const coordinatesLabel = coordinates?.length === 2 ? coordinates.join(', ') : undefined;

	const handleCopyUrlToClipboard = async () => {
		const googleMapsUrl = campusDetails?.url;
		const copied = await Clipboard.setStringAsync(googleMapsUrl);
		if (copied) {
			toast('Copied', 'success');
		}
	};

	const handleOpenLocationOptions = () => {
		if (!coordinates || coordinates.length !== 2) {
			console.error('Invalid coordinates');
			return;
		}

		const [longitude, latitude] = coordinates;
		openLinkCoordinateModal({
			latlon: { latitude, longitude },
		});
	};

	const infoItems = [
		...(coordinatesLabel
			? [
					{
						key: 'location',
						label: translate(TranslationKeys.location),
						leftIcon: <Ionicons name="location-sharp" size={24} color={theme.screen.icon} />,
						rightIcon: <Entypo name="chevron-small-right" size={26} color={theme.screen.icon} />,
						handleFunction: handleOpenLocationOptions,
						value: coordinatesLabel,
					},
				]
			: []),
		{
			key: 'construction',
			label: translate(TranslationKeys.year_of_construction),
			leftIcon: <MaterialIcons name="construction" size={24} color={theme.screen.icon} />,
			value: campusDetails?.date_of_construction ? String(campusDetails?.date_of_construction) : undefined,
		},
		...(campusDetails?.url
			? [
					{
						key: 'url',
						label: translate(TranslationKeys.copy_url),
						leftIcon: <MaterialCommunityIcons name="attachment" size={24} color={theme.screen.icon} />,
						rightIcon: <MaterialCommunityIcons name="content-copy" size={24} color={theme.screen.icon} />,
						handleFunction: handleCopyUrlToClipboard,
						value: undefined,
					},
				]
			: []),
	];

	return (
		<View style={styles.container}>
			<Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.information)}</Text>
			<View style={{ gap: 0 }}>
				{infoItems.map((item, index) => {
					const groupPosition =
						infoItems.length === 1 ? 'single' : index === 0 ? 'top' : index === infoItems.length - 1 ? 'bottom' : 'middle';
					return (
						<SettingsList
							key={item.key}
							iconBgColor={campusAreaColor}
							leftIcon={item.leftIcon}
							label={item.label}
							value={item.value}
							rightIcon={item.rightIcon}
							handleFunction={item.handleFunction}
							groupPosition={groupPosition}
						/>
					);
				})}
			</View>
		</View>
	);
};

export default Information;
