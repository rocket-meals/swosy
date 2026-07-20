import React, { useEffect, useState } from 'react';
import styles from './styles';
import { Dimensions, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import packages from '../../../constants/LicenseData';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { Entypo } from '@expo/vector-icons';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';

const LicenseInformation = () => {
	useSetPageTitle(TranslationKeys.license_information);
	const { theme } = useTheme();
	const [expanded, setExpanded] = useState(null);
	const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

	const toggleDropdown = (index: any) => {
		setExpanded(expanded === index ? null : index);
	};

	useEffect(() => {
		const onChange = ({ window }: { window: any }) => {
			setWindowWidth(window.width);
		};

		const subscription = Dimensions.addEventListener('change', onChange);
		return () => {
			subscription.remove();
		};
	}, []);

	// Ensure packages is defined before calling map
	if (!Array.isArray(packages)) {
		return <Text>Packages data not available.</Text>;
	}

	let sectionFontSize = 16;
	if (windowWidth > 600) {
		sectionFontSize = isWeb ? 18 : 16;
	}
	let detailFontSize = 12;
	if (windowWidth > 600) {
		detailFontSize = isWeb ? 14 : 12;
	}

	return (
		<View style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView>
				<View style={styles.container}>
					<View style={{ width: windowWidth > 600 ? '90%' : '98%' }}>
						{packages.map((pkg, index) => (
							<View key={pkg.name} style={{ padding: 10 }}>
								<TouchableOpacity
									style={{
										...styles.section,
										backgroundColor: theme.screen.iconBg,
									}}
									onPress={() => toggleDropdown(index)}
								>
									<Text
										style={{
											width: '70%',
											color: theme.screen.text,
											fontSize: sectionFontSize,
										}}
									>
										{pkg.name}
									</Text>
									<View style={styles.iconText}>
										<Text
											style={{
												marginRight: 10,
												color: theme.screen.text,
												fontSize: sectionFontSize,
											}}
										>
											{pkg.version}
										</Text>
										{expanded === index ? <Entypo name="chevron-small-up" size={24} color={theme.screen.icon} /> : <Entypo name="chevron-small-down" size={24} color={theme.screen.icon} />}
									</View>
								</TouchableOpacity>
								{expanded === index && (
									<View style={styles.extandContainer}>
										<View style={styles.detailText}>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												Package
											</Text>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												{pkg.name}
											</Text>
										</View>
										<View style={styles.detailText}>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												Version
											</Text>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												{pkg.version}
											</Text>
										</View>
										<View style={styles.detailText}>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												License
											</Text>
											<Text
												style={{
													color: theme.screen.text,
													fontSize: detailFontSize,
												}}
											>
												{pkg.license}
											</Text>
										</View>
										<View style={styles.detailText}>
											<View
												style={{
													width: '48%',
												}}
											>
												<Text
													style={{
														color: theme.screen.text,
														fontSize: detailFontSize,
													}}
												>
													Repository
												</Text>
											</View>
											<View
												style={{
													width: '48%',
												}}
											>
												<Text style={{ color: 'blue', textAlign: 'right' }} onPress={() => Linking.openURL(pkg.repository)}>
													{pkg.repository}
												</Text>
											</View>
										</View>
										<View style={styles.detailText}>
											<View
												style={{
													width: '48%',
												}}
											>
												<Text
													style={{
														color: theme.screen.text,
														fontSize: detailFontSize,
													}}
												>
													License URL:
												</Text>
											</View>
											<View
												style={{
													width: '48%',

													justifyContent: 'flex-end',
												}}
											>
												<Text
													style={{
														color: 'blue',
														textAlign: 'right',
													}}
													onPress={() => Linking.openURL(pkg.licenseUrl)}
												>
													{pkg.licenseUrl}
												</Text>
											</View>
										</View>
									</View>
								)}
							</View>
                                                ))}
                                        </View>
                                        <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_license_information} />
                                </View>
                        </ScrollView>
                </View>
        );
};

export default LicenseInformation;
