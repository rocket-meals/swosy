<script setup lang="ts">
/**
 * Chat with the author of a food feedback.
 *
 * The comment of the feedback opens the conversation. The first answer creates the chat (see
 * `FoodFeedbackChatStatusHelper.buildChatForFeedback`), adds the author as participant and links it to
 * the feedback, so the author finds it in the app. Messages written here carry no profile – that
 * is how the app and `chat-conversation-state-hook` tell support messages from user messages.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { AppExtensionLanguageHelper } from '../../helpers/app-extensions/AppExtensionLanguageHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatHelper, type FoodFeedbackChatMessage, type FoodFeedbackListItem } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';
import FoodFeedbackStatusChip from './food-feedback-status-chip.vue';

const props = defineProps<{ feedbackId: string }>();

const api = useApi();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FOOD_FEEDBACKS;

/** New messages of the user show up without reloading the page. */
const MESSAGE_REFRESH_INTERVAL_MS = 20000;

const feedback = ref<FoodFeedbackListItem | null>(null);
const messages = ref<FoodFeedbackChatMessage[]>([]);
const loading = ref(false);
const loadError = ref(false);
const sending = ref(false);
const updatingState = ref(false);
const newMessage = ref('');
const messagesContainer = ref<HTMLElement>();

const chatId = computed(() => RelationHelper.getId(feedback.value?.chat));
const status = computed(() => (feedback.value ? FoodFeedbackChatStatusHelper.getStatus(feedback.value) : FoodFeedbackChatStatus.NEW));
const canWrite = computed(() => !!feedback.value && FoodFeedbackChatStatusHelper.canStartChat(feedback.value));
const foodName = computed(() => (feedback.value ? FoodFeedbackChatHelper.getFoodName(feedback.value) : undefined));
const title = computed(() => foodName.value || translate(page.labelKey));

async function loadFeedback() {
  const response = await api.get(`${FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT}/${props.feedbackId}`, {
    params: { fields: FoodFeedbackChatHelper.LIST_FIELDS.join(',') },
  });
  feedback.value = response.data?.data ?? null;
}

async function loadMessages() {
  if (!chatId.value) {
    messages.value = [];
    return;
  }
  const response = await api.get(FoodFeedbackChatHelper.CHAT_MESSAGES_ENDPOINT, {
    params: {
      fields: FoodFeedbackChatHelper.MESSAGE_FIELDS.join(','),
      filter: JSON.stringify({ chat: { _eq: chatId.value } }),
      sort: 'date_created',
      limit: -1,
    },
  });
  const previousCount = messages.value.length;
  messages.value = ChatHelper.sortMessagesChronologically(response.data?.data ?? []);
  if (messages.value.length !== previousCount) {
    scrollToBottom();
  }
}

async function load() {
  loading.value = true;
  try {
    await loadFeedback();
    await loadMessages();
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading food feedback chat failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** Creates the chat on the first answer and links it to the feedback. */
async function ensureChat(): Promise<string> {
  const current = feedback.value;
  if (!current) {
    throw new Error('feedback not loaded');
  }
  if (chatId.value) {
    return chatId.value;
  }
  const profileId = RelationHelper.getId(current.profile);
  if (!profileId) {
    throw new Error('feedback has no profile');
  }
  // The author sees the chat title in the app, so it is written in the author's language.
  const authorLanguage = FoodFeedbackChatStatusHelper.getAuthorLanguage(current);
  const food = foodName.value || AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_unknown_food, authorLanguage);
  const alias = AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, authorLanguage, { food });

  const chatResponse = await api.post(FoodFeedbackChatHelper.CHATS_ENDPOINT, FoodFeedbackChatStatusHelper.buildChatForFeedback(current, alias));
  const createdChatId = String(chatResponse.data?.data?.id);
  await api.post(FoodFeedbackChatHelper.CHATS_PARTICIPANTS_ENDPOINT, ChatHelper.buildParticipant(createdChatId, profileId));
  await api.patch(`${FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT}/${current.id}`, { chat: createdChatId });
  return createdChatId;
}

async function setConversationState(state: ChatConversationState) {
  if (!chatId.value) {
    return;
  }
  await api.patch(`${FoodFeedbackChatHelper.CHATS_ENDPOINT}/${chatId.value}`, { conversation_state: state });
}

