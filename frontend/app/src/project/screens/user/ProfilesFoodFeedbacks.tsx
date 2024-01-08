// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {View, Text} from "native-base";
import {FoodFeedbackAPI} from "../../components/food/foodfeedback/FoodFeedbackAPI";
import {FoodFeedbackRow} from "../../components/food/foodfeedback/FoodFeedbackRow";
import {NoFeedbackFound} from "../../components/animations/NoFeedbackFound";
import {FoodImageById} from "../../components/food/FoodImageById";
import Rectangle from "../../helper/Rectangle";
import {FoodFeedbackList} from "../../components/food/foodfeedback/FoodFeedbackList";

interface AppState {

}
export const ProfilesFoodFeedbacks: FunctionComponent<AppState> = (props) => {

    const ownFeedbacks = FoodFeedbackAPI.getOwnFeedbacks();
    const amountOfOwnFeedbacks = ownFeedbacks?.length || 0;

    function renderFeedback(feedback){
        const foods_id = feedback?.foods_id;
        const customLeftContent = (
            <View style={{width: 100}}>
                <Rectangle style={{flex: 1}}>
                    <FoodImageById id={foods_id} hideManipulation={true} />
                </Rectangle>
            </View>
        );
        return(
            <View style={{flex: 1, flexDirection: "row"}}>
                <FoodFeedbackRow leftContent={customLeftContent} key={feedback.id} feedback={feedback} navigateToFood={true} />
            </View>
        )
    }

    // corresponding componentDidMount
    useEffect(() => {

    }, [props?.route?.params])

    if(amountOfOwnFeedbacks===0){
        return(
            <View style={{width: "100%"}}>
                <NoFeedbackFound />
            </View>
        )
    }

  return (
      <View style={{width: "100%"}}>
          <FoodFeedbackList feedbacks={ownFeedbacks} customRender={renderFeedback} />
      </View>
  )
}
