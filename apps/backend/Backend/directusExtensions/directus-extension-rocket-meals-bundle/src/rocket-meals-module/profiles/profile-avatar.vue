<script setup lang="ts">
/**
 * The avatar of a profile, as the app draws it (`profile-avatar-endpoint`), with initials when the
 * profile has none. A click opens the profile page of the module. With `withName` it becomes a chip
 * with the nickname next to the avatar, e.g. in the header of a chat.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, ref, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ProfileDetailsHelper, type ModuleProfile } from '../../helpers/rocket-meals-module/ProfileDetailsHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const props = withDefaults(
  defineProps<{
    profile: ModuleProfile | string | null | undefined;
    /** Edge length in px. */
    size?: number;
    /** Whether a click opens the profile page. */
    link?: boolean;
    /** Shows the nickname next to the avatar. */
    withName?: boolean;
  }>(),
  { size: 32, link: true, withName: false }
);

const api = useApi();
const { translate } = useAppExtensionTranslate();
const apiRoot = String(api.defaults?.baseURL ?? '/');

/** The endpoint could not draw the avatar (e.g. an unknown style) – initials instead. */
const failed = ref(false);
watch(
  () => props.profile,
  () => {
    failed.value = false;
  }
);

const imageUrl = computed(() => (failed.value ? undefined : ProfileDetailsHelper.getAvatarUrl(props.profile, props.size, apiRoot)));
const route = computed(() => (props.link ? ProfileDetailsHelper.getRoute(props.profile) : undefined));
const name = computed(() => ProfileDetailsHelper.getNickname(props.profile) ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname));
const sizeStyle = computed(() => ({ inlineSize: `${props.size}px`, blockSize: `${props.size}px`, fontSize: `${Math.max(10, Math.round(props.size * 0.36))}px` }));
</script>

<template>
  <component :is="route ? 'router-link' : 'span'" :to="route" class="profile-avatar" :class="{ chip: withName, linked: !!route }" :title="route ? translate(BackendTranslationKeys.rocket_meals_module_profile_open) : undefined">
    <img v-if="imageUrl" class="avatar" :style="sizeStyle" :src="imageUrl" alt="" loading="lazy" @error="failed = true" />
    <span v-else class="avatar initials" :style="sizeStyle">{{ ProfileDetailsHelper.getInitials(profile) }}</span>
    <span v-if="withName" class="name">{{ name }}</span>
  </component>
</template>

<style scoped>
.profile-avatar {
  display: inline-flex;
  flex: none;
  gap: 0.5rem;
  align-items: center;
  min-inline-size: 0;
  color: inherit;
  text-decoration: none;
}

.profile-avatar.chip {
  padding: 0.125rem 0.75rem 0.125rem 0.125rem;
  background: var(--theme--background-normal);
  border-radius: 999px;
}

.profile-avatar.linked:hover .name,
.profile-avatar.linked:focus-visible .name {
  text-decoration: underline;
}

.profile-avatar.linked:hover .avatar,
.profile-avatar.linked:focus-visible .avatar {
  box-shadow: 0 0 0 2px var(--theme--primary);
}

.avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 50%;
  transition: box-shadow var(--fast) var(--transition);
}

.initials {
  color: var(--theme--foreground-subdued);
  font-weight: 600;
  background: var(--theme--background-accent);
}

.name {
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
