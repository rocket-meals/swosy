<script setup lang="ts">
/**
 * Page "Freundesnetzwerk": all friendships as a network. Every profile is a circle (its avatar,
 * the start of its nickname or an anonymous dot), every friendship a line, an open request a
 * dashed line. A click on a profile shows its friends and open requests on the side.
 *
 * d3-force lays the network out once per load, d3-zoom handles zooming and panning, Vue draws
 * the SVG. The data rules (groups, filters, key figures) live in `FriendshipNetworkHelper`.
 */
import { useApi } from '@directus/extensions-sdk';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FriendshipNetworkHelper, FriendshipNetworkLinkStatus, type FriendshipNetwork, type FriendshipNetworkFriendship, type FriendshipNetworkNode, type FriendshipNetworkProfile } from '../../helpers/rocket-meals-module/FriendshipNetworkHelper';
import { LivePulseHelper } from '../../helpers/rocket-meals-module/LivePulseHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';

const api = useApi();
const { translate, language } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FRIENDSHIP_NETWORK;

enum DisplayMode {
  AVATARS = 'avatars',
  INITIALS = 'initials',
  ANONYMIZED = 'anonymized',
}

type Position = { x: number; y: number };
type LayoutNode = SimulationNodeDatum & { id: string; radius: number };
type LayoutLink = SimulationLinkDatum<LayoutNode> & { pending: boolean };

/** Ring colors of the groups with at least three profiles, largest group first, then repeated. */
const GROUP_COLORS = ['#3b5bdb', '#d9480f', '#0b7285', '#7048e8', '#2b8a3e', '#c2255c', '#e67700', '#1971c2'];
const LAYOUT_TICKS = 300;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const FIT_PADDING = 40;

const loading = ref(false);
const loadError = ref(false);
const network = shallowRef<FriendshipNetwork>({ nodes: [], links: [] });
/** Positions from d3-force, keyed by profile id. Replaced as a whole after every layout. */
const positions = shallowRef<Map<string, Position>>(new Map());

const showAccepted = ref(true);
const showPending = ref(true);
const minGroupSize = ref(FriendshipNetworkHelper.DEFAULT_MIN_GROUP_SIZE);
const displayMode = ref<DisplayMode>(DisplayMode.AVATARS);
const showNames = ref(false);
const search = ref('');
const searchMissed = ref(false);
const selectedId = ref<string | undefined>();

const svgElement = ref<SVGSVGElement | null>(null);
const transform = ref<ZoomTransform>(zoomIdentity);
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | undefined;
let svgSelection: Selection<SVGSVGElement, unknown, null, undefined> | undefined;

const anonymized = computed(() => displayMode.value === DisplayMode.ANONYMIZED);

const visibleNetwork = computed(() => FriendshipNetworkHelper.filterNetwork(network.value, { showAccepted: showAccepted.value, showPending: showPending.value, minGroupSize: minGroupSize.value }));

/** The key figures ignore the line checkboxes, hiding the lines does not make friendships go away. */
const stats = computed(() => FriendshipNetworkHelper.getStats(network.value, minGroupSize.value));

const numberFormat = computed(() => new Intl.NumberFormat(language.value, { maximumFractionDigits: 1 }));

const kpis = computed(() => [
  { key: 'profiles', value: stats.value.profilesWithFriends, label: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_profiles_with_friends) },
  { key: 'friendships', value: stats.value.friendships, label: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_friendships) },
  { key: 'pending', value: stats.value.pendingRequests, label: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_pending_requests) },
  { key: 'largest-group', value: stats.value.largestGroupSize, label: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_largest_group) },
  { key: 'average', value: stats.value.averageFriends, label: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_average_friends) },
]);

const groupSizeItems = computed(() =>
  FriendshipNetworkHelper.GROUP_SIZE_OPTIONS.map(size => ({
    value: size,
    text: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_group_size_min, { count: size }),
  }))
);

const displayItems = computed(() => [
  { value: DisplayMode.AVATARS, text: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_display_avatars) },
  { value: DisplayMode.INITIALS, text: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_display_initials) },
  { value: DisplayMode.ANONYMIZED, text: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_display_anonymized) },
]);

const apiRoot = String(api.defaults?.baseURL ?? '/');

/** Profiles whose avatar the endpoint could not draw, they get their initials instead. */
const failedAvatars = ref<Set<string>>(new Set());

