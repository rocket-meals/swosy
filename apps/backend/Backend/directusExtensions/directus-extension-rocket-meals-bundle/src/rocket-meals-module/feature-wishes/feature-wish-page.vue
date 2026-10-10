<script setup lang="ts">
/**
 * Details of a feature wish: what the author wrote, the suggestion of the AI, the decision
 * (publish, archive, back to review, merge into a published original), the progress, the public
 * and internal note, the duplicates merged into it and the chat with the author.
 *
 * Only the fields of the wish are written; the `feature-wishes-hook` clears an outdated original,
 * recounts the likes and pushes the author when the wish gets published.
 *
 * The chat is only created with the first message (`FeatureWishModuleActions.sendMessage`), so the
 * author never sees an empty chat in the app. Messages written here carry no profile – that is how
 * the app and `chat-conversation-state-hook` tell support messages from user messages. A wish
 * submitted without account has nobody to write to.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FeatureWishStatus } from 'repo-depkit-common/src/FeatureWishHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { FeatureWishModuleActions } from '../../helpers/rocket-meals-module/FeatureWishModuleActions';
import { FeatureWishModuleHelper, type FeatureWishListItem } from '../../helpers/rocket-meals-module/FeatureWishModuleHelper';
import type { FoodFeedbackChatMessage } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import ProfileAvatar from '../profiles/profile-avatar.vue';
import SupportChatConversation from '../support-chat/support-chat-conversation.vue';
import FeatureWishChip from './feature-wish-chip.vue';

const props = defineProps<{ wishId: string }>();

const api = useApi();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FEATURE_WISHES;

/** New messages of the author show up without reloading the page. */
const MESSAGE_REFRESH_INTERVAL_MS = 20000;

const wish = ref<FeatureWishListItem | null>(null);
const duplicates = ref<FeatureWishListItem[]>([]);
const mergeTargets = ref<{ id: string; title?: string | null; likes_amount?: number | null }[]>([]);
const chatMessages = ref<FoodFeedbackChatMessage[]>([]);
const loading = ref(false);
const loadError = ref(false);
const updating = ref(false);
const savingNotes = ref(false);

const mergeTargetId = ref<string | null>(null);
const publicNote = ref('');
const internNote = ref('');

const chatId = computed(() => RelationHelper.getId(wish.value?.chat));
const title = computed(() => (wish.value ? FeatureWishModuleHelper.getTitle(wish.value) : undefined) ?? translate(page.labelKey));
const suggestion = computed(() => (wish.value ? FeatureWishModuleHelper.getSuggestion(wish.value) : undefined));
const canChat = computed(() => !!wish.value && FeatureWishModuleHelper.canChat(wish.value));
const relatedToId = computed(() => (wish.value ? FeatureWishModuleHelper.getRelatedToId(wish.value) : undefined));
const relatedToTitle = computed(() => (wish.value ? FeatureWishModuleHelper.getRelatedToTitle(wish.value) : undefined));
const notesChanged = computed(() => (wish.value?.moderation_note_public ?? '') !== publicNote.value || (wish.value?.moderation_note_intern ?? '') !== internNote.value);

const progressItems = computed(() => [{ text: translate(BackendTranslationKeys.rocket_meals_module_feature_wish_progress_none), value: null }, ...FeatureWishModuleHelper.PROGRESSES.map(progress => ({ text: translate(FeatureWishModuleHelper.getProgressPresentation(progress)!.labelKey), value: progress }))]);
const mergeTargetItems = computed(() => mergeTargets.value.map(target => ({ text: `${target.title ?? target.id} (${FeatureWishModuleHelper.getLikes(target)})`, value: target.id })));

/** Title and description as the author wrote them – the first bubble of the chat. */
const opening = computed(() => {
  if (!wish.value) {
    return null;
  }
  return { text: FeatureWishModuleActions.getChatInitialMessage(wish.value), date: wish.value.date_created };
});

function getAuthorLabel(): string {
  return wish.value?.profile ? '' : translate(BackendTranslationKeys.rocket_meals_module_feature_wish_without_account);
}

function applyWish(loaded: FeatureWishListItem | null) {
  wish.value = loaded;
  publicNote.value = loaded?.moderation_note_public ?? '';
  internNote.value = loaded?.moderation_note_intern ?? '';
  mergeTargetId.value = loaded ? (FeatureWishModuleHelper.getRelatedToId(loaded) ?? null) : null;
}

