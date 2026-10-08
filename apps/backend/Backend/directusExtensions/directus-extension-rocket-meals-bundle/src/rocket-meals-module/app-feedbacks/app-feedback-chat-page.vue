<script setup lang="ts">
/**
 * Chat with the author of an app feedback.
 *
 * Title and content of the feedback open the conversation. Usually the `app-feedbacks-hook`
 * created the chat already; otherwise the first answer creates it the same way
 * (`AppFeedbackChatStatusHelper.buildChatForFeedback`). Messages written here carry no profile –
 * that is how the app and `chat-conversation-state-hook` tell support messages from user messages.
 *
 * A store review has no chat: the answer is written to `app_feedbacks.response`, and the
 * `app-reviews-pull-hook` publishes it in the App Store or on Google Play.
 *
 * A feedback without profile but with a contact email has no chat either: there is one answer
 * field instead, the answer goes to `app_feedbacks.response`, the `app-feedbacks-hook` mails it and
 * the feedback is done. Without contact email (anonymous) it can only be marked as done.
 *
 * A feedback without chat that will not get one – a store review or one without profile – can
 * still be marked as done (and opened again) without answering; that is kept in
 * `app_feedbacks.state`.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { AppFeedbackChatStatusHelper } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { AppFeedbackChatActions } from '../../helpers/rocket-meals-module/AppFeedbackChatActions';
import { AppFeedbackAnswerChannel, AppFeedbackChatHelper, type AppFeedbackListItem } from '../../helpers/rocket-meals-module/AppFeedbackChatHelper';
import { FoodFeedbackChatHelper, type FoodFeedbackChatMessage } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { SupportChatActions } from '../../helpers/rocket-meals-module/SupportChatActions';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from '../food-feedbacks/food-feedback-rating.vue';
import SupportChatConversation from '../support-chat/support-chat-conversation.vue';
import SupportChatStatusMenu from '../support-chat/support-chat-status-menu.vue';

const props = defineProps<{ feedbackId: string }>();

const api = useApi();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.APP_FEEDBACKS;

/** New messages of the user show up without reloading the page. */
const MESSAGE_REFRESH_INTERVAL_MS = 20000;

const feedback = ref<AppFeedbackListItem | null>(null);
const chatMessages = ref<FoodFeedbackChatMessage[]>([]);
const loading = ref(false);
const loadError = ref(false);
const sending = ref(false);
const updatingState = ref(false);

const mailAnswer = ref('');

const chatId = computed(() => RelationHelper.getId(feedback.value?.chat));
const answerChannel = computed(() => (feedback.value ? AppFeedbackChatHelper.getAnswerChannel(feedback.value) : AppFeedbackAnswerChannel.NONE));
const isStoreReview = computed(() => answerChannel.value === AppFeedbackAnswerChannel.STORE);
/** Answered by mail or not at all – no chat window, see the header comment. */
const isWithoutConversation = computed(() => answerChannel.value === AppFeedbackAnswerChannel.MAIL || answerChannel.value === AppFeedbackAnswerChannel.NONE);
const contactEmail = computed(() => (feedback.value ? AppFeedbackChatHelper.getContactEmail(feedback.value) : undefined));
const sentMailAnswer = computed(() => (answerChannel.value === AppFeedbackAnswerChannel.MAIL ? feedback.value?.response?.trim() || undefined : undefined));
const status = computed(() => (feedback.value ? AppFeedbackChatStatusHelper.getStatus(feedback.value) : FoodFeedbackChatStatus.NEW));
const canWrite = computed(() => !!feedback.value && (isStoreReview.value || AppFeedbackChatStatusHelper.canStartChat(feedback.value)));
const isStatusWithoutChat = computed(() => !!feedback.value && AppFeedbackChatStatusHelper.isStatusWithoutChat(feedback.value));
/** The statuses the menu offers: every chat status, or open / done for a feedback without chat. */
const selectableStatuses = computed<FoodFeedbackChatStatus[]>(() => {
  if (!feedback.value || !isStatusWithoutChat.value) {
    return [...FoodFeedbackChatStatusHelper.SELECTABLE_STATUSES];
  }
  return [AppFeedbackChatStatusHelper.getOpenStatus(feedback.value), FoodFeedbackChatStatus.RESOLVED];
});
const userNickname = computed(() => FoodFeedbackChatHelper.getNickname(feedback.value?.profile));
const userLabel = computed(() => (userNickname.value ? translate(BackendTranslationKeys.rocket_meals_module_user_with_nickname, { nickname: userNickname.value }) : translate(BackendTranslationKeys.rocket_meals_module_user)));
const feedbackTitle = computed(() => (feedback.value ? AppFeedbackChatHelper.getTitle(feedback.value) : undefined));
const title = computed(() => feedbackTitle.value || translate(page.labelKey));

