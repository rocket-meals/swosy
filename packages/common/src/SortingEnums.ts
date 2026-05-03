export enum FoodSortOption {
  INTELLIGENT = 'intelligent',
  FAVORITE = 'favorite',
  EATING = 'eating',
  FOOD_CATEGORY = 'food_category',
  FOODOFFER_CATEGORY = 'foodoffer_category',
  RATING = 'rating',
  ALPHABETICAL = 'alphabetical',
  PRICE_ASCENDING = 'price_ascending',
  PRICE_DESCENDING = 'price_descending',
  NONE = 'none',
}

export enum CampusSortOption {
  INTELLIGENT = 'intelligent',
  ALPHABETICAL = 'alphabetical',
  DISTANCE = 'distance',
  LAST_OPENED = 'last_opened',
  NONE = 'none',
}

export enum ApartmentSortOption {
  INTELLIGENT = 'intelligent',
  ALPHABETICAL = 'alphabetical',
  DISTANCE = 'distance',
  FREE_ROOMS = 'free rooms',
  LAST_OPENED = 'last_opened',
  NONE = 'none',
}

export type BuildingSortOption = CampusSortOption | ApartmentSortOption;

export function shouldApplyLastOpenedBoost(sortOption: BuildingSortOption): boolean {
  return sortOption === CampusSortOption.INTELLIGENT
    || sortOption === CampusSortOption.LAST_OPENED
    || sortOption === ApartmentSortOption.INTELLIGENT
    || sortOption === ApartmentSortOption.LAST_OPENED;
}