function avatarUrl(profile: FriendshipNetworkProfile, size: number): string | undefined {
  if (displayMode.value !== DisplayMode.AVATARS || failedAvatars.value.has(profile.id)) {
    return undefined;
  }
  return LivePulseHelper.getAvatarUrl(profile, size, apiRoot);
}

function onAvatarError(profile: FriendshipNetworkProfile) {
  failedAvatars.value = new Set([...failedAvatars.value, profile.id]);
}

function initials(profile: FriendshipNetworkProfile): string {
  return anonymized.value ? '' : LivePulseHelper.getInitials(profile.nickname);
}

function displayName(profile: FriendshipNetworkProfile): string {
  if (anonymized.value) {
    return translate(BackendTranslationKeys.rocket_meals_module_friendship_network_anonymous_profile);
  }
  return profile.nickname?.trim() || translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname);
}

function groupColor(node: Pick<FriendshipNetworkNode, 'groupIndex' | 'groupSize'>): string {
  if (node.groupSize < 3 || node.groupIndex < 0) {
    return 'var(--theme--foreground-subdued)';
  }
  return GROUP_COLORS[node.groupIndex % GROUP_COLORS.length] ?? 'var(--theme--foreground-subdued)';
}

const nodesById = computed(() => new Map(network.value.nodes.map(node => [node.id, node])));

function profileColor(id: string): string | undefined {
  const node = nodesById.value.get(id);
  return node ? groupColor(node) : undefined;
}

const selectedNode = computed(() => {
  const id = selectedId.value;
  return id && visibleNetwork.value.nodes.some(node => node.id === id) ? nodesById.value.get(id) : undefined;
});

/** The selected profile and its direct neighbours (friends and open requests) stay fully visible. */
const highlighted = computed<Set<string> | undefined>(() => {
  const selected = selectedNode.value;
  if (!selected) {
    return undefined;
  }
  const ids = new Set([selected.id]);
  for (const link of visibleNetwork.value.links) {
    if (link.sourceId === selected.id) {
      ids.add(link.targetId);
    } else if (link.targetId === selected.id) {
      ids.add(link.sourceId);
    }
  }
  return ids;
});

const AVATAR_SIZE = LivePulseHelper.AVATAR_SIZE;

const renderNodes = computed(() => {
  const highlight = highlighted.value;
  return visibleNetwork.value.nodes.flatMap(node => {
    const position = positions.value.get(node.id);
    if (!position) {
      return [];
    }
    const radius = FriendshipNetworkHelper.getNodeRadius(node.friendCount);
    return [
      {
        node,
        x: position.x,
        y: position.y,
        radius,
        color: groupColor(node),
        selected: node.id === selectedId.value,
        dimmed: !!highlight && !highlight.has(node.id),
        avatar: avatarUrl(node.profile, AVATAR_SIZE),
        initials: initials(node.profile),
        label: anonymized.value || !showNames.value ? undefined : displayName(node.profile),
        ariaLabel: translate(BackendTranslationKeys.rocket_meals_module_friendship_network_node_label, { name: displayName(node.profile), count: node.friendCount }),
      },
    ];
  });
});

const renderLinks = computed(() => {
  const selected = selectedNode.value?.id;
  return visibleNetwork.value.links.flatMap(link => {
    const source = positions.value.get(link.sourceId);
    const target = positions.value.get(link.targetId);
    if (!source || !target) {
      return [];
    }
    const touchesSelected = !!selected && (link.sourceId === selected || link.targetId === selected);
    return [
      {
        key: link.key,
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
        pending: link.status === FriendshipNetworkLinkStatus.PENDING,
        active: touchesSelected,
        dimmed: !!selected && !touchesSelected,
      },
    ];
  });
});

const visibleIds = computed(() => new Set(visibleNetwork.value.nodes.map(node => node.id)));

const friends = computed(() => (selectedNode.value ? FriendshipNetworkHelper.getFriends(network.value, selectedNode.value.id) : []));
const requests = computed(() => (selectedNode.value ? FriendshipNetworkHelper.getRequests(network.value, selectedNode.value.id) : []));

function formatDate(date: string | null | undefined): string {
  if (!date) {
    return '';
  }
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? '' : new Intl.DateTimeFormat(language.value, { dateStyle: 'medium' }).format(value);
}

