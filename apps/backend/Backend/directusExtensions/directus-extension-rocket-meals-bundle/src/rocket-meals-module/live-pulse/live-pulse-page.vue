<script setup lang="ts">
/**
 * Page "Live-Puls": meant to stay open on a second screen during the day. Shows the profiles that
 * are active right now or were a few minutes ago with their avatars, a ticker of what is happening in the app and a chart of the
 * active users per hour. Reloads every 30 seconds; the data rules live in `LivePulseHelper`.
 *
 * The ticker does not jump: what arrives with a refresh is queued and slides in entry by entry,
 * spread over the time until the next refresh. A new entry is rendered above the visible part of the
 * ticker and the whole list glides down to reveal it. What the ticker shows can be filtered (checkbox
 * tree in the panel header), the choice is remembered per browser.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { LivePulseFeedType, LivePulseHelper, LivePulsePresence, type LivePulseCanteenVisit, type LivePulseFeedItem, type LivePulseFood, type LivePulseFoodFeedback, type LivePulseProfile, type LivePulseQuery, type LivePulseUsageEvent } from '../../helpers/rocket-meals-module/LivePulseHelper';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from '../food-feedbacks/food-feedback-rating.vue';

const api = useApi();
const { useServerStore } = useStores();
const serverStore = useServerStore();
const { translate, language } = useAppExtensionTranslate();

const page = RocketMealsModulePages.LIVE_PULSE;

type Kpi = { key: string; value: number | undefined; label: string };

/**
 * Developer switch: mixes a few made-up app usage events into the ticker on every refresh, to try
 * the animation and the filter without real traffic. Nothing is written anywhere. Keep it `false`.
 */
const MOCK_USAGE_EVENTS = false;
const MOCK_EVENTS_PER_REFRESH = 4;
let mockUsageEvents: LivePulseUsageEvent[] = [];
let mockRefreshCount = 0;

/** How long the ticker glides down to reveal a new entry. Shorter than the smallest pause between two entries. */
const FEED_SLIDE_MS = 650;
const FEED_SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** The ticker filter is remembered per browser, so the page opens again as it was left. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('live-pulse');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<{ hiddenFeedFilterKeys: string[] }>(settingsStorage, SETTINGS_STORAGE_KEY);

const now = ref(new Date());
const loading = ref(false);
const loadError = ref(false);
const lastLoaded = ref<Date | undefined>();
const profiles = ref<LivePulseProfile[]>([]);
const feed = ref<LivePulseFeedItem[]>([]);
const activeNow = ref<number | undefined>();
const activeToday = ref<number | undefined>();
const newProfilesToday = ref<number | undefined>();
const feedbacksToday = ref<number | undefined>();
const foodViewsToday = ref<number | undefined>();
/** Distinct active users per hour of today, index = hour. Past hours are kept, only the current one is reloaded. */
const hourly = ref<number[]>([]);
const hourlyDay = ref<string | undefined>();
/** Ticker entries that slid in while the page is open – highlighted briefly. */
const freshKeys = ref<Set<string>>(new Set());
/** Food offers of the ticker that still exist – the others link to their food instead. */
const existingFoodofferIds = ref<Set<string>>(new Set());
/** New ticker entries waiting to slide in, oldest first. */
let pendingFeed: LivePulseFeedItem[] = [];
let revealTimer: ReturnType<typeof setTimeout> | undefined;
/** Set when the filter changed: the next load replaces the ticker at once instead of sliding entries in. */
let replaceFeedOnNextLoad = false;
/** A reload was asked for while one was running – it runs right after. */
let reloadRequested = false;
const feedScroll = ref<HTMLElement>();
const feedList = ref<HTMLElement>();

/** Kinds of entries the ticker filter hides (the hidden ones are stored, so new kinds show up). */
const hiddenFeedFilterKeys = ref<Set<string>>(LivePulseHelper.readHiddenFeedFilterKeys(storedSettings.hiddenFeedFilterKeys));
const feedFilterChoices = computed(() => LivePulseHelper.getFeedFilterChoices(translate));
const shownFeedFilterKeys = computed<string[]>({
  get: () => LivePulseHelper.getShownFeedFilterKeys(hiddenFeedFilterKeys.value),
  set: shown => {
    hiddenFeedFilterKeys.value = new Set(LivePulseHelper.getHiddenFeedFilterKeys(shown));
  },
});
const feedFilterActive = computed(() => hiddenFeedFilterKeys.value.size > 0);
const feedFilterHidesAll = computed(() => LivePulseHelper.getShownFeedFilterKeys(hiddenFeedFilterKeys.value).length === 0);

