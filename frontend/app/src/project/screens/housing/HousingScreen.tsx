import React, {FunctionComponent, useEffect, useState} from "react";
import {View} from "native-base";
import {useSynchedApartmentsDict, useSynchedBuildingsDict} from "../../helper/synchedJSONState";
import {BaseNoPaddingTemplate} from "../../../kitcheningredients";
import {BuildingsListHeader, BuildingsSortType, initialSortType} from "../../components/buildings/BuildingsListHeader";
import {useNearestLocation} from "../../helper/synchedHelper/useNearestLocation";
import {BuildingHelper} from "../../components/buildings/BuildingHelper";
import {useSynchedProfileFavoriteBuildingsDict} from "../../components/profile/FavoriteBuildingsAPI";
import {ApartmentList} from "../../components/housing/ApartmentList";
import {HousingGeneralDescription} from "../../components/housing/HousingGeneralDescription";
import {useSynchedProfileBuildingsLastVisitedDict} from "../../components/profile/ProfilesBuildingsLastVisitedAPI";
import {AnimationSeemsEmpty} from "../../components/animations/AnimationSeemsEmpty";
import {useAppTranslation} from "../../components/translations/AppTranslation";

export const HousingScreen: FunctionComponent = (props) => {

	const nearestLocation = useNearestLocation();
	const [profilesBuildingsFavoritesDict, addProfileFavoriteBuilding, removeProfileFavoriteBuilding] = useSynchedProfileFavoriteBuildingsDict();
	const [profilesBuildingsLastVisitedDict, updateProfileLastVisitedBuilding, removeProfileLastVisitedBuilding, getProfileBuildingsLastVisitedDateFromBuildingId] = useSynchedProfileBuildingsLastVisitedDict();

	const title = useAppTranslation("housing");

	const [sortBy, setSortBy] = useState(initialSortType);

	const [buildings, setBuildings] = useSynchedBuildingsDict();
	const [resources, setResources] = useSynchedApartmentsDict();

	// corresponding componentDidMount
	useEffect(() => {
	}, [props?.route?.params]);

	function sortResources(resources){
		return sortResourcesWithSortBy(resources, sortBy);
	}

	function isFavorite(resource_id){
		const buildingResource = getBuildingFromResourceId(resource_id);
		const buildingResourceId = buildingResource?.id;
		return !!profilesBuildingsFavoritesDict[buildingResourceId];
	}

	function getBuildingFromResourceId(resource_id){
		const resource = resources[resource_id];
		const buildingResourceId = resource?.building;
		return buildings[buildingResourceId];
	}

	function compareByDistance(a, b){
		const buildingA = getBuildingFromResourceId(a?.id);
		const buildingB = getBuildingFromResourceId(b?.id);

		let distanceA = BuildingHelper.getBuildingDistance(buildingA, nearestLocation);
		let distanceB = BuildingHelper.getBuildingDistance(buildingB, nearestLocation);
		return distanceA - distanceB;
	}

	function compareByFavorite(a, b){
		let favoriteA = isFavorite(a?.id) ? 1 : 0;
		let favoriteB = isFavorite(b?.id) ? 1 : 0;
		return favoriteB - favoriteA;
	}

	function compareByAlphabetical(a, b){
		const buildingA = getBuildingFromResourceId(a?.id);
		const buildingB = getBuildingFromResourceId(b?.id);

		let nameA = BuildingHelper.getName(buildingA);
		let nameB = BuildingHelper.getName(buildingB);
		return nameA.localeCompare(nameB);
	}

	function compareByMultipleComparators(a, b, comparators){
		for(let index = 0; index<comparators.length; index++){
			let comparator = comparators[index];
			let result = comparator(a, b);
			if(result !== 0){
				return result;
			}
		}
		return 0;
	}

	function compareByLastVisited(a, b){
		const buildingResourceA = getBuildingFromResourceId(a?.id);
		const buildingResourceAId = buildingResourceA?.id;

		const buildingResourceB = getBuildingFromResourceId(b?.id);
		const buildingResourceBId = buildingResourceB?.id;

		let lastVisitedA = getProfileBuildingsLastVisitedDateFromBuildingId(buildingResourceAId) || -1;
		let lastVisitedB = getProfileBuildingsLastVisitedDateFromBuildingId(buildingResourceBId) || -1;
		return lastVisitedB - lastVisitedA;
	}

	function sortResourcesWithSortBy(resources, sortBy){
		if(!!resources && resources.length > 0){
			if (sortBy === BuildingsSortType.favorites) {
				return resources.sort((a, b) => {
					return compareByFavorite(a, b);
				});
			}
			if (sortBy === BuildingsSortType.last_visited) {
				return resources.sort((a, b) => {
					return compareByLastVisited(a, b);
				});
			}
			if (sortBy === BuildingsSortType.alphabetical) {
				return resources.sort((a, b) => {
					return compareByAlphabetical(a, b);
				});
			} else if (sortBy === BuildingsSortType.distance) {
				return resources.sort((a, b) => {
					return compareByDistance(a, b);
				});
			}  else if (sortBy === BuildingsSortType.intelligent) {
				return resources.sort((a, b) => {
					return compareByMultipleComparators(a, b, [compareByFavorite, compareByLastVisited, compareByDistance, compareByAlphabetical]);
				});
			}
		}
		return resources;
	}

	function renderResources(){
		let resourceIds = Object.keys(resources || {});

		if(resourceIds.length===0){
			return <AnimationSeemsEmpty />
		}

		let resourcesArray = resourceIds.map((resource_id) => resources[resource_id]);

		let sortedResources = sortResources(resourcesArray);
		let sortedResourceIds = sortedResources.map((resource) => resource?.id);

		return (
			<ApartmentList resource_ids={sortedResourceIds} />
		);
	}

	return(
		<View style={{width: "100%", height: "100%"}}>
			<BaseNoPaddingTemplate header={<BuildingsListHeader title={title} sortBy={sortBy} setSortBy={setSortBy} route={props?.route} />} route={props?.route} >
				<HousingGeneralDescription />
				{renderResources()}
			</BaseNoPaddingTemplate>
		</View>
	)
}