function friendsSince(date: string | null | undefined): string {
  const formatted = formatDate(date);
  return formatted ? translate(BackendTranslationKeys.rocket_meals_module_friendship_network_friends_since, { date: formatted }) : '';
}

function profileRoute(profile: FriendshipNetworkProfile): string {
  return RocketMealsModulePages.getProfileRoute(profile.id);
}

/** Runs d3-force to the end in one go: the network stands still once it shows up. */
function computeLayout(next: FriendshipNetwork): Map<string, Position> {
  const nodes: LayoutNode[] = next.nodes.map(node => ({ id: node.id, radius: FriendshipNetworkHelper.getNodeRadius(node.friendCount) }));
  const links: LayoutLink[] = next.links.map(link => ({ source: link.sourceId, target: link.targetId, pending: link.status === FriendshipNetworkLinkStatus.PENDING }));
  const simulation = forceSimulation<LayoutNode>(nodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutLink>(links)
        .id(node => node.id)
        .distance(link => (link.pending ? 90 : 60))
        .strength(link => (link.pending ? 0.05 : 0.6))
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-140))
    .force(
      'collide',
      forceCollide<LayoutNode>(node => node.radius + 6)
    )
    // Pulls separate groups towards the middle, otherwise they drift apart.
    .force('x', forceX<LayoutNode>(0).strength(0.06))
    .force('y', forceY<LayoutNode>(0).strength(0.06))
    .stop();
  simulation.tick(LAYOUT_TICKS);
  return new Map(nodes.map(node => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}

async function reload() {
  if (loading.value) {
    return;
  }
  loading.value = true;
  try {
    const response = await api.get(FriendshipNetworkHelper.FRIENDSHIPS_ENDPOINT, { params: FriendshipNetworkHelper.buildFriendshipsQuery() });
    const next = FriendshipNetworkHelper.buildNetwork((response.data?.data ?? []) as FriendshipNetworkFriendship[]);
    positions.value = computeLayout(next);
    network.value = next;
    loadError.value = false;
    await nextTick();
    fitToView();
  } catch (error) {
    console.error('[rocket-meals-module] loading friendship network failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** Zooms so all visible profiles fit into the drawing area. */
function fitToView() {
  const svg = svgElement.value;
  if (!svg || !zoomBehavior || !svgSelection) {
    return;
  }
  const items = renderNodes.value;
  if (items.length === 0) {
    zoomBehavior.transform(svgSelection, zoomIdentity.translate(svg.clientWidth / 2, svg.clientHeight / 2));
    return;
  }
  const minX = Math.min(...items.map(item => item.x - item.radius));
  const maxX = Math.max(...items.map(item => item.x + item.radius));
  const minY = Math.min(...items.map(item => item.y - item.radius));
  const maxY = Math.max(...items.map(item => item.y + item.radius));
  const width = Math.max(1, svg.clientWidth - 2 * FIT_PADDING);
  const height = Math.max(1, svg.clientHeight - 2 * FIT_PADDING);
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(width / Math.max(1, maxX - minX), height / Math.max(1, maxY - minY), 1.5)));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  zoomBehavior.transform(svgSelection, zoomIdentity.translate(svg.clientWidth / 2 - centerX * scale, svg.clientHeight / 2 - centerY * scale).scale(scale));
}

function zoomBy(factor: number) {
  if (zoomBehavior && svgSelection) {
    zoomBehavior.scaleBy(svgSelection, factor);
  }
}

/** Moves a profile into the middle without changing the zoom. */
function centerOn(id: string) {
  const position = positions.value.get(id);
  if (position && zoomBehavior && svgSelection) {
    zoomBehavior.translateTo(svgSelection, position.x, position.y);
  }
}

/** A click in the network selects a profile, a second click on it lets it go again. */
function toggleProfile(id: string) {
  selectedId.value = selectedId.value === id ? undefined : id;
}

function selectProfile(id: string, center = false) {
  selectedId.value = id;
  if (center) {
    centerOn(id);
  }
}

function onSearch() {
  const match = FriendshipNetworkHelper.searchNodes(visibleNetwork.value.nodes, search.value)[0];
  searchMissed.value = !match && search.value.trim().length > 0;
  if (match) {
    selectProfile(match.id, true);
  }
}

watch(search, () => {
  searchMissed.value = false;
});

/** `private-view` renders its content after the page is mounted, so zooming starts once the SVG exists. */
watch(svgElement, element => {
  svgSelection?.on('.zoom', null);
  svgSelection = undefined;
  zoomBehavior = undefined;
  if (!element) {
    return;
  }
  svgSelection = select(element);
  zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .on('zoom', event => {
      transform.value = event.transform;
    });
  svgSelection.call(zoomBehavior).on('dblclick.zoom', null);
  fitToView();
});

onMounted(() => {
  reload();
});

onBeforeUnmount(() => {
  svgSelection?.on('.zoom', null);
});

const clipPathId = `friendship-network-avatar-${Math.random().toString(36).slice(2)}`;
</script>

<template>
  <private-view :title="translate(page.labelKey)" :icon="page.icon">
    <template #headline>
      <v-breadcrumb :items="[{ name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() }]" />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="reload">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="friendship-network">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div class="kpis">
        <div v-for="kpi in kpis" :key="kpi.key" class="kpi">
          <span class="kpi-value">{{ numberFormat.format(kpi.value) }}</span>
          <span class="kpi-label type-note">{{ kpi.label }}</span>
        </div>
      </div>

      <div class="toolbar">
        <v-checkbox v-model="showAccepted" :label="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_show_accepted)" />
        <v-checkbox v-model="showPending" :label="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_pending_requests)" />
        <v-checkbox v-model="showNames" :disabled="anonymized" :label="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_show_names)" />
        <label class="field">
          <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_group_size) }}</span>
          <v-select v-model="minGroupSize" :items="groupSizeItems" inline />
        </label>
        <label class="field">
          <span class="type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_display) }}</span>
          <v-select v-model="displayMode" :items="displayItems" inline />
        </label>
        <div class="search">
          <v-input v-model="search" small :placeholder="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_search)" :disabled="anonymized" @keydown.enter="onSearch">
            <template #prepend><v-icon name="search" small /></template>
          </v-input>
          <span v-if="searchMissed" class="type-note search-missed">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_no_match) }}</span>
        </div>
      </div>

      <div class="columns">
        <section class="panel graph-panel">
          <div class="graph">
            <svg ref="svgElement" class="graph-svg" role="group" :aria-label="translate(page.labelKey)">
              <defs>
                <clipPath :id="clipPathId" clipPathUnits="objectBoundingBox">
                  <circle cx="0.5" cy="0.5" r="0.5" />
                </clipPath>
              </defs>
              <g :transform="`translate(${transform.x},${transform.y}) scale(${transform.k})`">
                <g class="links">
                  <line v-for="link in renderLinks" :key="link.key" class="link" :class="{ pending: link.pending, active: link.active, dimmed: link.dimmed }" :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2" />
                </g>
                <g v-for="item in renderNodes" :key="item.node.id" class="node" :class="{ selected: item.selected, dimmed: item.dimmed }" :transform="`translate(${item.x},${item.y})`" role="button" tabindex="0" :aria-label="item.ariaLabel" :aria-pressed="item.selected" @click="toggleProfile(item.node.id)" @keydown.enter.prevent="toggleProfile(item.node.id)" @keydown.space.prevent="toggleProfile(item.node.id)">
                  <title>{{ item.ariaLabel }}</title>
                  <circle class="node-fill" :r="item.radius" />
                  <image v-if="item.avatar" :href="item.avatar" :x="-item.radius" :y="-item.radius" :width="item.radius * 2" :height="item.radius * 2" :clip-path="`url(#${clipPathId})`" preserveAspectRatio="xMidYMid slice" @error="onAvatarError(item.node.profile)" />
                  <text v-else-if="item.initials" class="node-initials" text-anchor="middle" dominant-baseline="central" :font-size="Math.max(9, item.radius * 0.7)">{{ item.initials }}</text>
                  <circle class="node-ring" :r="item.radius" :style="{ stroke: item.color }" />
                  <text v-if="item.label" class="node-label" text-anchor="middle" :y="item.radius + 13">{{ item.label }}</text>
                </g>
              </g>
            </svg>

            <div v-if="!loading && !loadError && network.nodes.length === 0" class="graph-empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_empty) }}</div>
            <div v-else-if="!loading && network.nodes.length > 0 && renderNodes.length === 0" class="graph-empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_nothing_visible) }}</div>
            <div v-if="loading" class="graph-empty"><v-progress-circular indeterminate /></div>

            <div class="graph-hint type-note">{{ Math.round(transform.k * 100) }} % · {{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_zoom_hint) }}</div>
          </div>

          <div class="graph-footer type-note">
            <span class="legend-item"
              ><svg width="28" height="8" aria-hidden="true"><line class="legend-line" x1="1" y1="4" x2="27" y2="4" /></svg>{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_legend_friendship) }}</span
            >
            <span class="legend-item"
              ><svg width="28" height="8" aria-hidden="true"><line class="legend-line pending" x1="1" y1="4" x2="27" y2="4" /></svg>{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_legend_pending) }}</span
            >
            <span class="legend-item">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_legend_size) }}</span>
            <div class="zoom-buttons">
              <v-button v-tooltip.top="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_zoom_in)" icon secondary small @click="zoomBy(1.3)">
                <v-icon name="add" />
              </v-button>
              <v-button v-tooltip.top="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_zoom_out)" icon secondary small @click="zoomBy(1 / 1.3)">
                <v-icon name="remove" />
              </v-button>
              <v-button v-tooltip.top="translate(BackendTranslationKeys.rocket_meals_module_friendship_network_zoom_fit)" icon secondary small @click="fitToView">
                <v-icon name="fit_screen" />
              </v-button>
            </div>
          </div>
        </section>

        <aside class="panel details">
          <div v-if="!selectedNode" class="details-empty type-note">
            <v-icon name="hub" large />
            {{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_select_hint) }}
          </div>
          <template v-else>
            <div class="details-head">
              <div class="details-avatar" :style="{ borderColor: groupColor(selectedNode) }">
                <img v-if="avatarUrl(selectedNode.profile, AVATAR_SIZE)" :src="avatarUrl(selectedNode.profile, AVATAR_SIZE)" alt="" @error="onAvatarError(selectedNode.profile)" />
                <span v-else>{{ initials(selectedNode.profile) }}</span>
              </div>
              <div class="details-title">
                <div class="type-title">{{ displayName(selectedNode.profile) }}</div>
                <div class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_group_of, { count: selectedNode.groupSize }) }}</div>
              </div>
            </div>

            <div class="details-counts">
              <div class="details-count">
                <span class="details-count-value">{{ selectedNode.friendCount }}</span>
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_friends) }}</span>
              </div>
              <div class="details-count">
                <span class="details-count-value">{{ selectedNode.pendingCount }}</span>
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_pending_requests) }}</span>
              </div>
            </div>

            <div>
              <h3 class="type-label details-heading">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_friends) }}</h3>
              <div v-if="friends.length === 0" class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_no_friends_yet) }}</div>
              <ul class="people">
                <li v-for="friend in friends" :key="friend.profile.id">
                  <button type="button" class="person" @click="selectProfile(friend.profile.id, true)">
                    <span class="person-avatar" :style="{ borderColor: profileColor(friend.profile.id) }">
                      <img v-if="avatarUrl(friend.profile, LivePulseHelper.FEED_AVATAR_SIZE)" :src="avatarUrl(friend.profile, LivePulseHelper.FEED_AVATAR_SIZE)" alt="" loading="lazy" @error="onAvatarError(friend.profile)" />
                      <span v-else>{{ initials(friend.profile) }}</span>
                    </span>
                    <span class="person-name">{{ displayName(friend.profile) }}</span>
                    <span class="type-note">{{ friendsSince(friend.dateCreated) }}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div v-if="requests.length > 0">
              <h3 class="type-label details-heading">{{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_pending_requests) }}</h3>
              <ul class="people">
                <li v-for="request in requests" :key="request.profile.id">
                  <button type="button" class="person" :disabled="!visibleIds.has(request.profile.id)" @click="selectProfile(request.profile.id, true)">
                    <span class="person-avatar pending">
                      <img v-if="avatarUrl(request.profile, LivePulseHelper.FEED_AVATAR_SIZE)" :src="avatarUrl(request.profile, LivePulseHelper.FEED_AVATAR_SIZE)" alt="" loading="lazy" @error="onAvatarError(request.profile)" />
                      <span v-else>{{ initials(request.profile) }}</span>
                    </span>
                    <span class="person-name">{{ displayName(request.profile) }}</span>
                    <span class="type-note">{{ translate(request.sent ? BackendTranslationKeys.rocket_meals_module_friendship_network_request_sent : BackendTranslationKeys.rocket_meals_module_friendship_network_request_received) }}</span>
                  </button>
                </li>
              </ul>
            </div>

            <v-button :to="profileRoute(selectedNode.profile)" secondary full-width>
              <v-icon name="person" left />
              {{ translate(BackendTranslationKeys.rocket_meals_module_friendship_network_open_profile) }}
            </v-button>
          </template>
        </aside>
      </div>
    </div>
  </private-view>
