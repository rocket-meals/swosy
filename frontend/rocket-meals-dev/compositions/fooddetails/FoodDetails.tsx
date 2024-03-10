import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {Heading, Text, View} from "@/components/Themed";

import {Rectangle} from "@/components/shapes/Rectangle";
import React, {useEffect, useState} from "react";
import {loadFoodOfferFromServer} from "@/states/SynchedFoodOfferStates";
import {MyButton} from "@/components/buttons/MyButton";
import TabWrapper from "@/components/tab/TabWrapper";
import {IconNames} from "@/constants/IconNames";
import {RatingType} from "@/components/rating/RatingValueIcon";
import {FoodRatingDisplay} from "@/components/rating/FoodRatingDisplay";
import {useSynchedProfileFoodFeedback} from "@/states/SynchedProfile";
import {ScrollView} from "react-native";
import {Divider} from "@gluestack-ui/themed";
import ImageWithComponents from "@/components/project/ImageWithComponents";
import IndividualPricingBadge from "@/components/pricing/IndividualPricingBadge";
import NutritionList from "@/components/food/NutritionList";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";

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

  const breakPointsAmountOfDaysToShowOnScreen = {
    sm: "100%",
    md: "100%",
    lg: "60%",
    xl: "40%",
  }
  const imageWidthPercentage = useBreakPointValue<string>(breakPointsAmountOfDaysToShowOnScreen)

  useEffect(() => {
    loadFoodOfferFromServer(foodOfferId)
        .then(setFoodOfferData)
        .catch(console.error);
  }, []);

  function renderTapHeader(active: boolean, setActive: () => void, leftRoundedBorder: boolean, rightRoundedBorder: boolean ,iconName: string, accessibilityLabel: string, text: string) {
    let leftBorderRadius = leftRoundedBorder ? undefined : 0;
    let rightBorderRadius = rightRoundedBorder ? undefined : 0;

    return <View style={{width: "100%"}}><MyButton icon={iconName} centerItems={true} text={text} accessibilityLabel={accessibilityLabel} isActive={active} onPress={() => {
            setActive();
      }} borderLeftRadius={leftBorderRadius} borderRightRadius={rightBorderRadius} /></View>
  }

  return (
      <View style={{ padding: 0, width: "100%", height: "100%" }}>
        { foodOfferData &&
            <ScrollView>
                <View style={{width: "100%", display: "flex", flexDirection: "row"}}>
                    <View style={{width: imageWidthPercentage, display: "flex"}}>
                        <Rectangle>
                            <ImageWithComponents
                                image={{
                                  assetId: foodOfferData.food.image,
                                  image_url: foodOfferData.food.image_remote_url,
                                }}
                                innerPadding={0}
                                bottomRightComponent={
                                  <IndividualPricingBadge foodOffer={foodOfferData}/>
                                }
                            />
                        </Rectangle>
                    </View>
                </View>

                <View style={{height: 100, padding: 4, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                    <View>
                        <Heading>
                          {foodOfferData.alias}
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

                <View style={{ display: "flex", marginTop: 10, marginHorizontal: 10 }}>
                    <TabWrapper headers={[
                      (active, setActive) => renderTapHeader(active, setActive, true, false, IconNames.nutrition_icon, "Nutrition", "Nutrition"),
                      (active, setActive) => renderTapHeader(active, setActive, false, false, IconNames.eating_habit_icon, "Markings", "Markings"),
                      (active, setActive) => renderTapHeader(active, setActive, false, true, IconNames.comment_icon, "Comments", "Comments"),
                    ]} contents={[
                        <View>
                          <NutritionList
                            protein_g={foodOfferData.protein_g}
                            fat_g={foodOfferData.fat_g}
                            carbohydrate_g={foodOfferData.carbohydrate_g}
                            fiber_g={foodOfferData.fiber_g}
                            sugar_g={foodOfferData.sugar_g}
                            sodium_g={foodOfferData.sodium_g}
                            calories_kcal={foodOfferData.calories_kcal}
                            saturated_fat_g={foodOfferData.saturated_fat_g}
                          />
                        </View>,
                        <View>
                            <Text>
                              {JSON.stringify(foodOfferData, null, 2)}
                            </Text>
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