import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useLocalSearchParams} from "expo-router";
import React from "react";
import {useSynchedFoods} from "@/states/SynchedFoods";
import FoodDetails from "@/compositions/fooddetails/FoodDetails";
import {loadFoodOfferFromServer} from "@/states/SynchedFoodOfferStates";

export default function FoodOfferDetails() {
  const { food } = useLocalSearchParams<{ food: string }>();

  return (
      <MySafeAreaView>
        <FoodDetails foodId={food}/>
      </MySafeAreaView>
  )
}