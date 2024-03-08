import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {Heading, Icon, Text, View} from "@/components/Themed";
import {DirectusImage} from "@/components/project/DirectusImage";

import { Rectangle } from "@/components/shapes/Rectangle";
import React, {useEffect, useState} from "react";
import {loadFoodOfferFromServer} from "@/states/SynchedFoodOfferStates";
import {MyButton} from "@/components/buttons/MyButton";
import TabWrapper from "@/components/tab/TabWrapper";
import {IconNames} from "@/constants/IconNames";
import {RatingType, RatingValueIcon} from "@/components/rating/RatingValueIcon";
import {FoodRatingDisplay} from "@/components/rating/FoodRatingDisplay";
import {useSynchedProfileFoodFeedback, useSynchedProfileFoodFeedbacksDict} from "@/states/SynchedProfile";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export const FoodFeedbackDetails = ({foodId}: {foodId:  string | Foods}) => {

  const usedFoodId = typeof foodId === "string" ? foodId : foodId.id;
  const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(usedFoodId);

  return(
      <View style={{
        width: "100%",

      }}>
        <MyScrollView>
          <Text>{"foodId: "+usedFoodId}</Text>
          <MyButton text={"Create a default comment: 'Tastes good'"}  leftIcon={IconNames.comment_icon} accessibilityLabel={"Comments"} isActive={true} onPress={() => {
            setComment("Tastes good");
          }}/>
          <MyButton text={"Create a default comment: 'Tastes bad'"} leftIcon={IconNames.comment_icon} accessibilityLabel={"Comments"} isActive={true} onPress={() => {
            setComment("Tastes bad");
          }}/>
          <MyButton text={"Remove comment"} leftIcon={IconNames.comment_icon} accessibilityLabel={"Comments"} isActive={true} onPress={() => {
            setComment(null);
          }}/>
          <MyButton text={"Set rating to 5"} leftIcon={"star"}  accessibilityLabel={"Rating"} onPress={() => {
            setRating(5);
          }}/>
          <MyButton text={"Set rating to 1"} leftIcon={"star"}  accessibilityLabel={"Rating"}  onPress={() => {
            setRating(1);
          }}/>
          <MyButton text={"Reset rating"} leftIcon={"star-off"}  accessibilityLabel={"Rating"}  onPress={() => {
            setRating(null);
          }}/>

          <MyButton accessibilityLabel={"Notify"} text={"Notify"} leftIcon={"bell"}  isActive={true} onPress={() => {
            setNotify(true);
          } }/>
          <MyButton accessibilityLabel={"Unnotify"} text={"Unnotify"} leftIcon={"bell-off"} isActive={true} onPress={() => {
            setNotify(false);
          } }/>
          <Text>{"The raw foodFeedback"}</Text>
          <Text>{JSON.stringify(foodFeedback, null, 2)}</Text>
        </MyScrollView>
      </View>
  )
}

export default function FoodDetails({ foodOfferId }: { foodOfferId: string }) {
  const [foodOfferData, setFoodOfferData] = useState<Foodoffers>();

  const foodId = foodOfferData?.food;

  useEffect(() => {
    loadFoodOfferFromServer(foodOfferId)
        .then(setFoodOfferData)
        .catch(console.error);
  }, []);



  return (
      <View style={{ padding: 0 }}>
        { foodOfferData &&
            <>
            { foodId &&
              <FoodFeedbackDetails foodId={foodId} />
            }
                <View style={{width: "100%", display: "flex", flexDirection: "row"}}>
                    <View style={{width: "100%", display: "flex", flexGrow: 1}}>
                        <Rectangle>
                            <DirectusImage assetId={foodOfferData.food.image} image_url={foodOfferData.food.image_remote_url} style={{width: "100%", height: "100%"}}/>
                        </Rectangle>
                    </View>
                </View>

                <View style={{height: 100, padding: 3, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                    <View>
                        <Heading>
                          {foodOfferData.food.alias}
                        </Heading>
                    </View>

                    <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <View style={{ display: "flex", flexDirection: "row", backgroundColor: "blue", width: "50%" }}>
                            {/*<RatingValueIcon ratingType={RatingType.smilies} ratingValue={1} isActive={true}/>*/}
                            <FoodRatingDisplay userRating={3} ratingType={RatingType.smilies} isActive={true}/>
                        </View>
                        <View>
                            <Icon name={"bell"}/>
                        </View>
                    </View>
                </View>

                <View style={{ display: "flex", marginTop: 40, marginHorizontal: 10 }}>
                    <TabWrapper headers={[
                      (active) => <MyButton icon={IconNames.nutrition_icon} centerItems={true} accessibilityLabel={"Nutritions"} isActive={active} onPress={() => {}} borderRightRadius={0}/>,
                      (active) => <MyButton icon={IconNames.eating_habit_icon} centerItems={true} accessibilityLabel={"Markings"} isActive={active} onPress={() => {}} borderLeftRadius={0} borderRightRadius={0}/>,
                      (active) => <MyButton icon={IconNames.comment_icon} centerItems={true} accessibilityLabel={"Comments"} isActive={active} onPress={() => {}} borderLeftRadius={0}/>,
                    ]} contents={[
                        <View>
                            <Text>Nutritions</Text>
                        </View>,
                        <View>
                            <Text>Markings</Text>
                        </View>,
                    ]}/>
                </View>
            </>
        }
      </View>
  )
}