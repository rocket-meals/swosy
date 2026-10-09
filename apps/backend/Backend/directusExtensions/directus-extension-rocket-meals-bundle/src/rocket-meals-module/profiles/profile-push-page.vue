<script setup lang="ts">
/**
 * Send a push message to all devices of one profile (`profiles/<id>/push`).
 *
 * Left a preview of the notification as a phone shows it: title in one line, text in four lines.
 * What a phone probably cuts off is marked below it. Right a phone on its home screen with the app
 * icon (the project logo) and the badge number. Sending writes one published `push_notifications`
 * item with the push tokens of all devices, the `push-notification-hook` hands it to Expo.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ProfileDetailsHelper, type ModuleProfile, type ModuleProfileDevice } from '../../helpers/rocket-meals-module/ProfileDetailsHelper';
import { PushNotificationComposeHelper } from '../../helpers/rocket-meals-module/PushNotificationComposeHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import ProfileAvatar from './profile-avatar.vue';

const props = defineProps<{ profileId: string }>();

const api = useApi();
const router = useRouter();
const { useNotificationsStore, useServerStore } = useStores();
const notificationsStore = useNotificationsStore();
const serverStore = useServerStore();
const { translate, language } = useAppExtensionTranslate();

const page = RocketMealsModulePages.PROFILES;
const apiRoot = String(api.defaults?.baseURL ?? '/');

/** Edge length in px of the app icon on the home screen and in the notification. */
const HOME_ICON_SIZE = 56;
/** Empty app icons around ours, so the home screen looks like one. */
const HOME_PLACEHOLDER_ICONS = 15;
const DOCK_PLACEHOLDER_ICONS = 3;

const profile = ref<ModuleProfile | null>(null);
const devices = ref<ModuleProfileDevice[]>([]);
const loading = ref(false);
const loadError = ref(false);
const sending = ref(false);
const confirmOpen = ref(false);

const title = ref('');
const body = ref('');
const badge = ref('');

const pushTokens = computed(() => ProfileDetailsHelper.getPushTokens(devices.value));
const pushDevices = computed(() => devices.value.filter(device => !!ProfileDetailsHelper.getPushToken(device)));
const nickname = computed(() => ProfileDetailsHelper.getNickname(profile.value) ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname));
const titleVisibility = computed(() => PushNotificationComposeHelper.getTitleVisibility(title.value));
const bodyVisibility = computed(() => PushNotificationComposeHelper.getBodyVisibility(body.value));
const parsedBadge = computed(() => PushNotificationComposeHelper.parseBadge(badge.value));
const badgeLabel = computed(() => PushNotificationComposeHelper.getBadgeLabel(parsedBadge.value));
const draft = computed(() => ({ title: title.value, body: body.value, badge: badge.value }));
const canSend = computed(() => PushNotificationComposeHelper.canSend(draft.value, pushTokens.value) && !sending.value);

/** Name, logo and colour of the project – the app as it appears on the phone. */
const projectName = computed(() => String(serverStore.info?.project?.project_name ?? RocketMealsModulePages.MODULE_NAME));
const projectColor = computed(() => String(serverStore.info?.project?.project_color ?? 'var(--theme--primary)'));
const logoFailed = ref(false);
const projectLogoUrl = computed(() => {
  const logo = serverStore.info?.project?.project_logo;
  if (!logo || logoFailed.value) {
    return undefined;
  }
  const root = apiRoot.endsWith('/') ? apiRoot : `${apiRoot}/`;
  const edge = HOME_ICON_SIZE * 3;
  return `${root}assets/${encodeURIComponent(String(logo))}?width=${edge}&height=${edge}&fit=contain&quality=90`;
});

/** The clock of the phone, ticking with the real one. */
const clock = ref(new Date());
const clockLabel = computed(() => new Intl.DateTimeFormat(language.value, { hour: '2-digit', minute: '2-digit' }).format(clock.value));
const nowLabel = computed(() => new Intl.RelativeTimeFormat(language.value, { numeric: 'auto' }).format(0, 'minute'));
let clockTimer: ReturnType<typeof setInterval> | undefined;

