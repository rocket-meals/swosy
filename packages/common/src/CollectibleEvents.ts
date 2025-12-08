import * as DatabaseTypes from './databaseTypes/types';

export enum CollectableAt {
  collectable_at_campus = 'collectable_at_campus',
  collectable_at_canteen_selection = 'collectable_at_canteen_selection',
  collectable_at_faq = 'collectable_at_faq',
  collectable_at_foodoffer_details_markings = 'collectable_at_foodoffer_details_markings',
  collectable_at_foodoffer_details_nutritions = 'collectable_at_foodoffer_details_nutritions',
  collectable_at_foodoffers = 'collectable_at_foodoffers',
  collectable_at_foodoffers_details = 'collectable_at_foodoffers_details',
  collectable_at_housing = 'collectable_at_housing',
  collectable_at_marking_details = 'collectable_at_marking_details',
  collectable_at_price_group_selection = 'collectable_at_price_group_selection',
  collectable_at_settings = 'collectable_at_settings',
}

export const COLLECTABLE_AT_FIELDS: (keyof DatabaseTypes.CollectibleEvents)[] = [
  CollectableAt.collectable_at_campus,
  CollectableAt.collectable_at_canteen_selection,
  CollectableAt.collectable_at_faq,
  CollectableAt.collectable_at_foodoffer_details_markings,
  CollectableAt.collectable_at_foodoffer_details_nutritions,
  CollectableAt.collectable_at_foodoffers,
  CollectableAt.collectable_at_foodoffers_details,
  CollectableAt.collectable_at_housing,
  CollectableAt.collectable_at_marking_details,
  CollectableAt.collectable_at_price_group_selection,
  CollectableAt.collectable_at_settings,
];
