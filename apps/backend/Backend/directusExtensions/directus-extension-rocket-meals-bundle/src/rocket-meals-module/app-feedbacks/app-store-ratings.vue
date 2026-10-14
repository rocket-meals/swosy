<script setup lang="ts">
/**
 * The current star rating of the app in the App Store and in Google Play: average, stars and
 * number of ratings, one tile per store configured for this customer, each leading to the store page.
 *
 * The tiles wrap on their own: side by side when there is room (above the list on narrow screens),
 * one below the other in the narrow column next to the list (`app-feedbacks-page.vue`). Nothing is
 * shown when no store is configured or the server cannot tell (e.g. an older bundle).
 */
import { useApi } from '@directus/extensions-sdk';
import { onMounted, ref } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { AppStoreRatingsModuleHelper, type AppStoreRating } from '../../helpers/rocket-meals-module/AppStoreRatingsModuleHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const api = useApi();
const { translate, language } = useAppExtensionTranslate();

const ratings = ref<AppStoreRating[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    ratings.value = await AppStoreRatingsModuleHelper.load(api);
  } catch (error) {
    console.error('[rocket-meals-module] loading the store ratings failed', error);
    ratings.value = [];
  } finally {
    loading.value = false;
  }
}

function getCountText(rating: AppStoreRating): string {
  if (rating.error) {
    return translate(BackendTranslationKeys.rocket_meals_module_store_ratings_unavailable);
  }
  if (!rating.count) {
    return translate(BackendTranslationKeys.rocket_meals_module_store_ratings_none);
  }
  return translate(BackendTranslationKeys.rocket_meals_module_store_ratings_count, { count: AppStoreRatingsModuleHelper.formatCount(rating.count, language.value) });
}

onMounted(load);
</script>

<template>
  <section v-if="loading || ratings.length > 0" class="store-ratings" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_store_ratings)">
    <template v-if="loading && ratings.length === 0">
      <v-skeleton-loader v-for="index in 2" :key="index" class="store-rating" type="list-item-icon" />
    </template>
    <component :is="rating.store_url ? 'a' : 'div'" v-for="rating in ratings" :key="rating.store" v-tooltip.bottom="rating.store_url ? translate(BackendTranslationKeys.rocket_meals_module_store_ratings_open) : rating.error" class="store-rating" :href="rating.store_url ?? undefined" target="_blank" rel="noopener noreferrer">
      <div class="store-icon">
        <v-icon :name="AppStoreRatingsModuleHelper.getStoreIcon(rating.store)" />
      </div>
      <div class="store-body">
        <span class="store-name type-note">{{ translate(AppStoreRatingsModuleHelper.getStoreLabelKey(rating.store)) }}</span>
        <span v-if="rating.average !== null" class="store-score">
          <span class="average">{{ AppStoreRatingsModuleHelper.formatAverage(rating.average, language) }}</span>
          <span class="stars" :aria-label="`${rating.average}/${AppStoreRatingsModuleHelper.MAX_STARS}`">
            <span v-for="(fill, index) in AppStoreRatingsModuleHelper.getStarFills(rating.average)" :key="index" class="star">
              <v-icon name="star" small />
              <span class="star-fill" :style="{ inlineSize: `${fill * 100}%` }"><v-icon name="star" filled small /></span>
            </span>
          </span>
        </span>
        <span class="store-count type-note" :class="{ error: rating.error }">{{ getCountText(rating) }}</span>
      </div>
    </component>
  </section>
</template>

<style scoped>
.store-ratings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 11rem: two tiles fit next to each other on a phone, but not in the 16rem column next to the list. */
.store-rating {
  display: flex;
  flex: 1 1 11rem;
  gap: 0.75rem;
  align-items: center;
  min-inline-size: 0;
  padding: 0.5rem 0.75rem;
  color: inherit;
  text-decoration: none;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

a.store-rating:hover {
  border-color: var(--theme--border-color-accent);
}

.store-icon {
  --v-icon-color: var(--theme--foreground-subdued);

  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.store-body {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.store-name,
.store-count {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.store-count.error {
  color: var(--theme--danger);
}

.store-score {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
}

.average {
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.5;
}

.stars {
  display: inline-flex;
}

.star {
  --v-icon-color: var(--theme--foreground-subdued);

  position: relative;
  display: inline-flex;
}

/* The filled star on top, cut off at the share of the star that is reached. */
.star-fill {
  --v-icon-color: #f5b400;

  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  overflow: hidden;
}
</style>