async function load() {
  loading.value = true;
  try {
    const [profileResponse, devicesResponse] = await Promise.all([api.get(`${ProfileDetailsHelper.PROFILES_ENDPOINT}/${encodeURIComponent(props.profileId)}`, { params: ProfileDetailsHelper.buildProfileQuery() }), api.get(ProfileDetailsHelper.DEVICES_ENDPOINT, { params: ProfileDetailsHelper.buildDevicesQuery(props.profileId) })]);
    profile.value = profileResponse.data?.data ?? null;
    devices.value = devicesResponse.data?.data ?? [];
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading profile for push failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function send() {
  confirmOpen.value = false;
  if (!canSend.value) {
    return;
  }
  sending.value = true;
  try {
    await api.post(PushNotificationComposeHelper.PUSH_NOTIFICATIONS_ENDPOINT, PushNotificationComposeHelper.buildPushNotification(draft.value, pushTokens.value));
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_push_sent, { count: pushTokens.value.length }), type: 'success' });
    await router.push(ProfileDetailsHelper.getRoute(props.profileId) ?? RocketMealsModulePages.getRoute(page));
  } catch (error) {
    console.error('[rocket-meals-module] sending push notification failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_push_failed), type: 'error' });
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  load();
  clockTimer = setInterval(() => {
    clock.value = new Date();
  }, 15_000);
});
onBeforeUnmount(() => clearInterval(clockTimer));
watch(() => props.profileId, load);
</script>

