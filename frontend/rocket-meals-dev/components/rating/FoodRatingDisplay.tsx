import React, {FunctionComponent} from "react";
import {View} from "react-native";
import {Icon, Text} from "@/components/Themed";
import {FoodRatingConstant} from "@/components/rating/FoodRatingConstant";

export enum RatingType{
  disabled="disabled",
  hearts = "hearts",
  likes = "likes",
  stars= "stars",
  smilies="smilies"
}
export interface AppState{
  userRating?: number,
  text?: any,
  isActive?: boolean,
  ratingType?: RatingType,
}
export const FoodRatingDisplay: FunctionComponent<AppState> = (props) => {

  if(props.userRating === undefined || props.userRating === null){
    return <Icon style={{color: "transparent"}} name={"thumb-up"} />; //render placeholder
  }

  const userRating = props.userRating;
  //const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()
  const foodSettings = {
    ratings_type: 3
  }
  const ratingType = props.ratingType || foodSettings?.ratings_type


  function renderOnlyLikes(){
    let icon = FoodRatingConstant.isRatingAboveAvg(userRating) ? "heart" : "heart-outline";
    return (
        <View style={{flexDirection: "row", width: "100%"}}>
          <Icon name={icon}>{props.text}</Icon>
        </View>
    )
  }

  function renderLikeAndDislike(){
    if(FoodRatingConstant.isRatingAboveAvg(userRating)){
      return(
          <View style={{flexDirection: "row", width: "100%"}}>
            <Icon name={"thumb-up"}>{props.text}</Icon>
          </View>
      )
    } else {
      return (
          <View style={{flexDirection: "row", width: "100%"}}>
            <Icon name={"thumb-down"}>{props.text}</Icon>
          </View>
      )
    }
  }

  function renderSmily(ratingValue: number){
    let smily_5 = "emoticon";
    let smily_4 = "emoticon-happy";
    let smily_3 = "emoticon-neutral";
    let smily_2 = "emoticon-sad";
    let smily_1 = "emoticon-cry";

    let name = "emoticon-cool";

    switch (ratingValue){
      case 5: name = smily_5; break;
      case 4: name = smily_4; break;
      case 3: name = smily_3; break;
      case 2: name = smily_2; break;
      case 1: name = smily_1; break;
    }

    if(!props.isActive){
      name+="-outline";
    }

    return(
        <Icon name={name}>{props?.text}</Icon>
    )
  }

  function renderStar(ratingValue: number){
    let name = "star-outline";
    if(props.isActive){
      name = "star";
    }

    return(
        <Text>
          <Icon name={name}/>
          {props?.text || ratingValue}
        </Text>
    )
  }

  function renderRatingType(){
    switch (ratingType){
      case RatingType.disabled: return null;
      case RatingType.hearts: return renderOnlyLikes();
      case RatingType.likes: return renderLikeAndDislike();
      case RatingType.stars: return renderStar(userRating);
      case RatingType.smilies: return renderSmily(userRating);
      default: return null
    }
  }

  return renderRatingType()
}