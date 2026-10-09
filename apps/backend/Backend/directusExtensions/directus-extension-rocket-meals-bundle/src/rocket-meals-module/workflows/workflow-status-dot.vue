<script setup lang="ts">
/**
 * The traffic light of a workflow or a run: green = went through, red = failed, pulsing = running,
 * green ring = skipped (nothing to do), dashed = nothing finished yet.
 */
defineProps<{
  /** `WorkflowHealth` of a workflow or the `state` of a run. */
  state: string | null | undefined;
  title?: string;
  small?: boolean;
}>();
</script>

<template>
  <span class="status-dot" :class="[`state-${state ?? 'never'}`, { small }]" :title="title" role="img" :aria-label="title" />
</template>

<style scoped>
.status-dot {
  --status-dot-success: var(--theme--success, #2ecda7);
  --status-dot-danger: var(--theme--danger, #e35169);
  --status-dot-running: var(--theme--primary);

  position: relative;
  display: inline-block;
  flex: none;
  inline-size: 0.875rem;
  block-size: 0.875rem;
  border-radius: 50%;
  border: 2px dashed var(--theme--border-color);
}

.status-dot.small {
  inline-size: 0.5rem;
  block-size: 0.5rem;
}

.state-success {
  background: var(--status-dot-success);
  border: 0;
}

.state-skipped {
  border: 3px solid var(--status-dot-success);
}

.small.state-skipped {
  border-width: 2px;
}

.state-failed {
  background: var(--status-dot-danger);
  border: 0;
}

.state-running {
  background: var(--status-dot-running);
  border: 0;
}

.state-running::after {
  position: absolute;
  inset: -4px;
  border: 2px solid var(--status-dot-running);
  border-radius: 50%;
  animation: status-dot-pulse 1.4s ease-out infinite;
  content: '';
}

@keyframes status-dot-pulse {
  from {
    transform: scale(0.6);
    opacity: 1;
  }
  to {
    transform: scale(1.5);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-running::after {
    animation: none;
    opacity: 0.4;
  }
}
</style>