watch(hiddenFeedFilterKeys, hidden => {
  ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { hiddenFeedFilterKeys: [...hidden] });
  // What is hidden now goes at once, what is shown again comes with the reload – without sliding in one by one.
  feed.value = feed.value.filter(item => LivePulseHelper.isFeedItemShown(item, hidden));
  pendingFeed = [];
  clearTimeout(revealTimer);
  revealTimer = undefined;
  replaceFeedOnNextLoad = true;
  void reload();
});

async function getItems<T>(endpoint: string, params: LivePulseQuery): Promise<T[]> {
  const response = await api.get(endpoint, { params });
  return (response.data?.data ?? []) as T[];
}

async function getAggregate(endpoint: string, params: LivePulseQuery, aggregate: 'count' | 'countDistinct', field: string): Promise<number | undefined> {
  try {
    const response = await api.get(endpoint, { params });
    return LivePulseHelper.readAggregate(response.data?.data, aggregate, field);
  } catch {
    // e.g. no read permission on one source – that tile just stays empty.
    return undefined;
  }
}

async function getItemsOrEmpty<T>(endpoint: string, params: LivePulseQuery): Promise<T[]> {
  try {
    return await getItems<T>(endpoint, params);
  } catch {
    return [];
  }
}

async function loadKpis(time: Date) {
  const startOfDay = LivePulseHelper.getStartOfDay(time);
  const [recent, today, created, feedbacks, foodViews] = await Promise.all([getAggregate(LivePulseHelper.PROFILES_ENDPOINT, LivePulseHelper.buildCountQuery(LivePulseHelper.buildProfilesActiveSinceFilter(LivePulseHelper.minutesBefore(time, LivePulseHelper.ONLINE_MINUTES))), 'count', 'id'), getAggregate(LivePulseHelper.PROFILES_ENDPOINT, LivePulseHelper.buildCountQuery(LivePulseHelper.buildProfilesActiveSinceFilter(startOfDay)), 'count', 'id'), getAggregate(LivePulseHelper.PROFILES_ENDPOINT, LivePulseHelper.buildCountQuery(LivePulseHelper.buildCreatedSinceFilter(startOfDay)), 'count', 'id'), getAggregate(LivePulseHelper.FOOD_FEEDBACKS_ENDPOINT, LivePulseHelper.buildCountQuery(LivePulseHelper.buildCreatedSinceFilter(startOfDay)), 'count', 'id'), getAggregate(LivePulseHelper.APP_USAGE_EVENTS_ENDPOINT, LivePulseHelper.buildFoodViewsTodayQuery(time), 'count', 'id')]);
  activeNow.value = recent;
  activeToday.value = today;
  newProfilesToday.value = created;
  feedbacksToday.value = feedbacks;
  foodViewsToday.value = foodViews;
}

/** A ticker source, skipped when the filter hides every kind of entry it delivers. */
function loadFeedSource<T>(filterKeys: readonly string[], endpoint: string, params: LivePulseQuery): Promise<T[]> {
  return LivePulseHelper.isAnyFeedFilterKeyShown(filterKeys, hiddenFeedFilterKeys.value) ? getItemsOrEmpty<T>(endpoint, params) : Promise.resolve([]);
}

/** The made-up events of `MOCK_USAGE_EVENTS`: a few new ones per refresh, the older ones stay. */
function getMockUsageEvents(time: Date): LivePulseUsageEvent[] {
  if (!MOCK_USAGE_EVENTS) {
    return [];
  }
  mockRefreshCount += 1;
  mockUsageEvents = [...LivePulseHelper.buildMockUsageEvents(time, MOCK_EVENTS_PER_REFRESH, mockRefreshCount), ...mockUsageEvents].slice(0, LivePulseHelper.FEED_LIMIT);
  return mockUsageEvents;
}