async function loadWish() {
  const response = await api.get(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${props.wishId}`, {
    params: { fields: FeatureWishModuleHelper.LIST_FIELDS.join(',') },
  });
  applyWish(response.data?.data ?? null);
}

async function loadDuplicates() {
  const response = await api.get(FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, { params: FeatureWishModuleHelper.buildDuplicatesQuery(props.wishId) });
  duplicates.value = response.data?.data ?? [];
}

async function loadMergeTargets() {
  const response = await api.get(FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, { params: FeatureWishModuleHelper.buildMergeTargetsQuery(props.wishId) });
  mergeTargets.value = response.data?.data ?? [];
}

async function loadMessages() {
  if (!chatId.value) {
    chatMessages.value = [];
    return;
  }
  const response = await api.get(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { params: ChatQueryHelper.buildMessagesQuery(String(chatId.value)) });
  chatMessages.value = ChatHelper.sortMessagesChronologically(response.data?.data ?? []);
}

async function load() {
  loading.value = true;
  try {
    await loadWish();
    await Promise.all([loadDuplicates(), loadMergeTargets(), loadMessages()]);
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading feature wish failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** Runs a write, then reloads the wish; a failure shows a notification. */
async function update(write: () => Promise<unknown>) {
  if (!wish.value || updating.value) {
    return;
  }
  updating.value = true;
  try {
    await write();
    await loadWish();
  } catch (error) {
    console.error('[rocket-meals-module] updating feature wish failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_feature_wish_update_failed), type: 'error' });
  } finally {
    updating.value = false;
  }
}

function setStatus(status: FeatureWishStatus) {
  return update(() =>
    FeatureWishModuleActions.setStatus(api, [wish.value!], status).then(result => {
      if (result.failedIds.length > 0) {
        throw new Error('setting the status failed');
      }
    })
  );
}

function acceptSuggestion() {
  return update(() =>
    FeatureWishModuleActions.acceptSuggestions(api, [wish.value!]).then(result => {
      if (result.failedIds.length > 0) {
        throw new Error('accepting the suggestion failed');
      }
    })
  );
}

function merge() {
  const targetId = mergeTargetId.value;
  if (!targetId) {
    return;
  }
  return update(() => FeatureWishModuleActions.merge(api, wish.value!, targetId));
}

function setProgress(progress: string | null) {
  return update(() => FeatureWishModuleActions.setProgress(api, wish.value!, progress));
}

async function saveNotes() {
  if (!wish.value || savingNotes.value) {
    return;
  }
  savingNotes.value = true;
  try {
    const saved = await FeatureWishModuleActions.setNotes(api, wish.value, { public: publicNote.value, intern: internNote.value });
    applyWish({ ...wish.value, ...saved });
  } catch (error) {
    console.error('[rocket-meals-module] saving feature wish notes failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_feature_wish_update_failed), type: 'error' });
  } finally {
    savingNotes.value = false;
  }
}

/** Writes to the author; the first message creates the chat. */
async function sendMessage(text: string): Promise<boolean> {
  if (!wish.value || !canChat.value) {
    return false;
  }
  try {
    await FeatureWishModuleActions.sendMessage(api, wish.value, text);
  } catch (error) {
    console.error('[rocket-meals-module] sending feature wish message failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_send_failed), type: 'error' });
    return false;
  }
  // The message is saved – a failing reload must not look like a failed send.
  try {
    if (!chatId.value) {
      // Only the chat of the wish is reloaded, so notes being edited stay as they are.
      const response = await api.get(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${props.wishId}`, { params: { fields: 'chat.id,chat.conversation_state,chat.date_updated' } });
      wish.value = { ...wish.value, chat: response.data?.data?.chat ?? null };
    }
    await loadMessages();
  } catch (error) {
    console.error('[rocket-meals-module] reloading feature wish chat failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_load_failed), type: 'warning' });
  }
  return true;
}