<template>
  <private-view :title="translate(BackendTranslationKeys.rocket_meals_module_profile_send_push)" icon="notifications_active" show-back :back-to="ProfileDetailsHelper.getRoute(profileId)">
    <template #headline>
      <v-breadcrumb
        :items="[
          { name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() },
          { name: translate(page.labelKey), to: RocketMealsModulePages.getRoute(page) },
          { name: nickname, to: ProfileDetailsHelper.getRoute(profileId) ?? '' },
        ]"
      />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <div class="push-page">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <template v-else-if="profile">
        <section class="panel compose">
          <div class="recipient">
            <profile-avatar :profile="profile" :size="40" with-name />
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_push_recipients, { count: pushTokens.length }) }}</span>
          </div>
          <v-notice v-if="pushTokens.length === 0" type="warning">{{ translate(BackendTranslationKeys.rocket_meals_module_profile_no_push_devices) }}</v-notice>
          <ul v-else class="devices type-note">
            <li v-for="device in pushDevices" :key="device.id">
              <v-icon :name="ProfileDetailsHelper.getDeviceIcon(device)" x-small />
              {{ ProfileDetailsHelper.getDeviceDescription(device) ?? translate(BackendTranslationKeys.unknown) }}
            </li>
          </ul>

          <label class="field">
            <span class="field-label type-label">
              {{ translate(BackendTranslationKeys.title) }}
              <span class="counter" :class="{ over: titleVisibility.tooLong }">{{ titleVisibility.length }} / {{ titleVisibility.limit }}</span>
            </span>
            <v-input v-model="title" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_push_title_placeholder)" :disabled="sending" />
          </label>

          <label class="field">
            <span class="field-label type-label">
              {{ translate(BackendTranslationKeys.rocket_meals_module_push_body) }}
              <span class="counter" :class="{ over: bodyVisibility.tooLong }">{{ bodyVisibility.length }} / {{ bodyVisibility.limit }}</span>
            </span>
            <v-textarea v-model="body" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_push_body_placeholder)" :disabled="sending" />
          </label>

          <label class="field badge-field">
            <span class="field-label type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_push_badge) }}</span>
            <v-input v-model="badge" type="number" :min="0" :max="PushNotificationComposeHelper.MAX_BADGE" :step="1" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_push_badge_placeholder)" :disabled="sending" />
            <span class="type-note" :class="{ invalid: parsedBadge === null }">{{ translate(parsedBadge === null ? BackendTranslationKeys.rocket_meals_module_push_badge_invalid : BackendTranslationKeys.rocket_meals_module_push_badge_hint, { max: PushNotificationComposeHelper.MAX_BADGE }) }}</span>
          </label>

          <div class="send-row">
            <v-button :disabled="!canSend" :loading="sending" @click="confirmOpen = true">
              <v-icon name="send" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_profile_send_push) }}
            </v-button>
          </div>
        </section>

        <div class="previews">
          <section class="preview">
            <h3 class="preview-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_push_preview_notification) }}</h3>
            <div class="lock-screen" :style="{ '--project-color': projectColor }">
              <div class="lock-clock">{{ clockLabel }}</div>
              <div class="notification">
                <div class="notification-icon">
                  <img v-if="projectLogoUrl" :src="projectLogoUrl" alt="" @error="logoFailed = true" />
                  <v-icon v-else :name="RocketMealsModulePages.MODULE_ICON" small />
                </div>
                <div class="notification-content">
                  <div class="notification-header">
                    <span class="notification-app">{{ projectName }}</span>
                    <span class="notification-time">{{ nowLabel }}</span>
                  </div>
                  <div class="notification-title" :class="{ placeholder: !title.trim() }">{{ title.trim() || translate(BackendTranslationKeys.rocket_meals_module_push_title_placeholder) }}</div>
                  <div class="notification-body" :class="{ placeholder: !body.trim() }" :style="{ '-webkit-line-clamp': PushNotificationComposeHelper.BODY_VISIBLE_LINES }">{{ body.trim() || translate(BackendTranslationKeys.rocket_meals_module_push_body_placeholder) }}</div>
                </div>
              </div>
            </div>

            <div v-if="titleVisibility.tooLong || bodyVisibility.tooLong" class="cut-off">
              <div class="cut-off-header">
                <v-icon name="content_cut" small />
                <span>{{ translate(BackendTranslationKeys.rocket_meals_module_push_cut_off_hint) }}</span>
              </div>
              <div v-if="titleVisibility.tooLong" class="cut-off-text">
                <span class="type-note">{{ translate(BackendTranslationKeys.title) }}</span>
                <p>
                  {{ titleVisibility.visible }}<mark>{{ titleVisibility.hidden }}</mark>
                </p>
              </div>
              <div v-if="bodyVisibility.tooLong" class="cut-off-text">
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_push_body) }}</span>
                <p>
                  {{ bodyVisibility.visible }}<mark>{{ bodyVisibility.hidden }}</mark>
                </p>
              </div>
            </div>
          </section>

          <section class="preview">
            <h3 class="preview-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_push_preview_home) }}</h3>
            <div class="phone" :style="{ '--project-color': projectColor }">
              <div class="phone-screen">
                <div class="status-bar">
                  <span>{{ clockLabel }}</span>
                  <span class="island" />
                  <span class="status-icons"><v-icon name="signal_cellular_alt" x-small /><v-icon name="wifi" x-small /><v-icon name="battery_full" x-small /></span>
                </div>
                <div class="home-grid">
                  <div class="app">
                    <div class="app-icon own">
                      <img v-if="projectLogoUrl" :src="projectLogoUrl" alt="" @error="logoFailed = true" />
                      <v-icon v-else :name="RocketMealsModulePages.MODULE_ICON" />
                      <span v-if="badgeLabel" class="badge">{{ badgeLabel }}</span>
                    </div>
                    <span class="app-name">{{ projectName }}</span>
                  </div>
                  <div v-for="index in HOME_PLACEHOLDER_ICONS" :key="index" class="app">
                    <div class="app-icon placeholder" />
                    <span class="app-name placeholder-name" />
                  </div>
                </div>
                <div class="dock">
                  <div v-for="index in DOCK_PLACEHOLDER_ICONS" :key="index" class="app-icon placeholder" />
                </div>
              </div>
            </div>
            <p class="type-note badge-note">{{ translate(BackendTranslationKeys.rocket_meals_module_push_badge_ios_only) }}</p>
          </section>
        </div>
      </template>

      <v-progress-circular v-else-if="loading" indeterminate />
    </div>

    <v-dialog v-model="confirmOpen" @esc="confirmOpen = false">
      <v-card>
        <v-card-title>{{ translate(BackendTranslationKeys.rocket_meals_module_push_confirm, { count: pushTokens.length, nickname }) }}</v-card-title>
        <v-card-actions>
          <v-button secondary @click="confirmOpen = false">{{ translate(BackendTranslationKeys.cancel) }}</v-button>
          <v-button :loading="sending" @click="send">{{ translate(BackendTranslationKeys.send) }}</v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </private-view>
</template>

