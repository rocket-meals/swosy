import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {Heading, Icon, Text, View} from "@/components/Themed";
import DirectusImage from "@/components/project/DirectusImage";

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
import {ScrollView} from "react-native";
import {Divider} from "@gluestack-ui/themed";
import PricingBadge from "@/components/pricing/PricingBadge";
import ImageWithComponents from "@/components/project/ImageWithComponents";

export const FoodFeedbackDetails = ({foodId}: {foodId:  string | Foods}) => {

  const usedFoodId = typeof foodId === "string" ? foodId : foodId.id;
  const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(usedFoodId);

  return(
      <View style={{
        width: "100%",

      }}>
        <View>
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
          <Text>{"The raw foodFeedback"}</Text>
          <Text>{JSON.stringify(foodFeedback, null, 2)}</Text>
        </View>
      </View>
  )
}

export default function FoodDetails({ foodOfferId }: { foodOfferId: string }) {
  const [foodOfferData, setFoodOfferData] = useState<Foodoffers>();

  const foodId = foodOfferData?.food;

  const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(foodOfferData?.food.id);

  useEffect(() => {
    loadFoodOfferFromServer(foodOfferId)
        .then(setFoodOfferData)
        .catch(console.error);
  }, []);



  return (
      <View style={{ padding: 0 }}>
        { foodOfferData &&
            <ScrollView>
                <View style={{width: "100%", display: "flex", flexDirection: "row"}}>
                    <View style={{width: "100%", display: "flex", flexGrow: 1}}>
                        <Rectangle>
                            <ImageWithComponents
                                image={{
                                  assetId: foodOfferData.food.image,
                                  image_url: foodOfferData.food.image_remote_url,
                                }}
                                innerPadding={0}
                                bottomRightComponent={
                                  <PricingBadge price={10.50} currency={"€"}/>
                                }
                            />
                        </Rectangle>
                    </View>
                </View>

                <View style={{height: 100, padding: 4, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                    <View>
                        <Heading>
                          {foodOfferData.food.alias}
                        </Heading>
                    </View>

                    <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <View style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "50%" }}>
                            {/*<RatingValueIcon ratingType={RatingType.smilies} ratingValue={1} isActive={true}/>*/}
                            <FoodRatingDisplay userRating={3} ratingType={RatingType.smilies} isActive={true}/>
                        </View>
                        <View>
                          <MyButton useOnlyNecessarySpace={true} useTransparentBackgroundColor={true} useTransparentBorderColor={true} accessibilityLabel={foodFeedback?.notify ? "Unnotify" : "Notify"} icon={foodFeedback?.notify ? "bell" : "bell-off"} onPress={() => {
                            setNotify(!foodFeedback?.notify);
                          }}/>
                        </View>
                    </View>
                </View>

                <Divider/>

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
                        <View>
                          { foodId &&
                              <FoodFeedbackDetails foodId={foodId} />
                          }
                        </View>
                    ]}/>
                </View>
            </ScrollView>
        }
      </View>
  )
}