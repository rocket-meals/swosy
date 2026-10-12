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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatActions } from '../../helpers/rocket-meals-module/FoodFeedbackChatActions';
import { FoodFeedbackChatHelper, type FoodFeedbackChatMessage, type FoodFeedbackListItem } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ChatQueryHelper } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { ActionRecommendationModuleHelper, type ModuleActionRecommendation } from '../../helpers/rocket-meals-module/ActionRecommendationModuleHelper';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { SupportChatActions } from '../../helpers/rocket-meals-module/SupportChatActions';
import { ModuleDeleteActions } from '../../helpers/rocket-meals-module/ModuleDeleteActions';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import DeleteConfirmDialog from '../module-list/delete-confirm-dialog.vue';
import ProfileAvatar from '../profiles/profile-avatar.vue';
import SupportChatConversation from '../support-chat/support-chat-conversation.vue';
import SupportChatStatusMenu from '../support-chat/support-chat-status-menu.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';

const props = defineProps<{ feedbackId: string }>();

const api = useApi();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const router = useRouter();
const route = useRoute();

const deleteDialogOpen = ref(false);
const deleting = ref(false);

/** Deletes the feedback with its chat and messages after the question in the dialog, then goes back to the list. */
async function deleteCurrent() {
  if (!feedback.value) {
    return;
  }
  deleting.value = true;
  try {
    const result = await ModuleDeleteActions.deleteItems(api, FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, [feedback.value]);
    if (result.failedIds.length > 0) {
      notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_delete_failed), type: 'error' });
      return;
    }
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_deleted, { count: 1 }), type: 'success' });
    deleteDialogOpen.value = false;
    await router.push(RocketMealsModulePages.getRoute(page));
  } finally {
    deleting.value = false;
  }
}
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

/** The open AI recommendation of this feedback: its draft reply is offered in the input. */
const recommendation = ref<ModuleActionRecommendation | null>(null);
const draftReply = computed(() => ActionRecommendationModuleHelper.getDraftReply(recommendation.value));
/** Set by "Chat mit Vorschlag starten" in the list. */
const useDraft = computed(() => route.query[ActionRecommendationModuleHelper.USE_DRAFT_QUERY] !== undefined);

async function loadRecommendation() {
  const byItem = await ActionRecommendationModuleHelper.loadOpen(api, CollectionNames.FOODS_FEEDBACKS, [props.feedbackId]);
  recommendation.value = byItem[props.feedbackId] ?? null;
}

/** Once support answered or closed the feedback, the recommendation is used up. */
async function archiveRecommendation() {
  if (!recommendation.value) {
    return;
  }
  try {
    await ActionRecommendationModuleHelper.archive(api, [recommendation.value]);
    recommendation.value = null;
  } catch (error) {
    console.error('[rocket-meals-module] archiving the action recommendation failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_update_failed), type: 'warning' });
  }
}

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
  const response = await api.get(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { params: ChatQueryHelper.buildMessagesQuery(String(chatId.value)) });
  messages.value = ChatHelper.sortMessagesChronologically(response.data?.data ?? []);
}

async function load() {
  loading.value = true;
  try {
    await loadFeedback();
    await loadMessages();
    await loadRecommendation();
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
  if (!feedback.value) {
    throw new Error('feedback not loaded');
  }
  return FoodFeedbackChatActions.ensureChat(api, feedback.value);
}

async function setConversationState(state: ChatConversationState) {
  if (!chatId.value) {
    return;
  }
  await SupportChatActions.setConversationState(api, String(chatId.value), state);
}

/** Sends an answer; resolves `true` when it was sent, so the input is cleared. */
async function sendMessage(text: string): Promise<boolean> {
  if (!canWrite.value) {
    return false;
  }
  sending.value = true;
  try {
    const targetChatId = await ensureChat();
    await api.post(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { chat: targetChatId, message: text });
    await archiveRecommendation();
  } catch (error) {
    console.error('[rocket-meals-module] sending chat message failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
    sending.value = false;
    return false;
  }
  // The message is saved – what follows only updates the page, so a failure there must not look like a failed send.
  try {
    await loadFeedback();
    // Set explicitly as well: the hook only recognises support by the app access of the writer.
    await setConversationState(ChatHelper.getConversationStateAfterMessage(true));
    await loadFeedback();
    await loadMessages();
  } catch (error) {
    console.error('[rocket-meals-module] reloading food feedback chat after the answer failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_load_failed), type: 'warning' });
  } finally {
    sending.value = false;
  }
  return true;
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
    if (nextStatus === FoodFeedbackChatStatus.RESOLVED) {
      await archiveRecommendation();
    }
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
      <v-button v-if="feedback" v-tooltip.bottom="translate(BackendTranslationKeys.delete)" rounded icon secondary kind="danger" :loading="deleting" :aria-label="translate(BackendTranslationKeys.delete)" @click="deleteDialogOpen = true">
        <v-icon name="delete" />
      </v-button>
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
          <support-chat-status-menu :status="status" :can-write="canWrite" :updating="updatingState" @change="changeStatus" />
          <span class="type-label">{{ foodName }}</span>
          <food-feedback-rating :rating="feedback.rating" />
          <span class="spacer" />
          <profile-avatar v-if="feedback.profile" :profile="feedback.profile" :size="28" with-name />
          <span class="type-note">
            <template v-if="FoodFeedbackChatHelper.getCanteenName(feedback)"> {{ translate(BackendTranslationKeys.rocket_meals_module_canteen) }}: {{ FoodFeedbackChatHelper.getCanteenName(feedback) }} · </template>
            {{ formatDateTime(feedback.date_created) }}
          </span>
        </div>

        <support-chat-conversation
          :opening="FoodFeedbackChatStatusHelper.hasComment(feedback) ? { text: feedback.comment ?? '', date: feedback.date_created } : null"
          :user-profile="feedback.profile"
          :messages="messages"
          :can-write="canWrite"
          :empty-text="canWrite ? translate(BackendTranslationKeys.rocket_meals_module_chat_empty) : translate(BackendTranslationKeys.rocket_meals_module_chat_not_possible)"
          :send="sendMessage"
          :suggestion="draftReply"
          :use-suggestion="useDraft"
        />
      </template>

      <v-progress-circular v-else-if="loading" indeterminate />
    </div>
    <delete-confirm-dialog v-model="deleteDialogOpen" :count="1" :loading="deleting" @confirm="deleteCurrent" />
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
</style>
