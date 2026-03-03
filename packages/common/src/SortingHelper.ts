import { StringHelper } from './StringHelper';
import * as DatabaseTypes from 'repo-depkit-common/src/databaseTypes/types';

export type TranslationEntry = {
  languages_code: string;
  [key: string]: any;
};

const DEFAULT_LANGUAGE_CODE_GERMAN = 'de';
const FALLBACK_LANGUAGE_CODE_ENGLISH = 'en';
const MISSING_TRANSLATION = 'Missing translation';

export function getDirectusTranslation(params: any, translations: TranslationEntry[], field: string, ignoreFallbackLanguage?: boolean, fallback_text?: string | null): string {
  const languageCode = params?.languageCode || FALLBACK_LANGUAGE_CODE_ENGLISH;

  const translationDict = translations.reduce(
    (acc, translation) => {
      if (translation.languages_code) {
        acc[translation.languages_code] = translation;
      }
      return acc;
    },
    {} as { [key: string]: TranslationEntry }
  );

  const getTranslation = (dict: { [key: string]: TranslationEntry }, langCode: string | null | undefined, params?: any) => {
    if (!langCode) return null;
    const languageKey = langCode.split('-')[0];
    if (!languageKey) return null;

    const translationEntry = dict[langCode] || dict[languageKey];
    if (!translationEntry) return null;

    let translation = translationEntry[field];
    if (params) {
      Object.keys(params).forEach(key => {
        translation = StringHelper.replaceAllWithOptions({
          str: translation,
          find: `%${key}`,
          replace: params[key],
        });
      });
    }
    return translation;
  };

  let translation = getTranslation(translationDict, languageCode, params);
  if (translation) return translation;

  translation = getTranslation(translationDict, FALLBACK_LANGUAGE_CODE_ENGLISH, params);
  if (translation) return translation;

  if (!ignoreFallbackLanguage) {
    translation = getTranslation(translationDict, DEFAULT_LANGUAGE_CODE_GERMAN, params);
    if (translation) return translation;
  }

  return fallback_text || `${MISSING_TRANSLATION}(${field})`;
}

const MAX_RATING = 5;
const MIN_RATING = 1;
const MINIMUM_RATING_AS_FAVORITE = (MAX_RATING + MIN_RATING) / 2;

export function isRatingPositive(rating: number | null | undefined): boolean {
  return rating !== null && rating !== undefined && rating >= MINIMUM_RATING_AS_FAVORITE;
}

export function isRatingNegative(rating: number | null | undefined): boolean {
  return rating !== null && rating !== undefined && rating < MINIMUM_RATING_AS_FAVORITE;
}

export function getFoodName(food: string | DatabaseTypes.Foods | null | undefined, languageCode: string) {
  if (typeof food === 'object' && food !== null) {
    const translations = food.translations as TranslationEntry[];
    const translation = getDirectusTranslation({ languageCode }, translations, 'name', false, (food as any).alias);
    if (translation) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    if ((food as any)?.alias) {
      return (food as any).alias.charAt(0).toUpperCase() + (food as any).alias.slice(1);
    }
  }
  return null;
}

export const normalizeSort = (value: any): number => {
  return value === undefined || value === null || value === '' ? Infinity : value;
};

export const sortBySortField = <T extends { sort?: number | null }>(items: T[]): T[] => {
  const withSort: T[] = [];
  const withoutSort: T[] = [];

  for (const item of items) {
    if (item.sort === undefined || item.sort === null) {
      withoutSort.push(item);
    } else {
      withSort.push(item);
    }
  }

  withSort.sort((a, b) => (a.sort! as number) - (b.sort! as number));

  const result = [...withSort, ...withoutSort];
  return result;
};

export function sortByFoodName(foodOffers: DatabaseTypes.Foodoffers[], languageCode: string) {
  foodOffers.sort((a, b) => {
    let nameA = getFoodName(a.food, languageCode);
    let nameB = getFoodName(b.food, languageCode);
    if (nameA && nameB) {
      return nameA.localeCompare(nameB);
    } else if (nameA) {
      return -1;
    } else if (nameB) {
      return 1;
    }
  });
  return foodOffers;
}

export function sortByFoodCategory(foodOffers: DatabaseTypes.Foodoffers[], categories: DatabaseTypes.FoodsCategories[], languageCode: string) {
  sortByFoodName(foodOffers, languageCode);
  sortByFoodCategoryOnly(foodOffers, categories);
  return foodOffers;
}

