import React, {FunctionComponent, useEffect, useState} from "react";
import {View} from "native-base";
import {useSynchedBuildingsDict} from "../../helper/synchedJSONState";
import {BaseNoPaddingTemplate} from "../../../kitcheningredients";
import {BuildingsListHeader, BuildingsSortType, initialSortType} from "../../components/buildings/BuildingsListHeader";
import {useNearestLocation} from "../../helper/synchedHelper/useNearestLocation";
import {BuildingHelper} from "../../components/buildings/BuildingHelper";
import {useSynchedProfileFavoriteBuildingsDict} from "../../components/profile/FavoriteBuildingsAPI";
import {BuildingsList} from "../../components/buildings/BuildingsList";
import {useSynchedProfileBuildingsLastVisitedDict} from "../../components/profile/ProfilesBuildingsLastVisitedAPI";
import {AnimationSeemsEmpty} from "../../components/animations/AnimationSeemsEmpty";

export const BuildingsScreen: FunctionComponent = (props) => {

	const nearestLocation = useNearestLocation();

	const [profilesBuildingsFavoritesDict, addProfileFavoriteBuilding, removeProfileFavoriteBuilding] = useSynchedProfileFavoriteBuildingsDict();
	const [profilesBuildingsLastVisitedDict, updateProfileLastVisitedBuilding, removeProfileLastVisitedBuilding, getProfileBuildingsLastVisitedDateFromBuildingId] = useSynchedProfileBuildingsLastVisitedDict();

	const [sortBy, setSortBy] = useState(initialSortType);

	const [buildings, setBuildings] = useSynchedBuildingsDict();
	const resources = buildings;

	// corresponding componentDidMount
	useEffect(() => {
	}, [props?.route?.params]);

	function sortBuildings(buildings){
		return sortBuildingsWithSortBy(buildings, sortBy);
	}

	function isFavorite(resource_id){
		return !!profilesBuildingsFavoritesDict[resource_id];
	}

	function compareByDistance(a, b){
		let distanceA = BuildingHelper.getBuildingDistance(a, nearestLocation);
		let distanceB = BuildingHelper.getBuildingDistance(b, nearestLocation);
		return distanceA - distanceB;
	}

	function compareByFavorite(a, b){
		let favoriteA = isFavorite(a?.id) ? 1 : 0;
		let favoriteB = isFavorite(b?.id) ? 1 : 0;
		return favoriteB - favoriteA;
	}

	function compareByLastVisited(a, b){
		let lastVisitedA = getProfileBuildingsLastVisitedDateFromBuildingId(a?.id) || -1;
		let lastVisitedB = getProfileBuildingsLastVisitedDateFromBuildingId(b?.id) || -1;
		return lastVisitedB - lastVisitedA;
	}

	function compareByAlphabetical(a, b){
		let nameA = BuildingHelper.getName(a);
		let nameB = BuildingHelper.getName(b);
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

	function sortBuildingsWithSortBy(buildings, sortBy){
		if(!!buildings && buildings.length > 0){
			if (sortBy === BuildingsSortType.favorites) {
				return buildings.sort((a, b) => {
					return compareByFavorite(a, b);
				});
			}
			if (sortBy === BuildingsSortType.last_visited) {
				return buildings.sort((a, b) => {
					return compareByLastVisited(a, b);
				});
			}
			if (sortBy === BuildingsSortType.alphabetical) {
				return buildings.sort((a, b) => {
					return compareByAlphabetical(a, b);
				});
			} else if (sortBy === BuildingsSortType.distance) {
				return buildings.sort((a, b) => {
					return compareByDistance(a, b);
				});
			}  else if (sortBy === BuildingsSortType.intelligent) {
				return buildings.sort((a, b) => {
					return compareByMultipleComparators(a, b, [compareByFavorite, compareByLastVisited, compareByDistance, compareByAlphabetical]);
				});
			}
		}
		return buildings;
	}

	function renderBuildings(){
		let resourceIds = Object.keys(resources || {});

		if(resourceIds.length===0){
			return <AnimationSeemsEmpty />
		}

		let resourcesArray = resourceIds.map((resource_id) => resources[resource_id]);

		let sortedBuildings = sortBuildings(resourcesArray);
		let sortedResourceIds = sortedBuildings.map((building) => building?.id);

		return (
			<BuildingsList resource_ids={sortedResourceIds} />
		);
	}

	return(
		<View style={{width: "100%", height: "100%"}}>
			<BaseNoPaddingTemplate header={<BuildingsListHeader sortBy={sortBy} setSortBy={setSortBy} route={props?.route} />} route={props?.route} >
				{renderBuildings()}
			</BaseNoPaddingTemplate>
		</View>
	)
}