let refreshInterval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  load();
  refreshInterval = setInterval(() => {
    loadMessages().catch(() => undefined);
  }, MESSAGE_REFRESH_INTERVAL_MS);
});
onBeforeUnmount(() => clearInterval(refreshInterval));
watch(() => props.wishId, load);
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_open_item)" rounded icon secondary :to="`/content/${CollectionNames.FEATURE_WHISHES}/${wishId}`">
        <v-icon name="open_in_new" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="wish-page">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <template v-else-if="wish">
        <div class="wish-info">
          <feature-wish-chip :presentation="FeatureWishModuleHelper.getStatusPresentation(wish.status)" />
          <feature-wish-chip v-if="FeatureWishModuleHelper.getProgressPresentation(wish.progress)" :presentation="FeatureWishModuleHelper.getProgressPresentation(wish.progress)!" />
          <span class="likes type-note">
            <v-icon name="thumb_up" x-small />
            {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_likes, { count: FeatureWishModuleHelper.getLikes(wish) }) }}
          </span>
          <span class="spacer" />
          <profile-avatar v-if="wish.profile" :profile="wish.profile" :size="28" with-name />
          <span class="meta type-note">
            <template v-if="getAuthorLabel()">{{ getAuthorLabel() }} · </template>{{ formatDateTime(wish.date_created) }}
          </span>
        </div>

        <div class="card">
          <div class="type-label">{{ FeatureWishModuleHelper.getTitle(wish) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</div>
          <div v-if="FeatureWishModuleHelper.getDescription(wish)" class="text">{{ FeatureWishModuleHelper.getDescription(wish) }}</div>
          <router-link v-if="relatedToId" class="related type-note" :to="RocketMealsModulePages.getRoute(page, relatedToId)">
            <v-icon name="merge" x-small />
            {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_duplicate_of, { title: relatedToTitle ?? relatedToId }) }}
          </router-link>
        </div>

        <div v-if="suggestion" class="card suggestion">
          <div class="card-title">
            <v-icon name="robot_2" small />
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_ai_suggestion, { suggestion: translate(suggestion.labelKey) }) }}</span>
          </div>
          <div v-if="wish.moderation_note_intern" class="text type-note">{{ wish.moderation_note_intern }}</div>
          <div class="actions">
            <v-button v-if="FeatureWishModuleHelper.canAcceptSuggestion(wish)" small :loading="updating" @click="acceptSuggestion">
              <v-icon :name="suggestion.icon" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_accept_suggestion, { suggestion: translate(suggestion.labelKey) }) }}
            </v-button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <v-icon name="gavel" small />
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_decision) }}</span>
          </div>
          <div class="actions start">
            <v-button v-if="FeatureWishModuleHelper.canPublish(wish)" small :loading="updating" @click="setStatus(FeatureWishStatus.PUBLISHED)">
              <v-icon name="public" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_publish) }}
            </v-button>
            <v-button v-if="FeatureWishModuleHelper.canArchive(wish)" small secondary :loading="updating" @click="setStatus(FeatureWishStatus.ARCHIVED)">
              <v-icon name="archive" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_archive) }}
            </v-button>
            <v-button v-if="!FeatureWishModuleHelper.isInReview(wish)" small secondary :loading="updating" @click="setStatus(FeatureWishStatus.DRAFT)">
              <v-icon name="undo" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_back_to_review) }}
            </v-button>
          </div>
          <div v-if="FeatureWishModuleHelper.canPublish(wish) && wish.profile" class="hint type-note">
            <v-icon name="notifications" x-small />
            {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_publish_hint) }}
          </div>
          <div class="field-row">
            <v-select v-model="mergeTargetId" class="grow" :items="mergeTargetItems" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_merge_target)" :disabled="updating || mergeTargetItems.length === 0" />
            <v-button small secondary :loading="updating" :disabled="!mergeTargetId || (wish.status === FeatureWishStatus.MERGED && mergeTargetId === relatedToId)" @click="merge">
              <v-icon name="merge" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_merge) }}
            </v-button>
          </div>
          <div class="field">
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_progress) }}</span>
            <v-select :model-value="wish.progress ?? null" :items="progressItems" :disabled="updating" @update:model-value="setProgress" />
          </div>
        </div>

        <div class="card">
          <div class="field">
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_note_public) }}</span>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_note_public_hint) }}</span>
            <v-textarea v-model="publicNote" :disabled="savingNotes" />
          </div>
          <div class="field">
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_note_intern) }}</span>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_note_intern_hint) }}</span>
            <v-textarea v-model="internNote" :disabled="savingNotes" />
          </div>
          <div class="actions">
            <v-button small :loading="savingNotes" :disabled="!notesChanged" @click="saveNotes">
              <v-icon name="save" left small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_save_notes) }}
            </v-button>
          </div>
        </div>

        <div v-if="duplicates.length > 0" class="card">
          <div class="card-title">
            <v-icon name="content_copy" small />
            <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_duplicates) }}</span>
          </div>
          <router-link v-for="duplicate in duplicates" :key="duplicate.id" class="duplicate" :to="RocketMealsModulePages.getRoute(page, duplicate.id)">
            <span class="type-label">{{ FeatureWishModuleHelper.getTitle(duplicate) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
            <span class="type-note">{{ formatDateTime(duplicate.date_created) }}</span>
          </router-link>
        </div>

        <div class="card-title">
          <v-icon name="forum" small />
          <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_chat) }}</span>
        </div>
        <support-chat-conversation v-if="canChat" :opening="opening" :user-profile="wish.profile" :messages="chatMessages" :can-write="canChat" :empty-text="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_chat_empty)" :send="sendMessage" />
        <v-notice v-else type="info">{{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_chat_not_possible) }}</v-notice>
      </template>

      <v-progress-circular v-else-if="loading" indeterminate />
    </div>
  </private-view>
</template>

<style scoped>
.wish-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-inline-size: 56rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.wish-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.card.suggestion {
  background: var(--theme--primary-background);
}

.card-title {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.likes,
.meta,
.related,
.hint {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.related {
  color: var(--theme--primary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.actions.start {
  justify-content: flex-start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.grow {
  flex: 1 1 16rem;
  min-inline-size: 0;
}

.duplicate {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  color: inherit;
  background: var(--theme--background-subdued);
  border-radius: var(--theme--border-radius);
}

.duplicate:hover {
  color: var(--theme--primary);
}

.spacer {
  flex: 1;
}
</style>
