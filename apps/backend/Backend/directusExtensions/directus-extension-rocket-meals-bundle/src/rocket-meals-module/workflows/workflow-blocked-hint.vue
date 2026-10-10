<script setup lang="ts">
/**
 * Why a workflow cannot run on this server although it is set up, e.g. that it needs the AI and none
 * is configured – with a link to where it is fixed. Stops its click, so a surrounding card does not open.
 */
import { computed } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { WorkflowBlockedReason, WorkflowsPageHelper, type WorkflowOverviewItem } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const props = defineProps<{ item: WorkflowOverviewItem }>();

const { translate } = useAppExtensionTranslate();

const reason = computed(() => WorkflowsPageHelper.getBlockedReason(props.item));
</script>

<template>
  <div v-if="reason === WorkflowBlockedReason.AI_NOT_CONFIGURED" class="blocked-hint">
    <v-icon name="smart_toy" x-small />
    <span>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_ai_not_configured) }}</span>
    <router-link :to="WorkflowsPageHelper.AI_SETTINGS_ROUTE" class="blocked-link" @click.stop @keydown.enter.stop>
      {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_configure_ai) }}
    </router-link>
  </div>
</template>

<style scoped>
.blocked-hint {
  --v-icon-color: var(--theme--warning);

  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
}

.blocked-link {
  color: var(--theme--primary);
  font-weight: 600;
}
</style>
