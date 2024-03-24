import React from 'react';
import {View} from '@/components/Themed'
import {getMyScreenHeaderFunction, MyScreenHeader, MyScreenHeaderProps} from '@/components/drawer/MyScreenHeader';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Divider} from '@gluestack-ui/themed';
import {SettingsButtonSort} from "@/compositions/settings/SettingsButtonSort";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {sortTypesApartments, sortTypesBuildings} from "@/states/SynchedSortType";

const MyScreenHeaderBuildings = ({ ...props }: MyScreenHeaderProps) => {
	const translation_item_to_sort = useTranslation(TranslationKeys.buildings);

	function renderSecondaryHeaderContent(props: any) {
		return (
			<View style={{
				justifyContent: 'flex-end',
				alignItems: 'center',
				flexDirection: 'row',
			}}
			>
				<View style={{
					flexDirection: 'row',
				}}
				>
					<SettingsButtonSort itemToSort={translation_item_to_sort} synchKey={PersistentStore.sortConfigBuildings} availableSortTypes={sortTypesBuildings} />
				</View>
			</View>
		);
	}

	return (
		<View style={{
			width: '100%',
		}}
		>
			<MyScreenHeader hideDivider={true} {...props} custom_renderHeaderDrawerOpposite={renderSecondaryHeaderContent} />
			<Divider />
		</View>
	)
}


export const getMyScreenHeaderBuildings: getMyScreenHeaderFunction = () => {
	return (props: MyScreenHeaderProps) => {
		return <MyScreenHeaderBuildings {...props} />
	}
}
