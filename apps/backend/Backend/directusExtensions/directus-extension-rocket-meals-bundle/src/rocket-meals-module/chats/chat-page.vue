<script setup lang="ts">
/**
 * A chat that belongs to no feedback (`chats/<id>`), or a new one with a profile
 * (`profiles/<id>/chat`).
 *
 * A new chat is only created with the first message (`ProfileChatActions.startChat`), so the profile
 * never sees an empty chat in the app; afterwards the page switches to the address of the chat.
 * Messages written here carry no profile, that is how the app tells support from user messages.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper, ModuleChatKind, type ModuleChat, type ModuleChatMessage } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { ProfileChatActions } from '../../helpers/rocket-meals-module/ProfileChatActions';
import { ProfileDetailsHelper, type ModuleProfile } from '../../helpers/rocket-meals-module/ProfileDetailsHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { SupportChatActions } from '../../helpers/rocket-meals-module/SupportChatActions';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import ProfileAvatar from '../profiles/profile-avatar.vue';
import SupportChatConversation from '../support-chat/support-chat-conversation.vue';
import SupportChatStatusMenu from '../support-chat/support-chat-status-menu.vue';

const props = defineProps<{ chatId?: string; profileId?: string }>();

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate } = useAppExtensionTranslate();

const page = RocketMealsModulePages.CHATS;

/** New messages of the user show up without reloading the page. */
const MESSAGE_REFRESH_INTERVAL_MS = 20000;

const chat = ref<ModuleChat | null>(null);
/** The profile of a new chat, before the chat exists. */
const newChatProfile = ref<ModuleProfile | null>(null);
const messages = ref<ModuleChatMessage[]>([]);
const loading = ref(false);
const loadError = ref(false);
const sending = ref(false);
const updatingState = ref(false);

const isNew = computed(() => !props.chatId && !!props.profileId);
const profiles = computed<ModuleProfile[]>(() => (chat.value ? ChatQueryHelper.getProfiles(chat.value) : newChatProfile.value ? [newChatProfile.value] : []));
const status = computed(() => (chat.value ? ChatQueryHelper.getStatus(chat.value) : FoodFeedbackChatStatus.NEW));
const canWrite = computed(() => !!chat.value || !!newChatProfile.value);
const title = computed(() => {
  if (isNew.value) {
    const nickname = ProfileDetailsHelper.getNickname(newChatProfile.value);
    return nickname ? translate(BackendTranslationKeys.rocket_meals_module_chat_with, { nickname }) : translate(BackendTranslationKeys.rocket_meals_module_profile_start_chat);
  }
  return chat.value?.alias || translate(page.labelKey);
});
const opening = computed(() => (chat.value?.initial_message ? { text: chat.value.initial_message, date: chat.value.date_created } : null));
/** A feedback chat opened here by its address is answered on the page of its feedback. */
const feedbackChatRoute = computed(() => (chat.value && ChatQueryHelper.getKind(chat.value) !== ModuleChatKind.OTHER ? ChatQueryHelper.getRoute(chat.value) : undefined));

async function loadChat() {
  if (!props.chatId) {
    chat.value = null;
    return;
  }
  const response = await api.get(`${ChatQueryHelper.CHATS_ENDPOINT}/${encodeURIComponent(props.chatId)}`, { params: ChatQueryHelper.buildChatQuery() });
  chat.value = response.data?.data ?? null;
}

async function loadMessages() {
  if (!props.chatId) {
    messages.value = [];
    return;
  }
  const response = await api.get(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { params: ChatQueryHelper.buildMessagesQuery(props.chatId) });
  messages.value = ChatHelper.sortMessagesChronologically(response.data?.data ?? []);
}

async function loadNewChatProfile() {
  if (!isNew.value || !props.profileId) {
    newChatProfile.value = null;
    return;
  }
  const response = await api.get(`${ProfileDetailsHelper.PROFILES_ENDPOINT}/${encodeURIComponent(props.profileId)}`, { params: ProfileDetailsHelper.buildProfileQuery() });
  newChatProfile.value = response.data?.data ?? null;
}