/** Title and content as the user wrote them – the first bubble of the conversation. */
const opening = computed(() => {
  if (!feedback.value) {
    return null;
  }
  const text = [AppFeedbackChatHelper.getTitle(feedback.value), AppFeedbackChatHelper.getContent(feedback.value)].filter(part => !!part).join('\n\n');
  return { text, date: feedback.value.date_created };
});

/** A store review shows its public answer as the one support message. */
const messages = computed<FoodFeedbackChatMessage[]>(() => {
  if (!isStoreReview.value) {
    return chatMessages.value;
  }
  const response = feedback.value?.response?.trim();
  return response ? [{ id: 'store-response', message: response, date_created: feedback.value?.date_updated, profile: null }] : [];
});

const emptyText = computed(() => {
  if (isStoreReview.value) {
    return translate(BackendTranslationKeys.rocket_meals_module_store_review_hint);
  }
  return canWrite.value ? translate(BackendTranslationKeys.rocket_meals_module_chat_empty) : translate(BackendTranslationKeys.rocket_meals_module_chat_not_possible);
});

async function loadFeedback() {
  const response = await api.get(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${props.feedbackId}`, {
    params: { fields: AppFeedbackChatHelper.LIST_FIELDS.join(',') },
  });
  feedback.value = response.data?.data ?? null;
}

async function loadMessages() {
  if (!chatId.value) {
    chatMessages.value = [];
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
  chatMessages.value = ChatHelper.sortMessagesChronologically(response.data?.data ?? []);
}

async function load() {
  loading.value = true;
  try {
    await loadFeedback();
    await loadMessages();
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading app feedback chat failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function ensureChat(): Promise<string> {
  if (!feedback.value) {
    throw new Error('app feedback not loaded');
  }
  return AppFeedbackChatActions.ensureChat(api, feedback.value);
}

async function setConversationState(state: ChatConversationState) {
  if (!chatId.value) {
    return;
  }
  await SupportChatActions.setConversationState(api, chatId.value, state);
}

/** Sends an answer – as chat message, or for a store review as its public answer. */
async function sendMessage(text: string): Promise<boolean> {
  if (!canWrite.value || !feedback.value) {
    return false;
  }
  sending.value = true;
  try {
    if (isStoreReview.value) {
      await AppFeedbackChatActions.setStoreResponse(api, feedback.value, text);
      await loadFeedback();
      return true;
    }
    const targetChatId = await ensureChat();
    await api.post(FoodFeedbackChatHelper.CHAT_MESSAGES_ENDPOINT, { chat: targetChatId, message: text });
    await loadFeedback();
    // Set explicitly as well: the hook only recognises support by the app access of the writer.
    await setConversationState(ChatHelper.getConversationStateAfterMessage(true));
    await loadFeedback();
    await loadMessages();
    return true;
  } catch (error) {
    console.error('[rocket-meals-module] sending app feedback answer failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
    return false;
  } finally {
    sending.value = false;
  }
}

/** Answers a feedback without profile by mail – it is done afterwards. */
async function sendMailAnswer() {
  const text = mailAnswer.value.trim();
  if (!feedback.value || !text || sending.value) {
    return;
  }
  sending.value = true;
  try {
    await AppFeedbackChatActions.sendMailResponse(api, feedback.value, text);
    mailAnswer.value = '';
  } catch (error) {
    console.error('[rocket-meals-module] sending app feedback mail answer failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
    sending.value = false;
    return;
  }
  // The answer is saved and mailed – a failing reload must not look like a failed send.
  try {
    await loadFeedback();
  } catch (error) {
    console.error('[rocket-meals-module] reloading app feedback after mail answer failed', error);
    loadError.value = true;
  } finally {
    sending.value = false;
  }
}

/** Marks a feedback without chat as done or opens it again – no chat is created for it. */
async function changeStatusWithoutChat(nextStatus: FoodFeedbackChatStatus) {
  if (!feedback.value || nextStatus === status.value || updatingState.value) {
    return;
  }
  updatingState.value = true;
  try {
    await AppFeedbackChatActions.setResolvedWithoutChat(api, feedback.value, nextStatus === FoodFeedbackChatStatus.RESOLVED);
    await loadFeedback();
  } catch (error) {
    console.error('[rocket-meals-module] updating app feedback state failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_status_change_failed), type: 'error' });
  } finally {
    updatingState.value = false;
  }
}

/** Sets the status by hand. A feedback without chat gets one first – the status lives in `chats.conversation_state`. */
async function changeStatus(nextStatus: FoodFeedbackChatStatus) {
  if (isStatusWithoutChat.value) {
    await changeStatusWithoutChat(nextStatus);
    return;
  }
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

let refreshInterval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  load();
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_open_feedback_item)" rounded icon secondary :to="`/content/${CollectionNames.APP_FEEDBACKS}/${feedbackId}`">
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
          <support-chat-status-menu :status="status" :statuses="selectableStatuses" :can-write="canWrite || isStatusWithoutChat" :updating="updatingState" @change="changeStatus" />
          <v-icon v-if="AppFeedbackChatHelper.getTypeIcon(feedback)" :name="AppFeedbackChatHelper.getTypeIcon(feedback) ?? ''" small :class="AppFeedbackChatHelper.isPositive(feedback) ? 'positive' : 'negative'" />
          <span class="type-label">{{ feedbackTitle ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
          <food-feedback-rating :rating="feedback.source_rating_raw" />
          <span class="spacer" />
          <span class="meta type-note">
            <v-icon :name="AppFeedbackChatHelper.getSourceIcon(feedback)" x-small />
            {{ translate(AppFeedbackChatHelper.getSourceLabelKey(feedback)) }}
            <template v-if="AppFeedbackChatHelper.getDeviceDescription(feedback)"> · {{ AppFeedbackChatHelper.getDeviceDescription(feedback) }}</template>
            · {{ formatDateTime(feedback.date_created) }}
          </span>
          <div v-if="feedback.contact_email" class="contact">
            <v-icon name="mail" small />
            <span class="contact-label">{{ translate(BackendTranslationKeys.rocket_meals_module_contact_email) }}:</span>
            <a :href="`mailto:${feedback.contact_email}`">{{ feedback.contact_email }}</a>
          </div>
        </div>

        <template v-if="isWithoutConversation">
          <div class="feedback-text">
            <div class="type-note">{{ userLabel }} · {{ formatDateTime(opening?.date) }}</div>
            <div class="feedback-text-content">{{ opening?.text }}</div>
          </div>

          <div v-if="sentMailAnswer" class="feedback-text answered">
            <div class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_mail_answer_sent, { email: contactEmail ?? '' }) }}</div>
            <div class="feedback-text-content">{{ sentMailAnswer }}</div>
          </div>

          <template v-else-if="answerChannel === AppFeedbackAnswerChannel.MAIL">
            <div class="composer-note type-note">
              <v-icon name="mail" x-small />
              <span>{{ translate(BackendTranslationKeys.rocket_meals_module_mail_answer_hint, { email: contactEmail ?? '' }) }}</span>
            </div>
            <v-textarea v-model="mailAnswer" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_mail_answer_placeholder)" :disabled="sending" />
          </template>

          <v-notice v-else type="info">{{ translate(BackendTranslationKeys.rocket_meals_module_answer_not_possible) }}</v-notice>

          <div class="answer-actions">
            <v-button v-if="status !== FoodFeedbackChatStatus.RESOLVED" secondary :loading="updatingState" @click="changeStatus(FoodFeedbackChatStatus.RESOLVED)">
              <v-icon name="task_alt" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
            </v-button>
            <v-button v-if="answerChannel === AppFeedbackAnswerChannel.MAIL && !sentMailAnswer" :loading="sending" :disabled="mailAnswer.trim().length === 0" @click="sendMailAnswer">
              <v-icon name="send" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_send_mail) }}
            </v-button>
          </div>
        </template>

        <support-chat-conversation
          v-else
          :opening="opening"
          :user-nickname="userNickname"
          :messages="messages"
          :can-write="canWrite"
          :empty-text="emptyText"
          :placeholder="isStoreReview ? translate(BackendTranslationKeys.rocket_meals_module_store_response_placeholder) : undefined"
          :hint="isStoreReview ? translate(BackendTranslationKeys.rocket_meals_module_store_review_single_response) : undefined"
          :send="sendMessage"
        />
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

.meta {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.contact {
  display: flex;
  flex-basis: 100%;
  gap: 0.5rem;
  align-items: center;
}

.contact-label {
  color: var(--theme--foreground-subdued);
}

.contact a {
  color: var(--theme--primary);
  font-weight: 600;
}

.feedback-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.feedback-text.answered {
  background: var(--theme--primary-background);
}

.feedback-text-content {
  white-space: pre-wrap;
}

.composer-note {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.answer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.positive {
  --v-icon-color: var(--theme--success);
}

.negative {
  --v-icon-color: var(--theme--danger);
}

.spacer {
  flex: 1;
}
</style>
