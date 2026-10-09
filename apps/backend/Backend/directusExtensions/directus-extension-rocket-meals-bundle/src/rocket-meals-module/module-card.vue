<script setup lang="ts">
/**
 * The card of the `Rocket Meals` module: a large icon on the left, title and note on the right.
 * Used for the pages on the overview and for the workflow tiles.
 *
 * - `to` makes the whole card a link; without it the card emits `click` (Enter works too), so it can
 *   hold buttons of its own (`actions`, `aside`) – those must stop their click from reaching the card.
 * - Slots: `badge` sits on the corner of the icon, `actions` right of the title, the default slot
 *   below the title, `aside` right of the default slot (bottom aligned).
 */
defineProps<{
  icon: string;
  title: string;
  note?: string;
  /** Show the note in monospace, e.g. an id. */
  noteMonospace?: boolean;
  to?: string;
  /** Greys out icon, title and content, e.g. for something switched off. */
  inactive?: boolean;
}>();

const emit = defineEmits<{ (event: 'click'): void }>();
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="module-card" :class="{ inactive }" :role="to ? undefined : 'link'" :tabindex="to ? undefined : 0" @click="!to && emit('click')" @keydown.enter.self="!to && emit('click')">
    <div class="card-icon dim">
      <v-icon :name="icon" large />
      <div v-if="$slots.badge" class="card-badge"><slot name="badge" /></div>
    </div>
    <div class="card-body">
      <div class="card-head">
        <div class="card-title dim">
          <div class="type-title">{{ title }}</div>
          <div v-if="note" class="type-note" :class="{ monospace: noteMonospace }">{{ note }}</div>
        </div>
        <slot name="actions" />
      </div>
      <div v-if="$slots.default || $slots.aside" class="card-content">
        <div class="card-main dim"><slot /></div>
        <div v-if="$slots.aside" class="card-aside"><slot name="aside" /></div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.module-card {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  min-inline-size: 0;
  padding: 1.25rem;
  color: var(--theme--foreground);
  text-decoration: none;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: border-color var(--fast) var(--transition);
}

.module-card:hover,
.module-card:focus-visible {
  border-color: var(--theme--primary);
}

.module-card.inactive .dim {
  opacity: 0.55;
}

.card-icon {
  --v-icon-color: var(--theme--primary);

  position: relative;
  flex: none;
  align-self: flex-start;
}

.card-badge {
  position: absolute;
  inset-block-end: -0.125rem;
  inset-inline-end: -0.25rem;
  display: flex;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--theme--background-subdued);
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
  min-inline-size: 0;
}

.card-head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.card-title {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.monospace {
  font-family: var(--theme--fonts--monospace--font-family, monospace);
  font-size: 0.75rem;
}

.card-content {
  display: flex;
  flex: 1;
  gap: 0.75rem;
  align-items: flex-end;
}

.card-main {
  flex: 1;
  align-self: flex-start;
  min-inline-size: 0;
}

.card-aside {
  flex: none;
}
</style>