async function load() {
  loading.value = true;
  try {
    await Promise.all([loadChat(), loadMessages(), loadNewChatProfile()]);
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading chat failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function sendMessage(text: string): Promise<boolean> {
  if (!canWrite.value) {
    return false;
  }
  sending.value = true;
  try {
    if (chat.value) {
      await ProfileChatActions.sendMessage(api, chat.value.id, text);
    } else if (newChatProfile.value) {
      const chatId = await ProfileChatActions.startChat(api, newChatProfile.value, text);
      // The chat exists now: continue on its own address, the load follows from the route change.
      await router.replace(RocketMealsModulePages.getRoute(page, chatId));
      return true;
    }
  } catch (error) {
    console.error('[rocket-meals-module] sending chat message failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
    return false;
  } finally {
    sending.value = false;
  }
  // The message is saved – a failing reload must not look like a failed send.
  try {
    await Promise.all([loadChat(), loadMessages()]);
  } catch (error) {
    console.error('[rocket-meals-module] reloading chat after sending failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_load_failed), type: 'warning' });
  }
  return true;
}

async function changeStatus(nextStatus: FoodFeedbackChatStatus) {
  const nextState = FoodFeedbackChatStatusHelper.getConversationStateForStatus(nextStatus);
  if (!chat.value || !nextState || nextStatus === status.value || updatingState.value) {
    return;
  }
  updatingState.value = true;
  try {
    await SupportChatActions.setConversationState(api, chat.value.id, nextState);
    await loadChat();
  } catch (error) {
    console.error('[rocket-meals-module] updating chat state failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_status_change_failed), type: 'error' });
  } finally {
    updatingState.value = false;
  }
}

let refreshInterval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  load();
  refreshInterval = setInterval(() => {
    if (!sending.value && props.chatId) {
      loadMessages().catch(() => undefined);
    }
  }, MESSAGE_REFRESH_INTERVAL_MS);
});
onBeforeUnmount(() => clearInterval(refreshInterval));
watch(() => [props.chatId, props.profileId], load);
</script>

<template>
  <private-view :title="title" :icon="page.icon" show-back :back-to="isNew && profileId ? ProfileDetailsHelper.getRoute(profileId) : RocketMealsModulePages.getRoute(page)">
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
      <v-button v-if="chatId" v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_chat_open_item)" rounded icon secondary :to="`/content/${CollectionNames.CHATS}/${chatId}`">
        <v-icon name="open_in_new" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="chat-page">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <template v-else-if="chat || newChatProfile">
        <div class="chat-info">
          <support-chat-status-menu v-if="chat" :status="status" :can-write="canWrite" :updating="updatingState" @change="changeStatus" />
          <span class="type-label">{{ chat?.alias || translate(BackendTranslationKeys.rocket_meals_module_profile_start_chat) }}</span>
          <span class="spacer" />
          <profile-avatar v-for="participant in profiles" :key="participant.id" :profile="participant" :size="28" with-name />
        </div>

        <v-notice v-if="feedbackChatRoute" type="info">
          <span class="notice-text">{{ translate(BackendTranslationKeys.rocket_meals_module_chat_belongs_to_feedback) }}</span>
          <v-button small secondary :to="feedbackChatRoute">{{ translate(BackendTranslationKeys.rocket_meals_module_to_chat) }}</v-button>
        </v-notice>

        <v-notice v-if="isNew" type="info">{{ translate(BackendTranslationKeys.rocket_meals_module_chat_new_hint) }}</v-notice>

        <support-chat-conversation :opening="opening" :user-profile="profiles[0] ?? null" :messages="messages" :can-write="canWrite" :empty-text="translate(BackendTranslationKeys.rocket_meals_module_chat_empty)" :send="sendMessage" />
      </template>

      <v-progress-circular v-else-if="loading" indeterminate />
    </div>
  </private-view>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-inline-size: 56rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.chat-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.notice-text {
  flex: 1;
}

.spacer {
  flex: 1;
}
</style>
