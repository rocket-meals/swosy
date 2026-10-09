<script setup lang="ts">
/** The on / off switch of a workflow (`workflows.enabled`). Stops its click, so a surrounding card does not open. */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{
  enabled: boolean;
  /** Writes "Aktiv" / "Deaktiviert" next to the switch. */
  showLabel?: boolean;
}>();

const emit = defineEmits<{ (event: 'toggle'): void }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <button class="workflow-switch" role="switch" :aria-checked="enabled" :aria-label="translate(enabled ? BackendTranslationKeys.rocket_meals_module_workflows_disable : BackendTranslationKeys.rocket_meals_module_workflows_enable)" :title="translate(enabled ? BackendTranslationKeys.rocket_meals_module_workflows_disable : BackendTranslationKeys.rocket_meals_module_workflows_enable)" @click.stop.prevent="emit('toggle')" @keydown.enter.stop>
    <span class="track" />
    <span v-if="showLabel">{{ translate(enabled ? BackendTranslationKeys.rocket_meals_module_workflows_enabled : BackendTranslationKeys.rocket_meals_module_workflows_disabled) }}</span>
  </button>
</template>

<style scoped>
.workflow-switch {
  display: inline-flex;
  flex: none;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem;
  color: var(--theme--foreground);
  background: none;
  cursor: pointer;
}

.track {
  position: relative;
  display: block;
  inline-size: 2.25rem;
  block-size: 1.25rem;
  background: var(--theme--border-color);
  border-radius: 1rem;
  transition: background var(--fast) var(--transition);
}

.track::after {
  position: absolute;
  inset-block-start: 2px;
  inset-inline-start: 2px;
  inline-size: calc(1.25rem - 4px);
  block-size: calc(1.25rem - 4px);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform var(--fast) var(--transition);
  content: '';
}

.workflow-switch[aria-checked='true'] .track {
  background: var(--theme--primary);
}

.workflow-switch[aria-checked='true'] .track::after {
  transform: translateX(1rem);
}
</style>