async function loadFeed(time: Date) {
  const hidden = hiddenFeedFilterKeys.value;
  const [foodFeedbacks, canteenVisits, newProfiles, loadedUsageEvents] = await Promise.all([loadFeedSource<LivePulseFoodFeedback>([LivePulseFeedType.RATING, LivePulseFeedType.COMMENT], LivePulseHelper.FOOD_FEEDBACKS_ENDPOINT, LivePulseHelper.buildFoodFeedbacksQuery(time)), loadFeedSource<LivePulseCanteenVisit>([LivePulseFeedType.CANTEEN_VISIT], LivePulseHelper.CANTEEN_VISITS_ENDPOINT, LivePulseHelper.buildCanteenVisitsQuery(time)), loadFeedSource<LivePulseProfile>([LivePulseFeedType.NEW_PROFILE], LivePulseHelper.PROFILES_ENDPOINT, LivePulseHelper.buildNewProfilesQuery(time)), loadFeedSource<LivePulseUsageEvent>(LivePulseHelper.getUsageEventFeedFilterKeys(), LivePulseHelper.APP_USAGE_EVENTS_ENDPOINT, LivePulseHelper.buildUsageEventsQuery(time, hidden))]);
  const usageEvents = [...getMockUsageEvents(time), ...loadedUsageEvents];
  const foodsQuery = LivePulseHelper.buildFoodsQuery(LivePulseHelper.getUsageEventFoodIds(usageEvents));
  const foods = foodsQuery ? await getItemsOrEmpty<LivePulseFood>(LivePulseHelper.FOODS_ENDPOINT, foodsQuery) : [];
  const next = LivePulseHelper.buildFeed({ foodFeedbacks, canteenVisits, newProfiles, usageEvents, foods }, hidden);
  await loadExistingFoodoffers([...next, ...feed.value, ...pendingFeed]);
  // On the first load (and after a filter change) everything is there at once – only what arrives while the page is open slides in.
  if (replaceFeedOnNextLoad || (feed.value.length === 0 && pendingFeed.length === 0)) {
    replaceFeedOnNextLoad = false;
    feed.value = next;
    return;
  }
  const known = new Set([...feed.value, ...pendingFeed].map(item => item.key));
  // More than fits into the ticker would only slide through unseen – keep the newest.
  pendingFeed = [...pendingFeed, ...LivePulseHelper.findNewFeedItems(next, known)].slice(-LivePulseHelper.FEED_LIMIT);
  if (!revealTimer) {
    revealNext();
  }
}

async function loadExistingFoodoffers(items: LivePulseFeedItem[]) {
  const query = LivePulseHelper.buildExistingFoodoffersQuery(LivePulseHelper.getFeedFoodofferIds(items));
  const foodoffers = query ? await getItemsOrEmpty<{ id: string }>(LivePulseHelper.FOODOFFERS_ENDPOINT, query) : [];
  existingFoodofferIds.value = new Set(foodoffers.map(foodoffer => String(foodoffer.id)));
}

/** Slides the oldest queued entry in on top and plans the next one. */
async function revealNext() {
  revealTimer = undefined;
  const item = pendingFeed.shift();
  if (!item) {
    return;
  }
  // Someone scrolled down to read: the entries they look at must not move under them.
  const readerAtTop = (feedScroll.value?.scrollTop ?? 0) <= 2;
  // A changed rating replaces its old entry instead of standing in the ticker twice.
  feed.value = [item, ...feed.value.filter(entry => entry.sourceKey !== item.sourceKey)].slice(0, LivePulseHelper.FEED_LIMIT);
  freshKeys.value = new Set([...freshKeys.value, item.key].filter(key => feed.value.some(entry => entry.key === key)));
  if (pendingFeed.length > 0) {
    revealTimer = setTimeout(revealNext, LivePulseHelper.getRevealDelayMs(pendingFeed.length));
  }
  await nextTick();
  slideNewEntryIn(readerAtTop);
}

/**
 * The new entry is already at the top of the list. The whole list is shifted up by its height, so
 * the entry sits above the visible part of the ticker, and glides back down – one movement of the
 * list instead of entries popping up. While the reader is scrolled down the scroll position grows by
 * the same height instead, nothing they read moves.
 */