export function sortByFoodCategoryOnly(foodOffers: DatabaseTypes.Foodoffers[], categories: DatabaseTypes.FoodsCategories[]) {
  const sortMap = new Map<string, number>();
  categories.forEach(cat => {
    if (cat.id) {
      sortMap.set(cat.id, normalizeSort(cat.sort));
    }
  });

  foodOffers = foodOffers.sort((a, b) => {
    const aId = typeof (a.food as any)?.food_category === 'object' ? (a.food as any)?.food_category?.id : (a.food as any)?.food_category;
    const bId = typeof (b.food as any)?.food_category === 'object' ? (b.food as any)?.food_category?.id : (b.food as any)?.food_category;

    const aSort = sortMap.has(aId as string) ? (sortMap.get(aId as string) as number) : Infinity;
    const bSort = sortMap.has(bId as string) ? (sortMap.get(bId as string) as number) : Infinity;
    return aSort - bSort;
  });
  return foodOffers;
}

export function sortByFoodOfferCategory(foodOffers: DatabaseTypes.Foodoffers[], categories: DatabaseTypes.FoodoffersCategories[], languageCode: string) {
  sortByFoodName(foodOffers, languageCode);
  sortByFoodOfferCategoryOnly(foodOffers, categories);
  return foodOffers;
}

export function sortByFoodOfferCategoryOnly(foodOffers: DatabaseTypes.Foodoffers[], categories: DatabaseTypes.FoodoffersCategories[]) {
  const sortMap = new Map<string, number>();
  categories.forEach(cat => {
    if (cat.id) {
      sortMap.set(cat.id, normalizeSort(cat.sort));
    }
  });

  foodOffers = foodOffers.sort((a, b) => {
    const aId = typeof a.foodoffer_category === 'object' ? (a.foodoffer_category as any)?.id : a.foodoffer_category;
    const bId = typeof b.foodoffer_category === 'object' ? (b.foodoffer_category as any)?.id : b.foodoffer_category;

    const aSort = sortMap.has(aId as string) ? (sortMap.get(aId as string) as number) : Infinity;
    const bSort = sortMap.has(bId as string) ? (sortMap.get(bId as string) as number) : Infinity;
    return aSort - bSort;
  });
  return foodOffers;
}

// Working Own Favorite Sorting
export function sortByOwnFavorite(foodOffers: DatabaseTypes.Foodoffers[], ownFeedBacks: any) {
  const feedbackMap = new Map(ownFeedBacks.map((feedback: any) => [feedback.food, feedback.rating]));
  const getFoodId = (food: string | DatabaseTypes.Foods | null | undefined): string | undefined => {
    if (typeof food === 'object' && food !== null) {
      return (food as DatabaseTypes.Foods).id;
    }
    return food ?? undefined;
  };
  foodOffers = foodOffers.sort((a, b) => {
    const aRating = feedbackMap.get(getFoodId(a.food)) ?? null;
    const bRating = feedbackMap.get(getFoodId(b.food)) ?? null;

    const getCategory = (rating: any) => {
      if (isRatingNegative(rating)) return 3;
      if (rating === null || rating === undefined) return 2;
      if (isRatingPositive(rating)) return 1;
      return 0;
    };

    const aCategory = getCategory(aRating);
    const bCategory = getCategory(bRating);

    return aCategory - bCategory;
  });

  return foodOffers;
}

export function sortByPublicFavorite(foodOffers: DatabaseTypes.Foodoffers[]) {
  foodOffers.sort((a, b) => {
    const aFood = (typeof a.food === 'object' && a.food !== null ? a.food : {}) as DatabaseTypes.Foods;
    const bFood = (typeof b.food === 'object' && b.food !== null ? b.food : {}) as DatabaseTypes.Foods;
    const getRatingCategory = (rating: number | null | undefined) => {
      if (isRatingNegative(rating)) return 'negative';
      if (rating === null || rating === undefined) return 'null';
      if (isRatingPositive(rating)) return 'positive';
      return 'unknown'; // Fallback for unexpected cases
    };

    const aCategory = getRatingCategory(aFood?.rating_average);
    const bCategory = getRatingCategory(bFood?.rating_average);

    const priorityOrder = ['positive', 'unknown', 'null', 'negative'];

    const aPriority = priorityOrder.indexOf(aCategory);
    const bPriority = priorityOrder.indexOf(bCategory);

    return aPriority - bPriority;
  });


  return foodOffers;
}

