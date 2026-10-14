<script setup lang="ts">
/**
 * The reaction of support to a food feedback, as split button: the main part reacts with one click
 * (thumbs up, or the reaction the AI recommends), the chevron opens a menu with every reaction and
 * "Reaktion entfernen". A reaction does not close the feedback.
 */
import { computed } from 'vue';
import { FoodFeedbackReactionHelper, type FoodFeedbackReaction } from 'repo-depkit-common/src/FoodFeedbackReactionHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ActionRecommendationModuleHelper } from '../../helpers/rocket-meals-module/ActionRecommendationModuleHelper';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const props = withDefaults(defineProps<{ reaction?: string | null; recommendedReaction?: FoodFeedbackReaction | null; highlighted?: boolean; loading?: boolean }>(), {
  reaction: null,
  recommendedReaction: null,
  highlighted: false,
  loading: false,
});
const emit = defineEmits<{ react: [reaction: FoodFeedbackReaction | null] }>();

const { translate } = useAppExtensionTranslate();

const current = computed(() => FoodFeedbackReactionHelper.getReaction({ support_reaction: props.reaction }));
const hasReaction = computed(() => FoodFeedbackReactionHelper.hasReaction({ support_reaction: props.reaction }));
/** What the main part shows: the reaction already given, else the recommended one, else thumbs up. */
const mainReaction = computed(() => current.value ?? props.recommendedReaction ?? FoodFeedbackReactionHelper.DEFAULT_REACTION);
const isRecommended = computed(() => !hasReaction.value && !!props.recommendedReaction);

function react(reaction: FoodFeedbackReaction | null) {
  if (reaction !== current.value || (reaction === null && hasReaction.value)) {
    emit('react', reaction);
  }
}
</script>

<template>
  <span class="reaction-button" @click.stop @keydown.stop>
    <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_reaction_hint)" class="main" small :secondary="!highlighted && !hasReaction" :loading="loading" @click="react(mainReaction)">
      <span class="emoji" aria-hidden="true">{{ mainReaction }}</span>
      {{ translate(FoodFeedbackChatHelper.getReactionLabelKey(mainReaction)) }}
      <v-icon v-if="hasReaction" name="check" right small />
      <v-icon v-else-if="isRecommended" v-tooltip="translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_recommended)" class="recommended-badge" :name="ActionRecommendationModuleHelper.ICON" right small />
    </v-button>
    <v-menu show-arrow placement="bottom-end" :disabled="loading">
      <template #activator="{ toggle }">
        <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_reaction_more)" class="chevron" small icon :secondary="!highlighted && !hasReaction" :disabled="loading" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_reaction_more)" @click="toggle">
          <v-icon name="expand_more" small />
        </v-button>
      </template>
      <v-list>
        <v-list-item v-for="option in FoodFeedbackReactionHelper.REACTIONS" :key="option" clickable :active="option === current" @click="react(option)">
          <v-list-item-icon
            ><span class="emoji" aria-hidden="true">{{ option }}</span></v-list-item-icon
          >
          <v-list-item-content>{{ translate(FoodFeedbackChatHelper.getReactionLabelKey(option)) }}</v-list-item-content>
          <v-list-item-icon v-if="option === current"><v-icon name="check" small /></v-list-item-icon>
          <v-list-item-icon v-else-if="option === recommendedReaction && !hasReaction"><v-icon :name="ActionRecommendationModuleHelper.ICON" small /></v-list-item-icon>
        </v-list-item>
        <template v-if="hasReaction">
          <v-divider />
          <v-list-item clickable @click="react(null)">
            <v-list-item-icon><v-icon name="close" small /></v-list-item-icon>
            <v-list-item-content>{{ translate(BackendTranslationKeys.rocket_meals_module_reaction_remove) }}</v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </span>
</template>

<style scoped>
.reaction-button {
  display: inline-flex;
  align-items: center;
}

.reaction-button .main :deep(.button) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.reaction-button .chevron :deep(.button) {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-inline-start: 1px solid var(--theme--border-color-subdued);
}

.emoji {
  margin-inline-end: 0.375rem;
  font-size: 1.1em;
  line-height: 1;
}
</style>
