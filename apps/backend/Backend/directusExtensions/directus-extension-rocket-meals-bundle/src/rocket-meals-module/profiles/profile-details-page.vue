<script setup lang="ts">
/**
 * Details of one profile (`profiles/<id>`): avatar and the basics, its devices (with or without push
 * token), its chats and its newest food and app feedbacks. From here support starts a chat or sends
 * a push message to all devices of the profile. Every profile link of the module leads here.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { AppFeedbackChatStatusHelper } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { AppFeedbackChatHelper, type AppFeedbackListItem } from '../../helpers/rocket-meals-module/AppFeedbackChatHelper';
import { ChatQueryHelper, type ModuleChat } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { FoodFeedbackChatHelper, type FoodFeedbackListItem } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { LivePulseHelper } from '../../helpers/rocket-meals-module/LivePulseHelper';
import { ProfileDetailsHelper, type ModuleProfile, type ModuleProfileDevice } from '../../helpers/rocket-meals-module/ProfileDetailsHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from '../food-feedbacks/food-feedback-rating.vue';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';
import ProfileAvatar from './profile-avatar.vue';

const props = defineProps<{ profileId: string }>();

const api = useApi();
const { translate, language, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.PROFILES;

const profile = ref<ModuleProfile | null>(null);
const devices = ref<ModuleProfileDevice[]>([]);
const chats = ref<ModuleChat[]>([]);
const foodFeedbacks = ref<FoodFeedbackListItem[]>([]);
const appFeedbacks = ref<AppFeedbackListItem[]>([]);
const loading = ref(false);
const loadError = ref(false);
const now = ref(new Date());

const nickname = computed(() => ProfileDetailsHelper.getNickname(profile.value) ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname));
const pushTokens = computed(() => ProfileDetailsHelper.getPushTokens(devices.value));

type Fact = { key: string; icon: string; label: string; value: string };
const facts = computed<Fact[]>(() => {
  const current = profile.value;
  if (!current) {
    return [];
  }
  const unknown = translate(BackendTranslationKeys.unknown);
  return [
    { key: 'active', icon: 'monitor_heart', label: translate(BackendTranslationKeys.rocket_meals_module_profile_last_active_label), value: relative(current.date_updated) || unknown },
    { key: 'created', icon: 'event', label: translate(BackendTranslationKeys.date_created), value: formatDateTime(current.date_created) || unknown },
    { key: 'language', icon: 'translate', label: translate(BackendTranslationKeys.language), value: ProfileDetailsHelper.getLanguageCode(current) ?? unknown },
    { key: 'canteen', icon: 'restaurant', label: translate(BackendTranslationKeys.rocket_meals_module_canteen), value: ProfileDetailsHelper.getCanteenName(current) ?? unknown },
    { key: 'verified', icon: 'verified', label: translate(BackendTranslationKeys.rocket_meals_module_profile_verified), value: translate(current.verified ? BackendTranslationKeys.yes : BackendTranslationKeys.no) },
  ];
});

async function getList<T>(endpoint: string, params: Record<string, string | number>): Promise<T[]> {
  try {
    const response = await api.get(endpoint, { params });
    return (response.data?.data ?? []) as T[];
  } catch (error) {
    // e.g. no read permission on one collection – that section just stays empty.
    console.warn('[rocket-meals-module] loading a section of the profile failed', error);
    return [];
  }
}

async function load() {
  loading.value = true;
  try {
    const response = await api.get(`${ProfileDetailsHelper.PROFILES_ENDPOINT}/${encodeURIComponent(props.profileId)}`, { params: ProfileDetailsHelper.buildProfileQuery() });
    profile.value = response.data?.data ?? null;
    const [nextDevices, nextChats, nextFoodFeedbacks, nextAppFeedbacks] = await Promise.all([getList<ModuleProfileDevice>(ProfileDetailsHelper.DEVICES_ENDPOINT, ProfileDetailsHelper.buildDevicesQuery(props.profileId)), getList<ModuleChat>(ChatQueryHelper.CHATS_ENDPOINT, ChatQueryHelper.buildChatsQuery({ profileId: props.profileId, limit: ProfileDetailsHelper.FEEDBACK_LIMIT })), getList<FoodFeedbackListItem>(FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, ProfileDetailsHelper.buildFoodFeedbacksQuery(props.profileId)), getList<AppFeedbackListItem>(AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, ProfileDetailsHelper.buildAppFeedbacksQuery(props.profileId))]);
    devices.value = nextDevices;
    chats.value = nextChats;
    foodFeedbacks.value = nextFoodFeedbacks;
    appFeedbacks.value = nextAppFeedbacks;
    now.value = new Date();
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading profile failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function relative(date: string | null | undefined): string {
  return LivePulseHelper.formatRelativeTime(date, now.value, language.value);
}

onMounted(load);
watch(() => props.profileId, load);
</script>

<template>
  <private-view :title="profile ? nickname : translate(page.labelKey)" :icon="page.icon" show-back :back-to="RocketMealsModulePages.getRoute(page)">
    <template #headline>
      <v-breadcrumb
        :items="[
          { name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() },
          { name: translate(page.labelKey), to: RocketMealsModulePages.getRoute(page) },
        ]"
      />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_profile_open_item)" rounded icon secondary :to="ProfileDetailsHelper.getContentRoute(profileId)">
        <v-icon name="open_in_new" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="profile-page">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <template v-else-if="profile">
        <section class="panel header">
          <profile-avatar :profile="profile" :size="ProfileDetailsHelper.AVATAR_SIZE" :link="false" />
          <div class="header-text">
            <h2 class="nickname">{{ nickname }}</h2>
            <code class="profile-id type-note">{{ profile.id }}</code>
            <div class="header-actions">
              <v-button :to="ProfileDetailsHelper.getChatRoute(profile.id)">
                <v-icon name="chat" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_profile_start_chat) }}
              </v-button>
              <v-button v-tooltip.bottom="pushTokens.length === 0 ? translate(BackendTranslationKeys.rocket_meals_module_profile_no_push_devices) : undefined" secondary :disabled="pushTokens.length === 0" :to="pushTokens.length > 0 ? ProfileDetailsHelper.getPushRoute(profile.id) : undefined">
                <v-icon name="notifications_active" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_profile_send_push) }}
              </v-button>
            </div>
          </div>
        </section>

        <div class="facts">
          <div v-for="fact in facts" :key="fact.key" class="fact">
            <v-icon :name="fact.icon" small />
            <div class="fact-text">
              <span class="type-note">{{ fact.label }}</span>
              <span class="fact-value">{{ fact.value }}</span>
            </div>
          </div>
        </div>

        <div class="columns">
          <section class="panel">
            <h3 class="panel-title type-label">
              {{ translate(BackendTranslationKeys.rocket_meals_module_profile_devices) }}
              <span class="count">{{ devices.length }}</span>
            </h3>
            <div v-if="devices.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_profile_no_devices) }}</div>
            <ul v-else class="rows">
              <li v-for="device in devices" :key="device.id" class="row">
                <v-icon :name="ProfileDetailsHelper.getDeviceIcon(device)" />
                <div class="row-text">
                  <span class="row-title">{{ ProfileDetailsHelper.getDeviceDescription(device) ?? translate(BackendTranslationKeys.unknown) }}</span>
                  <span class="type-note">
                    <template v-if="device.app_version">{{ translate(BackendTranslationKeys.rocket_meals_module_profile_app_version, { version: device.app_version }) }} · </template>
                    {{ translate(BackendTranslationKeys.rocket_meals_module_profile_last_active, { time: relative(device.date_updated) }) }}
                  </span>
                </div>
                <span class="push-state" :class="{ enabled: !!ProfileDetailsHelper.getPushToken(device) }">
                  <v-icon :name="ProfileDetailsHelper.getPushToken(device) ? 'notifications_active' : 'notifications_off'" x-small />
                  {{ translate(ProfileDetailsHelper.getPushTokenLabelKey(device)) }}
                </span>
              </li>
            </ul>
          </section>

          <section class="panel">
            <h3 class="panel-title type-label">
              {{ translate(BackendTranslationKeys.rocket_meals_module_chats) }}
              <span class="count">{{ chats.length }}</span>
            </h3>
            <div v-if="chats.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_profile_no_chats) }}</div>
            <ul v-else class="rows">
              <li v-for="chat in chats" :key="chat.id">
                <router-link class="row linked" :to="ChatQueryHelper.getRoute(chat)">
                  <v-icon :name="ChatQueryHelper.getKindIcon(ChatQueryHelper.getKind(chat))" />
                  <div class="row-text">
                    <span class="row-title">{{ chat.alias || translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
                    <span class="type-note">{{ formatDateTime(chat.date_updated || chat.date_created) }}</span>
                  </div>
                  <food-feedback-status-chip :status="ChatQueryHelper.getStatus(chat)" />
                </router-link>
              </li>
            </ul>
          </section>

          <section class="panel">
            <h3 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_food_feedbacks) }}</h3>
            <div v-if="foodFeedbacks.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.no_data_found) }}</div>
            <ul v-else class="rows">
              <li v-for="feedback in foodFeedbacks" :key="feedback.id">
                <router-link class="row linked" :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.FOOD_FEEDBACKS, feedback.id)">
                  <v-icon :name="FoodFeedbackChatStatusHelper.hasComment(feedback) ? 'chat_bubble' : 'star'" />
                  <div class="row-text">
                    <span class="row-title">
                      {{ FoodFeedbackChatHelper.getFoodName(feedback) ?? translate(BackendTranslationKeys.rocket_meals_module_unknown_food) }}
                      <food-feedback-rating :rating="feedback.rating" />
                    </span>
                    <q v-if="FoodFeedbackChatStatusHelper.hasComment(feedback)" class="row-quote">{{ feedback.comment }}</q>
                    <span class="type-note">{{ formatDateTime(feedback.date_updated || feedback.date_created) }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
          </section>

          <section class="panel">
            <h3 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_app_feedbacks) }}</h3>
            <div v-if="appFeedbacks.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.no_data_found) }}</div>
            <ul v-else class="rows">
              <li v-for="feedback in appFeedbacks" :key="feedback.id">
                <router-link class="row linked" :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.APP_FEEDBACKS, feedback.id)">
                  <v-icon :name="AppFeedbackChatHelper.getTypeIcon(feedback) ?? AppFeedbackChatHelper.getSourceIcon(feedback)" />
                  <div class="row-text">
                    <span class="row-title">{{ AppFeedbackChatHelper.getTitle(feedback) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
                    <span class="type-note">{{ formatDateTime(feedback.date_created) }}</span>
                  </div>
                  <food-feedback-status-chip :status="AppFeedbackChatStatusHelper.getStatus(feedback)" />
                </router-link>
              </li>
            </ul>
          </section>
        </div>
      </template>

      <v-progress-circular v-else-if="loading" indeterminate />
    </div>
  </private-view>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-inline-size: 72rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-inline-size: 0;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.header {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
}

.header-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  min-inline-size: 14rem;
}

.nickname {
  margin: 0;
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile-id {
  overflow-wrap: anywhere;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block-start: 0.5rem;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.fact {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.fact .v-icon {
  --v-icon-color: var(--theme--primary);
}

.fact-text {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.fact-value {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 60rem) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel-title {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
}

.count {
  min-inline-size: 1.5rem;
  padding: 0 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  background: var(--theme--background-normal);
  border-radius: 1rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem;
  color: inherit;
  text-decoration: none;
  border-radius: var(--theme--border-radius);
}

.row > .v-icon {
  --v-icon-color: var(--theme--foreground-subdued);

  flex: none;
}

.row.linked:hover,
.row.linked:focus-visible {
  background: var(--theme--background-normal);
}

.row-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
}

.row-title {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.row-quote {
  display: -webkit-box;
  overflow: hidden;
  font-style: italic;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.push-state {
  display: inline-flex;
  flex: none;
  gap: 0.25rem;
  align-items: center;
  padding: 0.125rem 0.5rem;
  color: var(--theme--foreground-subdued);
  font-size: 0.75rem;
  background: var(--theme--background-normal);
  border-radius: 1rem;
}

.push-state.enabled {
  --v-icon-color: var(--theme--success);

  color: var(--theme--success);
  background: color-mix(in srgb, var(--theme--success) 12%, transparent);
}

.empty {
  padding: 1rem 0;
  text-align: center;
}
</style>