async function sendMessage() {
  const text = newMessage.value.trim();
  if (!text || sending.value || !canWrite.value) {
    return;
  }
  sending.value = true;
  try {
    const targetChatId = await ensureChat();
    await api.post(FoodFeedbackChatHelper.CHAT_MESSAGES_ENDPOINT, { chat: targetChatId, message: text });
    newMessage.value = '';
    await loadFeedback();
    // Set explicitly as well: the hook only recognises support by the app access of the writer.
    await setConversationState(ChatHelper.getConversationStateAfterMessage(true));
    await loadFeedback();
    await loadMessages();
  } catch (error) {
    console.error('[rocket-meals-module] sending chat message failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
  } finally {
    sending.value = false;
  }
}

/**
 * Sets the status by hand. A feedback without chat gets one first – the status lives in
 * `chats.conversation_state`. Note: the author then sees the (still empty) chat in the app.
 */
async function changeStatus(nextStatus: FoodFeedbackChatStatus) {
  const nextState = FoodFeedbackChatStatusHelper.getConversationStateForStatus(nextStatus);
  if (!nextState || nextStatus === status.value || updatingState.value || !canWrite.value) {
    return;
  }
  updatingState.value = true;
  try {
    if (!chatId.value) {
      await ensureChat();
      await loadFeedback();
    }
    await setConversationState(nextState);
    await loadFeedback();
  } catch (error) {
    console.error('[rocket-meals-module] updating chat state failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_status_change_failed), type: 'error' });
  } finally {
    updatingState.value = false;
  }
}

/**
 * Like the chat of Claude: Enter sends, Shift+Enter starts a new line. On touch devices Enter
 * stays a new line – there is a send button right next to it. Ctrl/⌘+Enter always sends.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.isComposing) {
    return;
  }
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (event.ctrlKey || event.metaKey || (!event.shiftKey && !isTouchDevice)) {
    event.preventDefault();
    sendMessage();
  }
}

/** The input grows with its text up to a maximum height, then scrolls. */
const composerInput = ref<HTMLTextAreaElement>();
const COMPOSER_MAX_HEIGHT_PX = 240;
function resizeComposer() {
  const input = composerInput.value;
  if (!input) {
    return;
  }
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
}
watch(newMessage, () => nextTick(resizeComposer));

function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainer.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

let refreshInterval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  load().then(scrollToBottom);
  refreshInterval = setInterval(() => {
    if (!sending.value) {
      loadMessages().catch(() => undefined);
    }
  }, MESSAGE_REFRESH_INTERVAL_MS);
});
onBeforeUnmount(() => clearInterval(refreshInterval));
watch(() => props.feedbackId, load);
</script>

<template>
  <private-view :title="title" :icon="page.icon" show-back :back-to="RocketMealsModulePages.getRoute(page)">
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_open_feedback_item)" rounded icon secondary :to="`/content/foods_feedbacks/${feedbackId}`">
        <v-icon name="open_in_new" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="chat-page">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <template v-else-if="feedback">
        <div class="feedback-info">
          <v-menu show-arrow placement="bottom-start" :disabled="!canWrite || updatingState">
            <template #activator="{ toggle }">
              <button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_change_status)" class="status-button" :disabled="!canWrite || updatingState" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_change_status)" @click="toggle">
                <food-feedback-status-chip :status="status" />
                <v-progress-circular v-if="updatingState" indeterminate x-small />
                <v-icon v-else-if="canWrite" name="expand_more" small />
              </button>
            </template>
            <v-list>
              <v-list-item v-for="selectableStatus in FoodFeedbackChatStatusHelper.SELECTABLE_STATUSES" :key="selectableStatus" clickable :active="selectableStatus === status" @click="changeStatus(selectableStatus)">
                <v-list-item-icon>
                  <v-icon :name="FoodFeedbackChatHelper.getStatusPresentation(selectableStatus).icon" small />
                </v-list-item-icon>
                <v-list-item-content>{{ translate(FoodFeedbackChatHelper.getStatusPresentation(selectableStatus).labelKey) }}</v-list-item-content>
                <v-list-item-icon v-if="selectableStatus === status"><v-icon name="check" small /></v-list-item-icon>
              </v-list-item>
            </v-list>
          </v-menu>
          <span class="type-label">{{ foodName }}</span>
          <food-feedback-rating :rating="feedback.rating" />
          <span class="spacer" />
          <span class="type-note">
            <template v-if="FoodFeedbackChatHelper.getCanteenName(feedback)"> {{ translate(BackendTranslationKeys.rocket_meals_module_canteen) }}: {{ FoodFeedbackChatHelper.getCanteenName(feedback) }} · </template>
            {{ formatDateTime(feedback.date_created) }}
          </span>
        </div>

        <div ref="messagesContainer" class="messages">
          <div class="message from-user">
            <div class="message-author type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_user) }}</div>
            <div class="bubble">{{ feedback.comment }}</div>
            <div class="message-date type-note">{{ formatDateTime(feedback.date_created) }}</div>
          </div>

          <div v-for="message in messages" :key="message.id" class="message" :class="ChatHelper.isSupportMessage(message) ? 'from-support' : 'from-user'">
            <div class="message-author type-note">
              <template v-if="ChatHelper.isSupportMessage(message)">
                {{ translate(BackendTranslationKeys.rocket_meals_module_support) }}
                <template v-if="FoodFeedbackChatHelper.getSupportAuthorName(message)"> · {{ FoodFeedbackChatHelper.getSupportAuthorName(message) }}</template>
              </template>
              <template v-else>{{ translate(BackendTranslationKeys.rocket_meals_module_user) }}</template>
            </div>
            <div class="bubble">{{ message.message }}</div>
            <div class="message-date type-note">{{ formatDateTime(message.date_created) }}</div>
          </div>

          <div v-if="messages.length === 0" class="empty type-note">
            {{ canWrite ? translate(BackendTranslationKeys.rocket_meals_module_chat_empty) : translate(BackendTranslationKeys.rocket_meals_module_chat_not_possible) }}
          </div>
        </div>

        <div class="composer" :class="{ disabled: !canWrite }" @click="composerInput?.focus()">
          <textarea ref="composerInput" v-model="newMessage" class="composer-input" rows="1" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_message_placeholder)" :disabled="!canWrite || sending" @keydown="onKeydown" />
          <div class="composer-actions">
            <span class="composer-hint type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_send_hint) }}</span>
            <button v-tooltip.top="translate(BackendTranslationKeys.send)" class="send-button" :disabled="!canWrite || sending || newMessage.trim().length === 0" :aria-label="translate(BackendTranslationKeys.send)" @click.stop="sendMessage">
              <v-progress-circular v-if="sending" indeterminate x-small />
              <v-icon v-else name="arrow_upward" small />
            </button>
          </div>
        </div>
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

