import {Apartments, Buildings, Washingmachines} from '@/helper/database/databaseTypes/types';
import React, {useEffect, useState} from 'react';
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {TabProps} from "@/components/detailsComponent/DetailsComponent";
import {Spinner, Text, View} from "@/components/Themed";
import {loadApartmentWithWashingMachinesFromServer, useSynchedApartmentsDict} from "@/states/SynchedApartments";
import {BuildingDetailsWithObject} from "@/compositions/buildings/BuildingDetails";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";

export default function ApartmentDetails({ apartmentId }: { apartmentId: string }) {
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	const [apartmentsDict, setApartmentsDict] = useSynchedApartmentsDict()
	const apartment = apartmentsDict?.[apartmentId];
	const buildingId = apartment?.building;
	let building = buildingsDict?.[buildingId];

	if(building && typeof building === 'object' && apartment && typeof apartment === 'object'){
		return <ApartmentDetailsWithObject building={building} apartment={apartment} />
	}
}

function Washingmachine({ washingmachine }: { washingmachine: Washingmachines }) {

	const date_finished_string = washingmachine.date_finished;
	const now = new Date();
	const isFinished = date_finished_string && new Date(date_finished_string) < now;
	const isDateFinishedUnknown = !date_finished_string;
	const translation_washingmachine_finished = useTranslation(TranslationKeys.washingmachine_state_finished)
	const translation_washingmachine_running = useTranslation(TranslationKeys.washingmachine_state_running)
	const translation_washingmachine_estimate_finished = useTranslation(TranslationKeys.washingmachine_estimate_finished_at);
	const translation_washingmachine_state_unknown = useTranslation(TranslationKeys.washingmachine_state_unknown)

	let state_text: any = translation_washingmachine_state_unknown
	let substate_text: any = null;

	if(!isDateFinishedUnknown){
		const date_finished = new Date(date_finished_string);
		const minutes_until_finished = DateHelper.formatDateToHHMM(date_finished);
		state_text = isFinished ? translation_washingmachine_finished : translation_washingmachine_running;
		substate_text = isFinished ? null : translation_washingmachine_estimate_finished+": "+minutes_until_finished
	}

	const displayName = washingmachine.alias || washingmachine.id;

	return <View style={{
		width: '100%',
	}}>
		<View>
			<Text>{displayName}</Text>
		</View>
		<View>
			<Text>{state_text}</Text>
		</View>
		<View>
			<Text>{substate_text}</Text>
		</View>
	</View>
}

function ApartmentDetailsWashingMachines({ apartment }: { apartment: Apartments }) {

	const apartment_id = apartment.id

	const [washmashines, setWashmashines] = useState<Washingmachines[] | undefined | null>(undefined)

	async function loadWashmashines() {
		setWashmashines(undefined);
		try{
			let result = await loadApartmentWithWashingMachinesFromServer(apartment_id)
			setWashmashines(result.washingmachines)
		} catch (e) {
			console.error(e)
			setWashmashines(null)
		}
	}

	useEffect(() => {
		// Fetch washing machines
		loadWashmashines()
	}, []);

	if(washmashines === undefined){
		return <Spinner />
	} else if(washmashines === null){
		return <Text>{"Error loading washing machines"}</Text>
	} else {
		let renderedWashingmachines: any[] = [];
		for (let i = 0; i < washmashines.length; i++) {
			const washingmachine = washmashines[i];
			if(!!washingmachine && typeof washingmachine === 'object'){
				renderedWashingmachines.push(<Washingmachine washingmachine={washingmachine} />)
			}
		}
		return <View style={{
			width: '100%',
		}}>{renderedWashingmachines}</View>
	}
}

function ApartmentDetailsWithObject({ apartment, building }: { apartment: Apartments, building: Buildings }) {

	const translation_washing_machines = useTranslation(TranslationKeys.washing_machines)

	let additionalTabs: TabProps[] = [
		{
			iconName: IconNames.washing_machine_icon,
			accessibilityLabel: translation_washing_machines,
			text: translation_washing_machines,
			content: <ApartmentDetailsWashingMachines apartment={apartment} />
		},
	]

	return <BuildingDetailsWithObject building={building} additionalTabs={additionalTabs}  />
}