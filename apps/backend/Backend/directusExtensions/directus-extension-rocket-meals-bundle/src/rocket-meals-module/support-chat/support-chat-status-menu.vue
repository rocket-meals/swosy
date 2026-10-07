<script setup lang="ts">
/** The status chip of a support chat that opens a menu to set the status by hand. */
import { FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';

defineProps<{ status: FoodFeedbackChatStatus; canWrite: boolean; updating: boolean }>();
const emit = defineEmits<{ change: [status: FoodFeedbackChatStatus] }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <v-menu show-arrow placement="bottom-start" :disabled="!canWrite || updating">
    <template #activator="{ toggle }">
      <button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_change_status)" class="status-button" :disabled="!canWrite || updating" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_change_status)" @click="toggle">
        <food-feedback-status-chip :status="status" />
        <v-progress-circular v-if="updating" indeterminate x-small />
        <v-icon v-else-if="canWrite" name="expand_more" small />
      </button>
    </template>
    <v-list>
      <v-list-item v-for="selectableStatus in FoodFeedbackChatStatusHelper.SELECTABLE_STATUSES" :key="selectableStatus" clickable :active="selectableStatus === status" @click="emit('change', selectableStatus)">
        <v-list-item-icon>
          <v-icon :name="FoodFeedbackChatHelper.getStatusPresentation(selectableStatus).icon" small />
        </v-list-item-icon>
        <v-list-item-content>{{ translate(FoodFeedbackChatHelper.getStatusPresentation(selectableStatus).labelKey) }}</v-list-item-content>
        <v-list-item-icon v-if="selectableStatus === status"><v-icon name="check" small /></v-list-item-icon>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
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
</style>