.feedback-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.spacer {
  flex: 1;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-block-size: 12rem;
  max-block-size: calc(100vh - 26rem);
  padding: 1.25rem;
  overflow-y: auto;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-inline-size: 75%;
}

.message.from-user {
  align-self: flex-start;
}

.message.from-support {
  align-self: flex-end;
  align-items: flex-end;
}

.bubble {
  padding: 0.75rem 1rem;
  white-space: pre-line;
  overflow-wrap: anywhere;
  background: var(--theme--background-accent);
  border-radius: 1rem 1rem 1rem 0.25rem;
}

.from-support .bubble {
  color: var(--foreground-inverted, #fff);
  background: var(--theme--primary);
  border-radius: 1rem 1rem 0.25rem 1rem;
}

.empty {
  align-self: center;
  max-inline-size: 30rem;
  margin-block: auto;
  text-align: center;
}

.status-button {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0;
  color: var(--theme--foreground-subdued);
  background: none;
  border: none;
  cursor: pointer;
}

.status-button:disabled {
  cursor: default;
}

/* Input like the chat of Claude: one rounded box, text on top, round send button bottom right. */
.composer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.75rem 0.625rem 1rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: 1.5rem;
  cursor: text;
  transition: border-color var(--fast) var(--transition);
}

.composer:focus-within {
  border-color: var(--theme--primary);
}

.composer.disabled {
  cursor: default;
  opacity: 0.6;
}

.composer-input {
  inline-size: 100%;
  min-block-size: 1.5rem;
  max-block-size: 15rem;
  padding: 0.25rem 0;
  color: var(--theme--foreground);
  font: inherit;
  line-height: 1.5;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
}

.composer-input::placeholder {
  color: var(--theme--foreground-subdued);
}

.composer-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
}

.composer-hint {
  margin-inline-end: auto;
}

.send-button {
  --v-icon-color: var(--foreground-inverted, #fff);

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  background: var(--theme--primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition:
    background var(--fast) var(--transition),
    opacity var(--fast) var(--transition);
}

.send-button:hover:not(:disabled) {
  background: var(--theme--primary-accent);
}

.send-button:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (pointer: coarse) {
  /* On touch devices Enter makes a new line, so the keyboard hint would be wrong. */
  .composer-hint {
    visibility: hidden;
  }

  /* iOS Safari zooms into inputs with a font smaller than 16px. */
  .composer-input {
    font-size: 16px;
  }
}
</style>