<style scoped>
.push-page {
  display: grid;
  grid-template-columns: minmax(0, 26rem) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
  max-inline-size: 80rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.push-page > .v-notice,
.push-page > .v-progress-circular {
  grid-column: 1 / -1;
}

@media (max-width: 75rem) {
  .push-page {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.recipient {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.devices {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.counter {
  color: var(--theme--foreground-subdued);
  font-weight: 400;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.counter.over {
  color: var(--theme--warning);
  font-weight: 600;
}

.invalid {
  color: var(--theme--danger);
}

.send-row {
  display: flex;
  justify-content: flex-end;
}

.previews {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  min-inline-size: 0;
}

.preview-title {
  align-self: stretch;
  margin: 0;
}

/* Lock screen: blurred wallpaper in the project colour, the notification on top. */
.lock-screen {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  inline-size: 100%;
  max-inline-size: 22rem;
  padding: 1.5rem 0.75rem 2.5rem;
  background: radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--project-color) 70%, #fff) 0%, transparent 55%), linear-gradient(160deg, var(--project-color), #1c1c28);
  border-radius: 2rem;
}

.lock-clock {
  color: #fff;
  font-weight: 600;
  font-size: 3.5rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 6px rgb(0 0 0 / 0.25);
}

.notification {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  inline-size: 100%;
  padding: 0.75rem;
  color: #111;
  background: rgb(245 245 247 / 0.86);
  border-radius: 1.25rem;
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.18);
  backdrop-filter: blur(20px);
}

.notification-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 38px;
  block-size: 38px;
  overflow: hidden;
  color: #fff;
  background: var(--project-color);
  border-radius: 9px;
}

.notification-icon img,
.app-icon img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
  background: #fff;
}

.notification-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
  font-size: 0.875rem;
  line-height: 1.3;
}

.notification-header {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  color: rgb(0 0 0 / 0.55);
  font-size: 0.75rem;
}

.notification-app {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

.notification-time {
  flex: none;
}

.notification-title {
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notification-body {
  display: -webkit-box;
  overflow: hidden;
  white-space: pre-line;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
}

.placeholder {
  color: rgb(0 0 0 / 0.35);
}

.cut-off {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: stretch;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--theme--warning) 10%, transparent);
  border: var(--theme--border-width) solid color-mix(in srgb, var(--theme--warning) 40%, transparent);
  border-radius: var(--theme--border-radius);
}

.cut-off-header {
  --v-icon-color: var(--theme--warning);

  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.cut-off-text p {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.cut-off-text mark {
  color: var(--theme--foreground-subdued);
  text-decoration: line-through;
  text-decoration-color: var(--theme--warning);
  background: color-mix(in srgb, var(--theme--warning) 25%, transparent);
}

/* Phone on its home screen. */
.phone {
  inline-size: 17rem;
  padding: 0.625rem;
  background: #111;
  border-radius: 2.75rem;
  box-shadow:
    0 0 0 2px #333,
    0 12px 32px rgb(0 0 0 / 0.25);
}

.phone-screen {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  aspect-ratio: 9 / 19.5;
  padding: 0.75rem 1rem 0.75rem;
  overflow: hidden;
  color: #fff;
  background: radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--project-color) 60%, #fff) 0%, transparent 50%), linear-gradient(200deg, var(--project-color), #20202e 85%);
  border-radius: 2.25rem;
}

.status-bar {
  --v-icon-color: #fff;

  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.island {
  inline-size: 4.5rem;
  block-size: 1.25rem;
  background: #000;
  border-radius: 1rem;
}

.status-icons {
  display: inline-flex;
  gap: 0.125rem;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem 0.5rem;
  justify-items: center;
}

.app {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  min-inline-size: 0;
  max-inline-size: 100%;
}

.app-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 46px;
  block-size: 46px;
  border-radius: 11px;
}

.app-icon.own {
  --v-icon-color: #fff;

  background: var(--project-color);
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
}

.app-icon.own img {
  border-radius: inherit;
}

.app-icon.placeholder {
  background: rgb(255 255 255 / 0.22);
}

.badge {
  position: absolute;
  inset-block-start: -6px;
  inset-inline-end: -8px;
  min-inline-size: 20px;
  block-size: 20px;
  padding: 0 6px;
  color: #fff;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 20px;
  text-align: center;
  background: #ff3b30;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
  font-variant-numeric: tabular-nums;
}

.app-name {
  max-inline-size: 4rem;
  overflow: hidden;
  font-size: 0.625rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
}

.placeholder-name {
  inline-size: 2.25rem;
  block-size: 0.375rem;
  margin-block-start: 0.25rem;
  background: rgb(255 255 255 / 0.3);
  border-radius: 0.25rem;
}

.dock {
  display: flex;
  justify-content: space-around;
  margin-block-start: auto;
  padding: 0.625rem;
  background: rgb(255 255 255 / 0.18);
  border-radius: 1.5rem;
}

.badge-note {
  max-inline-size: 17rem;
  margin: 0;
  text-align: center;
}
</style>