</template>

<style scoped>
.friendship-network {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.75rem;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.kpi-value {
  font-weight: 700;
  font-size: 1.75rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  align-items: center;
}

.toolbar :deep(.v-checkbox) {
  inline-size: auto;
}

.field {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.search {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  inline-size: 16rem;
  max-inline-size: 100%;
  margin-inline-start: auto;
}

.search-missed {
  color: var(--theme--warning);
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 70rem) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.graph-panel {
  overflow: hidden;
}

.graph {
  position: relative;
  block-size: clamp(28rem, 70vh, 52rem);
  background-color: var(--theme--background);
  background-image: radial-gradient(var(--theme--border-color-subdued) 1px, transparent 1px);
  background-size: 20px 20px;
}

.graph-svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  cursor: grab;
  touch-action: none;
}

.graph-svg:active {
  cursor: grabbing;
}

.link {
  stroke: var(--theme--foreground-subdued);
  stroke-width: 1.5;
  stroke-opacity: 0.45;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.link.pending {
  stroke-dasharray: 6 5;
  stroke-opacity: 0.7;
}

.link.active {
  stroke: var(--theme--primary);
  stroke-width: 3;
  stroke-opacity: 1;
}

.link.dimmed {
  stroke-opacity: 0.12;
}

.node {
  cursor: pointer;
  transition: opacity var(--fast) var(--transition);
}

.node:focus {
  outline: none;
}

.node:focus-visible .node-ring {
  stroke-width: 5;
}

.node.dimmed {
  opacity: 0.25;
}

.node-fill {
  fill: var(--theme--background-normal);
}

.node-ring {
  fill: none;
  stroke-width: 3;
}

.node.selected .node-ring {
  stroke: var(--theme--primary) !important;
  stroke-width: 5;
}

.node-initials {
  fill: var(--theme--foreground);
  font-weight: 700;
  pointer-events: none;
}

.node-label {
  fill: var(--theme--foreground);
  font-weight: 600;
  font-size: 11px;
  paint-order: stroke;
  stroke: var(--theme--background);
  stroke-width: 3px;
  pointer-events: none;
}

.graph-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.graph-hint {
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-start: 0.75rem;
  padding: 0.25rem 0.625rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  pointer-events: none;
}

.graph-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.legend-item {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
}

.legend-line {
  stroke: var(--theme--foreground-subdued);
  stroke-width: 2;
}

.legend-line.pending {
  stroke-dasharray: 5 4;
}

.zoom-buttons {
  display: flex;
  gap: 0.375rem;
  margin-inline-start: auto;
}

.details {
  gap: 1.25rem;
  padding: 1.25rem;
}

.details-empty {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  padding: 3rem 0.5rem;
  text-align: center;
}

.details-head {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.details-avatar,
.person-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--theme--foreground);
  font-weight: 700;
  background: var(--theme--background-normal);
  border: 3px solid var(--theme--foreground-subdued);
  border-radius: 50%;
}

.details-avatar {
  inline-size: 64px;
  block-size: 64px;
  font-size: 1.25rem;
}

.person-avatar {
  inline-size: 36px;
  block-size: 36px;
  font-size: 0.75rem;
  border-width: 2px;
}

.person-avatar.pending {
  border-style: dashed;
}

.details-avatar img,
.person-avatar img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.details-title {
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.details-counts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.details-count {
  display: flex;
  flex-direction: column;
  padding: 0.625rem 0.75rem;
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.details-count-value {
  font-weight: 700;
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
}

.details-heading {
  margin: 0 0 0.5rem;
}

.people {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  inline-size: 100%;
  min-block-size: 44px;
  padding: 0.375rem 0.25rem;
  color: var(--theme--foreground);
  text-align: start;
  background: none;
  border: none;
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 0;
  cursor: pointer;
}

.person:disabled {
  cursor: default;
}

.person:hover:not(:disabled) {
  background: var(--theme--background-normal);
}

.person-name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media (prefers-reduced-motion: reduce) {
  .node {
    transition: none;
  }
}
</style>