function slideNewEntryIn(readerAtTop: boolean) {
  const list = feedList.value;
  const first = list?.firstElementChild as HTMLElement | null | undefined;
  if (!list || !first) {
    return;
  }
  const gap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
  const shift = first.offsetHeight + gap;
  if (!readerAtTop) {
    if (feedScroll.value) {
      feedScroll.value.scrollTop += shift;
    }
    return;
  }
  if (typeof list.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  list.animate([{ transform: `translateY(${-shift}px)` }, { transform: 'translateY(0)' }], { duration: FEED_SLIDE_MS, easing: FEED_SLIDE_EASING });
}

async function loadHourly(time: Date) {
  const day = LivePulseHelper.getStartOfDay(time).toISOString();
  const buckets = LivePulseHelper.getHourBuckets(time);
  const keep = hourlyDay.value === day ? hourly.value : [];
  // Finished hours do not change any more: only load what is missing plus the current hour.
  const toLoad = buckets.map((bucket, hour) => ({ bucket, hour })).filter(({ hour }) => hour >= keep.length - 1 || keep[hour] === undefined);
  const values = await Promise.all(toLoad.map(({ bucket }) => getAggregate(LivePulseHelper.ACTIVITY_ENDPOINT, LivePulseHelper.buildActivityHourQuery(bucket.start, bucket.end), 'countDistinct', 'user')));
  const next = buckets.map((_, hour) => keep[hour] ?? 0);
  toLoad.forEach(({ hour }, index) => {
    next[hour] = values[index] ?? 0;
  });
  hourly.value = next;
  hourlyDay.value = day;
}

async function reload() {
  if (loading.value) {
    reloadRequested = true;
    return;
  }
  loading.value = true;
  const time = new Date();
  now.value = time;
  try {
    profiles.value = LivePulseHelper.sortProfilesForWall(await getItems<LivePulseProfile>(LivePulseHelper.PROFILES_ENDPOINT, LivePulseHelper.buildActiveProfilesQuery(time)), time);
    await Promise.all([loadKpis(time), loadFeed(time), loadHourly(time)]);
    loadError.value = false;
    lastLoaded.value = time;
  } catch (error) {
    console.error('[rocket-meals-module] loading live pulse failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
    if (reloadRequested) {
      reloadRequested = false;
      void reload();
    }
  }
}

const apiRoot = String(api.defaults?.baseURL ?? '/');

/** Default avatar (`LivePulseHelper.showsSilhouette`) in the project color, drawn by `profile-avatar-endpoint`. */
function silhouetteUrl(size: number): string {
  return LivePulseHelper.getSilhouetteAvatarUrl(size, serverStore.info?.project?.project_color, apiRoot);
}

/** Profiles whose avatar the endpoint could not draw (e.g. an unknown style) – they get initials instead. */
const failedAvatars = ref<Set<string>>(new Set());

/** Drawn by `profile-avatar-endpoint`: DiceBear stays out of the app bundle that every Directus page loads. */
function avatarUrl(profile: LivePulseProfile | undefined, size: number): string | undefined {
  if (!profile || failedAvatars.value.has(profile.id)) {
    return undefined;
  }
  return LivePulseHelper.getAvatarUrl(profile, size, apiRoot);
}

function onAvatarError(profile: LivePulseProfile | undefined) {
  if (profile) {
    failedAvatars.value = new Set([...failedAvatars.value, profile.id]);
  }
}

/** Food images that could not be loaded – the entry falls back to its icon. */
const failedFoodImages = ref<Set<string>>(new Set());

function foodImageUrl(item: LivePulseFeedItem): string | undefined {
  if (!item.food || failedFoodImages.value.has(item.food.id)) {
    return undefined;
  }
  return LivePulseHelper.getFoodImageUrl(item.food, apiRoot);
}

function onFoodImageError(item: LivePulseFeedItem) {
  if (item.food) {
    failedFoodImages.value = new Set([...failedFoodImages.value, item.food.id]);
  }
}

function getNickname(profile: LivePulseProfile | undefined): string {
  return profile?.nickname?.trim() || translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname);
}

function relative(date: string | null | undefined): string {
  return LivePulseHelper.formatRelativeTime(date, now.value, language.value);
}

function presenceOf(profile: LivePulseProfile): LivePulsePresence {
  return LivePulseHelper.getPresence(profile.date_updated, now.value);
}

function formatVisitDate(date: string | null | undefined): string {
  if (!date) {
    return '';
  }
  const [year, month, day] = date.split('-').map(part => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return date;
  }
  return new Intl.DateTimeFormat(language.value, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
}

/** Stands in for the linked name (food, building, marking) while translating, so it can be cut out and rendered as a link. */
const LINK_MARKER = '\uE000';

/** Anonymous usage events of a single action: shown as "someone", not as an anonymous session. */
const ANONYMOUS_FEED_TYPES: ReadonlySet<LivePulseFeedType> = new Set([LivePulseFeedType.FOOD_OPENED, LivePulseFeedType.SCREEN_OPENED, LivePulseFeedType.BUILDING_OPENED, LivePulseFeedType.MARKING_OPENED]);

/** The name rendered as link: the building or marking of the entry, else its food. */
function linkName(item: LivePulseFeedItem): string {
  switch (item.type) {
    case LivePulseFeedType.BUILDING_OPENED:
      return item.buildingName ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_unknown_building);
    case LivePulseFeedType.MARKING_OPENED:
      return item.markingName ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_unknown_marking);
    default:
      return item.foodName ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_unknown_food);
  }
}