export function sortByPrice(foodOffers: DatabaseTypes.Foodoffers[], priceGroup?: string, descending = false) {

  foodOffers.sort((a, b) => {
    const getPrice = (offer: DatabaseTypes.Foodoffers) => {
      return priceGroup === 'guest' ? (offer?.price_guest ?? 0) : priceGroup === 'employee' ? (offer?.price_employee ?? 0) : (offer?.price_student ?? 0);
    };

    const priceA = getPrice(a);
    const priceB = getPrice(b);

    return descending ? priceB - priceA : priceA - priceB;
  });

  return foodOffers;
}

export function sortByEatingHabits(foodOffers: DatabaseTypes.Foodoffers[], profileMarkingsData: any) {

  const profileMarkingsMap = new Map<string, any>(profileMarkingsData?.map((marking: any) => [marking.markings_id, marking]));

  const liked: DatabaseTypes.Foodoffers[] = [];
  const disliked: DatabaseTypes.Foodoffers[] = [];
  const neutral: DatabaseTypes.Foodoffers[] = [];

  for (const offer of foodOffers) {
    let isLiked = false;
    let isDisliked = false;

    if (offer?.markings) {
      for (const marking of offer.markings) {
        const profileMarking: any = profileMarkingsMap.get(marking.markings_id);

        if (profileMarking) {
          if (profileMarking.like === true) {
            isLiked = true;
          } else if (profileMarking.like === false) {
            isDisliked = true;
          }
        }
      }
    }

    if (isDisliked) {
      disliked.push(offer);
    } else if (isLiked) {
      liked.push(offer);
    } else {
      neutral.push(offer);
    }
  }

  const sorted = [...liked, ...neutral, ...disliked];
  return sorted;
}

export function sortMarkingsByGroup(markings: DatabaseTypes.Markings[], markingGroups: DatabaseTypes.MarkingsGroups[]): DatabaseTypes.Markings[] {
  if (!markings || !markingGroups) {
    return markings || [];
  }
  const sortedGroups = sortBySortField(markingGroups);
  const markingToGroupMap = new Map<string, DatabaseTypes.MarkingsGroups>();
  sortedGroups.forEach(group => {
    group.markings.forEach(markingId => {
      if (typeof markingId === 'string') {
        markingToGroupMap.set(markingId, group);
      } else if (markingId && typeof markingId === 'object') {
        markingToGroupMap.set((markingId as DatabaseTypes.Markings).id, group);
      }
    });
  });

  const getGroupSort = (marking: DatabaseTypes.Markings): number => {
    const group = markingToGroupMap.get(marking.id);
    return normalizeSort(group?.sort);
  };

  const getMarkingSort = (marking: DatabaseTypes.Markings): number => {
    return normalizeSort(marking.sort);
  };

  return [...markings].sort((a, b) => {
    const groupSortA = getGroupSort(a);
    const groupSortB = getGroupSort(b);

    if (groupSortA !== groupSortB) {
      return groupSortA - groupSortB;
    }

    const markingSortA = getMarkingSort(a);
    const markingSortB = getMarkingSort(b);

    if (markingSortA !== markingSortB) {
      return markingSortA - markingSortB;
    }

    return (a.alias || '').localeCompare(b.alias || '');
  });
}

export function intelligentSort(foodOffers: DatabaseTypes.Foodoffers[], ownFeedbacks: any[], profileMarkings: any[], languageCode: string, foodCategories: DatabaseTypes.FoodsCategories[] = [], foodOfferCategories: DatabaseTypes.FoodoffersCategories[] = []) {
  foodOffers = sortByFoodName(foodOffers, languageCode);
  foodOffers = sortByPublicFavorite(foodOffers);
  foodOffers = sortByFoodOfferCategoryOnly(foodOffers, foodOfferCategories);
  foodOffers = sortByFoodCategoryOnly(foodOffers, foodCategories);
  foodOffers = sortByOwnFavorite(foodOffers, ownFeedbacks);
  foodOffers = sortByEatingHabits(foodOffers, profileMarkings);
  return foodOffers;
}
