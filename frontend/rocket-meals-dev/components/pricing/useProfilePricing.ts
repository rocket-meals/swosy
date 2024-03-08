import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useSynchedProfile} from "@/states/SynchedProfile";

export default function useProfilePricing(foodOfferData: Foodoffers | undefined) {
  const [profileData] = useSynchedProfile();

  let price = foodOfferData?.price_student;
  switch (profileData?.price_group) {
    case "student":
      price = foodOfferData?.price_student;
      break;
    case "employee":
      price = foodOfferData?.price_employee;
      break;
    case "guest":
      price = foodOfferData?.price_guest;
      break;
  }

  return price;
}