function foodRoute(item: LivePulseFeedItem): string | undefined {
  return LivePulseHelper.getFoodRoute(item, existingFoodofferIds.value);
}

function linkRoute(item: LivePulseFeedItem): string | undefined {
  return LivePulseHelper.getLinkRoute(item, existingFoodofferIds.value);
}

/** The ticker text around the linked name; `found` is false for entries without one. */
function feedTextParts(item: LivePulseFeedItem): { before: string; after: string; found: boolean } {
  return LivePulseHelper.splitAtMarker(feedText(item, LINK_MARKER), LINK_MARKER);
}

function feedText(item: LivePulseFeedItem, food: string): string {
  const screenLabelKey = LivePulseHelper.getScreenLabelKey(item.eventName);
  switch (item.type) {
    case LivePulseFeedType.RATING:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_rated, { food });
    case LivePulseFeedType.COMMENT:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_commented, { food });
    case LivePulseFeedType.CANTEEN_VISIT:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_canteen_visit, {
        canteen: item.canteenName ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_unknown_canteen),
      });
    case LivePulseFeedType.NEW_PROFILE:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_new_profile);
    case LivePulseFeedType.FOOD_OPENED:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_food_opened, { food });
    case LivePulseFeedType.BUILDING_OPENED:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_building_opened, { building: food });
    case LivePulseFeedType.MARKING_OPENED:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_marking_opened, { marking: food });
    case LivePulseFeedType.SCREEN_OPENED:
      if (screenLabelKey) {
        return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_screen_opened, { screen: translate(screenLabelKey) });
      }
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_usage_event, { event: [item.eventName, item.screenName].filter(Boolean).join(' · ') });
    default:
      return translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_usage_event, { event: [item.eventName, item.screenName].filter(Boolean).join(' · ') });
  }
}

function feedIcon(item: LivePulseFeedItem): string {
  switch (item.type) {
    case LivePulseFeedType.RATING:
      return 'star';
    case LivePulseFeedType.COMMENT:
      return 'chat_bubble';
    case LivePulseFeedType.CANTEEN_VISIT:
      return 'restaurant';
    case LivePulseFeedType.NEW_PROFILE:
      return 'waving_hand';
    case LivePulseFeedType.FOOD_OPENED:
      return 'visibility';
    case LivePulseFeedType.SCREEN_OPENED:
      return 'smartphone';
    case LivePulseFeedType.BUILDING_OPENED:
      return 'apartment';
    case LivePulseFeedType.MARKING_OPENED:
      return 'label';
    default:
      return 'touch_app';
  }
}

const kpis = computed<Kpi[]>(() => [
  { key: 'now', value: activeNow.value, label: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_active_now, { minutes: LivePulseHelper.ONLINE_MINUTES }) },
  { key: 'today', value: activeToday.value, label: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_active_today) },
  { key: 'new', value: newProfilesToday.value, label: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_new_profiles_today) },
  { key: 'food-views', value: foodViewsToday.value, label: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_food_views_today) },
  { key: 'feedbacks', value: feedbacksToday.value, label: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feedbacks_today) },
]);

const updatedLabel = computed(() => (lastLoaded.value ? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_updated_at, { time: new Intl.DateTimeFormat(language.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastLoaded.value) }) : ''));

/** Chart geometry: 24 bars, the hours still to come stay as empty slots so the day reads left to right. */
const CHART_HOURS = 24;
const CHART_HEIGHT = 140;
const CHART_LABEL_SPACE = 18;
const BAR_SLOT = 24;
const BAR_WIDTH = 16;
// Room above the highest bar for its value label.
const CHART_VALUE_SPACE = 16;
const chartMax = computed(() => Math.max(1, ...hourly.value));
const chartBars = computed(() =>
  Array.from({ length: CHART_HOURS }, (_, hour) => {
    const value = hourly.value[hour];
    const height = value ? Math.max(2, (value / chartMax.value) * (CHART_HEIGHT - CHART_VALUE_SPACE)) : 0;
    return {
      hour,
      value,
      x: hour * BAR_SLOT + (BAR_SLOT - BAR_WIDTH) / 2,
      y: CHART_HEIGHT - height,
      height,
      current: hour === hourly.value.length - 1,
      future: value === undefined,
      title: translate(BackendTranslationKeys.rocket_meals_module_live_pulse_chart_hour, { hour, count: value ?? 0 }),
    };
  })
);

let refreshTimer: ReturnType<typeof setInterval> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  reload();
  refreshTimer = setInterval(reload, LivePulseHelper.REFRESH_INTERVAL_MS);
  // Keeps "vor 3 Minuten" honest between two refreshes.
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 10_000);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimer);
  clearInterval(clockTimer);
  clearTimeout(revealTimer);
});
</script>

<template>
  <private-view :title="translate(page.labelKey)" :icon="page.icon">
    <template #headline>
      <v-breadcrumb :items="[{ name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() }]" />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <span class="updated type-note">{{ updatedLabel }}</span>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="reload">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="live-pulse">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div class="kpis">
        <div v-for="kpi in kpis" :key="kpi.key" class="kpi" :class="{ live: kpi.key === 'now' }">
          <span class="kpi-value">
            <span v-if="kpi.key === 'now'" class="pulse" aria-hidden="true" />
            {{ kpi.value ?? '–' }}
          </span>
          <span class="kpi-label type-note">{{ kpi.label }}</span>
        </div>
      </div>

      <div class="columns">
        <div class="column">
          <section class="panel">
            <h2 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_right_now_active) }}</h2>
            <div v-if="profiles.length === 0 && !loading" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_nobody_right_now) }}</div>
            <div v-else class="people">
              <router-link v-for="profile in profiles" :key="profile.id" class="person" :to="LivePulseHelper.getProfileRoute(profile)" :title="translate(LivePulseHelper.getPresenceLabelKey(presenceOf(profile)))">
                <div class="avatar" :class="`presence-${presenceOf(profile)}`">
                  <img v-if="LivePulseHelper.showsSilhouette(profile)" class="avatar-image silhouette" :src="silhouetteUrl(LivePulseHelper.AVATAR_SIZE)" alt="" loading="lazy" />
                  <img v-else-if="avatarUrl(profile, LivePulseHelper.AVATAR_SIZE)" class="avatar-image" :src="avatarUrl(profile, LivePulseHelper.AVATAR_SIZE)" alt="" loading="lazy" @error="onAvatarError(profile)" />
                  <div v-else class="avatar-image initials">{{ LivePulseHelper.getInitials(profile.nickname) }}</div>
                </div>
                <span class="person-name">{{ getNickname(profile) }}</span>
                <span class="person-time type-note">{{ relative(profile.date_updated) }}</span>
              </router-link>
            </div>
            <div class="legend type-note">
              <span><i class="dot presence-now" />{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_presence_now) }}</span>
              <span><i class="dot presence-recent" />{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_presence_recent) }}</span>
            </div>
          </section>
          <section class="panel">
            <h2 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_chart) }}</h2>
            <div class="chart-scroll">
              <svg class="chart" :viewBox="`0 0 ${CHART_HOURS * BAR_SLOT} ${CHART_HEIGHT + CHART_LABEL_SPACE}`" role="img" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_live_pulse_chart)">
                <line class="baseline" x1="0" :x2="CHART_HOURS * BAR_SLOT" :y1="CHART_HEIGHT" :y2="CHART_HEIGHT" />
                <g v-for="bar in chartBars" :key="bar.hour">
                  <rect v-if="bar.future" class="slot" :x="bar.x" :y="CHART_HEIGHT - 3" :width="BAR_WIDTH" height="3" rx="1.5" />
                  <rect v-else class="bar" :class="{ current: bar.current }" :x="bar.x" :y="bar.y" :width="BAR_WIDTH" :height="bar.height" rx="3">
                    <title>{{ bar.title }}</title>
                  </rect>
                  <text v-if="!bar.future && bar.value" class="bar-value" :x="bar.x + BAR_WIDTH / 2" :y="bar.y - 3" text-anchor="middle">{{ bar.value }}</text>
                  <text v-if="bar.hour % 3 === 0" class="hour" :x="bar.x + BAR_WIDTH / 2" :y="CHART_HEIGHT + CHART_LABEL_SPACE - 4" text-anchor="middle">{{ bar.hour }}</text>
                </g>
              </svg>
            </div>
          </section>
        </div>

        <section class="panel">
          <div class="panel-header">
            <h2 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed) }}</h2>
            <v-menu show-arrow placement="bottom-end" :close-on-content-click="false">
              <template #activator="{ toggle }">
                <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter)" class="feed-filter-button" :class="{ active: feedFilterActive }" x-small icon :secondary="!feedFilterActive" @click="toggle">
                  <v-icon name="filter_list" small />
                </v-button>
              </template>
              <div class="feed-filter">
                <v-checkbox-tree v-model="shownFeedFilterKeys" :choices="feedFilterChoices" value-combining="leaf" />
              </div>
            </v-menu>
          </div>
          <div ref="feedScroll" class="feed-scroll">
            <div v-if="feedFilterHidesAll" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filtered_out) }}</div>
            <div v-else-if="feed.length === 0 && !loading" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_nothing_happened) }}</div>
            <ul v-else ref="feedList" class="feed">
              <li v-for="item in feed" :key="item.key" class="feed-item" :class="{ fresh: freshKeys.has(item.key) }">
                <router-link v-if="LivePulseHelper.showsSilhouette(item.profile)" class="feed-avatar" :to="LivePulseHelper.getProfileRoute(item.profile)">
                  <img class="avatar-image silhouette" :src="silhouetteUrl(LivePulseHelper.FEED_AVATAR_SIZE)" alt="" loading="lazy" />
                </router-link>
                <router-link v-else-if="avatarUrl(item.profile, LivePulseHelper.FEED_AVATAR_SIZE)" class="feed-avatar" :to="LivePulseHelper.getProfileRoute(item.profile)">
                  <img class="avatar-image" :src="avatarUrl(item.profile, LivePulseHelper.FEED_AVATAR_SIZE)" alt="" loading="lazy" @error="onAvatarError(item.profile)" />
                </router-link>
                <component :is="foodRoute(item) ? 'router-link' : 'div'" v-else-if="foodImageUrl(item)" class="feed-avatar" :to="foodRoute(item)">
                  <img class="food-image" :src="foodImageUrl(item)" alt="" loading="lazy" @error="onFoodImageError(item)" />
                </component>
                <div v-else class="feed-avatar feed-icon"><v-icon :name="feedIcon(item)" small /></div>
                <div class="feed-body">
                  <div class="feed-line">
                    <strong v-if="item.type === LivePulseFeedType.USAGE_EVENT">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_anonymous_session) }}</strong>
                    <strong v-else-if="ANONYMOUS_FEED_TYPES.has(item.type)">{{ translate(BackendTranslationKeys.rocket_meals_module_live_pulse_someone) }}</strong>
                    <router-link v-else-if="LivePulseHelper.getProfileRoute(item.profile)" class="feed-link" :to="LivePulseHelper.getProfileRoute(item.profile)"
                      ><strong>{{ getNickname(item.profile) }}</strong></router-link
                    >
                    <strong v-else>{{ getNickname(item.profile) }}</strong>
                    <!-- The line break after the name is dropped by the template compiler, so the space is explicit. -->
                    {{ ' '
                    }}<template v-if="feedTextParts(item).found"
                      >{{ feedTextParts(item).before }}<router-link v-if="linkRoute(item)" class="feed-link food-link" :to="linkRoute(item)">{{ linkName(item) }}</router-link
                      ><template v-else>{{ linkName(item) }}</template
                      >{{ feedTextParts(item).after }}</template
                    ><template v-else>{{ feedTextParts(item).before }}</template>
                    <food-feedback-rating v-if="item.type === LivePulseFeedType.RATING || item.type === LivePulseFeedType.COMMENT" :rating="item.rating" />
                  </div>
                  <q v-if="item.comment" class="feed-comment">{{ item.comment }}</q>
                  <div class="feed-meta type-note">
                    <template v-if="item.canteenName && item.type !== LivePulseFeedType.CANTEEN_VISIT">{{ item.canteenName }} · </template>
                    <template v-if="item.visitDate">{{ formatVisitDate(item.visitDate) }} · </template>
                    <template v-if="item.platform">{{ item.platform }} · </template>
                    {{ relative(item.date) }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </private-view>
</template>

<style scoped>
.live-pulse {
  --live-pulse-now: var(--theme--success, #2ecda7);
  --live-pulse-recent: var(--theme--warning, #ffa439);
  --live-pulse-today: var(--theme--foreground-subdued);

  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.updated {
  margin-inline-end: 0.5rem;
  white-space: nowrap;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.75rem;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.kpi.live {
  border-color: var(--live-pulse-now);
}

.kpi-value {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 700;
  font-size: 1.75rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.pulse {
  inline-size: 0.625rem;
  block-size: 0.625rem;
  background: var(--live-pulse-now);
  border-radius: 50%;
  animation: live-pulse 1.8s infinite;
}

@keyframes live-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--live-pulse-now) 60%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0.6rem transparent;
  }
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-inline-size: 0;
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 70rem) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-inline-size: 0;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.panel-title {
  margin: 0;
}

.panel-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}

.feed-filter-button.active {
  --v-button-background-color: var(--theme--primary);
  --v-button-color: var(--foreground-inverted, #fff);
}

.feed-filter {
  min-inline-size: 18rem;
  max-block-size: 60vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.people {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 1rem 0.75rem;
}

.person {
  color: inherit;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  min-inline-size: 0;
  text-align: center;
}

.avatar {
  padding: 3px;
  border: 3px solid var(--live-pulse-today);
  border-radius: 50%;
}

.person:hover .person-name,
.person:focus-visible .person-name {
  text-decoration: underline;
}

.avatar.presence-now {
  border-color: var(--live-pulse-now);
}

.avatar.presence-recent {
  border-color: var(--live-pulse-recent);
}

.avatar-image {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 64px;
  block-size: 64px;
  overflow: hidden;
  background: #fff;
  border-radius: 50%;
}

.avatar-image.silhouette {
  background: color-mix(in srgb, var(--theme--primary) 14%, var(--theme--background, #fff));
}

.initials {
  color: var(--theme--foreground-subdued);
  font-weight: 600;
  font-size: 1.25rem;
  background: var(--theme--background-normal);
}

.person-name {
  max-inline-size: 100%;
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.dot {
  display: inline-block;
  inline-size: 0.625rem;
  block-size: 0.625rem;
  margin-inline-end: 0.375rem;
  background: var(--live-pulse-today);
  border-radius: 50%;
}

.dot.presence-now {
  background: var(--live-pulse-now);
}

.dot.presence-recent {
  background: var(--live-pulse-recent);
}

/* Fixed height, the ticker scrolls inside – the page below does not move when entries arrive. It also clips the new entry while it waits above the visible part. */
.feed-scroll {
  block-size: 32rem;
  max-block-size: 70vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.feed {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feed-item {
  position: relative;
  isolation: isolate;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.5rem;
  border-radius: var(--theme--border-radius);
}

/* The highlight runs on a pseudo element, so it stays behind the text of the entry. */
.feed-item.fresh::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  animation: feed-fresh 4s ease-out forwards;
  content: '';
  pointer-events: none;
}

@keyframes feed-fresh {
  0% {
    background: color-mix(in srgb, var(--live-pulse-now) 25%, transparent);
  }
  100% {
    background: transparent;
  }
}

.feed-avatar {
  flex: none;
}

.feed-link {
  color: inherit;
  text-decoration: none;
}

.feed-link:hover,
.feed-link:focus-visible {
  text-decoration: underline;
}

.food-link {
  color: var(--theme--primary);
}

.feed-avatar .avatar-image {
  inline-size: 36px;
  block-size: 36px;
}

.food-image {
  display: block;
  inline-size: 36px;
  block-size: 36px;
  object-fit: cover;
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.feed-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 36px;
  block-size: 36px;
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-normal);
  border-radius: 50%;
}

.feed-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
}

.feed-line {
  overflow-wrap: anywhere;
}

.feed-line :deep(.rating) {
  margin-inline-start: 0.25rem;
  vertical-align: -0.125rem;
}

.feed-comment {
  font-style: italic;
  overflow-wrap: anywhere;
}

.empty {
  padding: 2rem 0;
  text-align: center;
}

.chart-scroll {
  overflow-x: auto;
}

.chart {
  display: block;
  inline-size: 100%;
  min-inline-size: 36rem;
  block-size: auto;
}

.baseline {
  stroke: var(--theme--border-color);
  stroke-width: 1;
}

.slot {
  fill: var(--theme--border-color-subdued);
}

.bar {
  fill: color-mix(in srgb, var(--theme--primary) 55%, transparent);
}

.bar.current {
  fill: var(--theme--primary);
}

.bar-value,
.hour {
  font-size: 10px;
  fill: var(--theme--foreground-subdued);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .pulse,
  .feed-item.fresh::before {
    animation: none;
  }
}
</style>
