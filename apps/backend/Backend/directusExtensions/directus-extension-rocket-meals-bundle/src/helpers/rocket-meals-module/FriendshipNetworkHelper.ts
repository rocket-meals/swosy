/**
 * FriendshipNetworkHelper.ts – data side of the page "Freundesnetzwerk" (`friendship-network-page.vue`):
 * turns the rows of `friendships` into a network of profiles (nodes) and friendships (links).
 *
 * - A friendship is undirected: two accepted rows between the same profiles are one link
 *   (`friendships-hook` cleans such duplicates up, the page must not rely on it).
 * - An open request stays directed (who asked whom) and is only shown while the two are not friends yet.
 * - A group is a set of profiles connected by accepted friendships, open requests do not count.
 *
 * Read with the permissions of the person looking at the page. The layout (d3-force) and zooming
 * (d3-zoom) live in the page, no Vue and no d3 in here, so the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FriendshipStatus } from 'repo-depkit-common/src/FriendshipStatus';

export type FriendshipNetworkProfile = {
  id: string;
  nickname?: string | null;
  avatar?: unknown;
};

type RelatedProfile = FriendshipNetworkProfile | string | null | undefined;

export type FriendshipNetworkFriendship = {
  id: string;
  friendship_status?: string | null;
  date_created?: string | null;
  requester_profiles_id?: RelatedProfile;
  receiver_profiles_id?: RelatedProfile;
};

export enum FriendshipNetworkLinkStatus {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
}

export type FriendshipNetworkNode = {
  id: string;
  profile: FriendshipNetworkProfile;
  friendCount: number;
  pendingCount: number;
  /** Index of the group, the largest group is 0. */
  groupIndex: number;
  groupSize: number;
};

export type FriendshipNetworkLink = {
  /** Stable per pair (accepted) or per direction (pending). */
  key: string;
  /** The requester of the (first) friendship row. */
  sourceId: string;
  targetId: string;
  status: FriendshipNetworkLinkStatus;
  dateCreated?: string | null;
};

export type FriendshipNetwork = {
  nodes: FriendshipNetworkNode[];
  links: FriendshipNetworkLink[];
};

export type FriendshipNetworkFilter = {
  showAccepted: boolean;
  showPending: boolean;
  /** Profiles in smaller groups are hidden. 1 shows every profile, also the ones with only open requests. */
  minGroupSize: number;
};

export type FriendshipNetworkStats = {
  profilesWithFriends: number;
  friendships: number;
  pendingRequests: number;
  largestGroupSize: number;
  /** Average number of friends of the profiles that have at least one, 0 without friendships. */
  averageFriends: number;
};

export type FriendshipNetworkFriend = {
  profile: FriendshipNetworkProfile;
  dateCreated?: string | null;
};

export type FriendshipNetworkRequest = {
  profile: FriendshipNetworkProfile;
  sent: boolean;
  dateCreated?: string | null;
};

export type FriendshipNetworkQuery = {
  fields: string;
  limit: number;
  sort: string;
};

export class FriendshipNetworkHelper {
  static readonly FRIENDSHIPS_ENDPOINT = `/items/${CollectionNames.FRIENDSHIPS}`;

  /** Choices of the filter "group size". */
  static readonly GROUP_SIZE_OPTIONS: readonly number[] = [1, 2, 3, 5, 10];
  static readonly DEFAULT_MIN_GROUP_SIZE = 2;

  static readonly MIN_NODE_RADIUS = 12;
  static readonly MAX_NODE_RADIUS = 36;

  private static readonly PROFILE_FIELDS = ['id', 'nickname', 'avatar'];

  /** All friendships with both profiles, oldest first so the first row of a pair wins. */
  static buildFriendshipsQuery(): FriendshipNetworkQuery {
    const profileFields = (relation: string) => FriendshipNetworkHelper.PROFILE_FIELDS.map(field => `${relation}.${field}`);
    return {
      fields: ['id', 'friendship_status', 'date_created', ...profileFields('requester_profiles_id'), ...profileFields('receiver_profiles_id')].join(','),
      limit: -1,
      sort: 'date_created',
    };
  }

  static getProfile(profile: RelatedProfile): FriendshipNetworkProfile | undefined {
    if (!profile) {
      return undefined;
    }
    return typeof profile === 'string' ? { id: profile } : profile;
  }

  /** Same key for A–B and B–A. */
  static getPairKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  static buildNetwork(friendships: FriendshipNetworkFriendship[]): FriendshipNetwork {
    const profiles = new Map<string, FriendshipNetworkProfile>();
    const accepted = new Map<string, FriendshipNetworkLink>();
    const pending = new Map<string, FriendshipNetworkLink>();

    for (const friendship of FriendshipNetworkHelper.sortByDateCreated(friendships)) {
      const requester = FriendshipNetworkHelper.getProfile(friendship.requester_profiles_id);
      const receiver = FriendshipNetworkHelper.getProfile(friendship.receiver_profiles_id);
      if (!requester || !receiver || requester.id === receiver.id) {
        continue;
      }
      const status = friendship.friendship_status === FriendshipStatus.ACCEPTED ? FriendshipNetworkLinkStatus.ACCEPTED : friendship.friendship_status === FriendshipStatus.PENDING ? FriendshipNetworkLinkStatus.PENDING : undefined;
      if (!status) {
        continue;
      }
      FriendshipNetworkHelper.rememberProfile(profiles, requester);
      FriendshipNetworkHelper.rememberProfile(profiles, receiver);

      const pairKey = FriendshipNetworkHelper.getPairKey(requester.id, receiver.id);
      const links = status === FriendshipNetworkLinkStatus.ACCEPTED ? accepted : pending;
      const key = status === FriendshipNetworkLinkStatus.ACCEPTED ? pairKey : `${requester.id}>${receiver.id}`;
      if (!links.has(key)) {
        links.set(key, { key, sourceId: requester.id, targetId: receiver.id, status, dateCreated: friendship.date_created });
      }
    }

    // A request between two friends is outdated, the friendship says more.
    const openRequests = [...pending.values()].filter(link => !accepted.has(FriendshipNetworkHelper.getPairKey(link.sourceId, link.targetId)));
    const links = [...accepted.values(), ...openRequests];

    const friendCount = new Map<string, number>();
    const pendingCount = new Map<string, number>();
    for (const link of links) {
      const counts = link.status === FriendshipNetworkLinkStatus.ACCEPTED ? friendCount : pendingCount;
      counts.set(link.sourceId, (counts.get(link.sourceId) ?? 0) + 1);
      counts.set(link.targetId, (counts.get(link.targetId) ?? 0) + 1);
    }

    const groups = FriendshipNetworkHelper.findGroups([...profiles.keys()], [...accepted.values()]);
    const nodes = [...profiles.values()].map(profile => {
      const group = groups.get(profile.id) ?? { index: -1, size: 1 };
      return {
        id: profile.id,
        profile,
        friendCount: friendCount.get(profile.id) ?? 0,
        pendingCount: pendingCount.get(profile.id) ?? 0,
        groupIndex: group.index,
        groupSize: group.size,
      };
    });
    return { nodes, links };
  }

  /**
   * Connected components over the given (accepted) links. Index 0 is the largest group, ties
   * keep the order in which the profiles appeared.
   */
  static findGroups(profileIds: string[], links: FriendshipNetworkLink[]): Map<string, { index: number; size: number }> {
    const neighbours = new Map<string, string[]>();
    for (const id of profileIds) {
      neighbours.set(id, []);
    }
    for (const link of links) {
      neighbours.get(link.sourceId)?.push(link.targetId);
      neighbours.get(link.targetId)?.push(link.sourceId);
    }

    const components: string[][] = [];
    const seen = new Set<string>();
    for (const id of profileIds) {
      if (seen.has(id)) {
        continue;
      }
      const component: string[] = [];
      const stack = [id];
      seen.add(id);
      while (stack.length > 0) {
        const current = stack.pop()!;
        component.push(current);
        for (const next of neighbours.get(current) ?? []) {
          if (!seen.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
      components.push(component);
    }

    const result = new Map<string, { index: number; size: number }>();
    components
      .map((members, order) => ({ members, order }))
      .sort((a, b) => b.members.length - a.members.length || a.order - b.order)
      .forEach(({ members }, index) => {
        for (const member of members) {
          result.set(member, { index, size: members.length });
        }
      });
    return result;
  }

  /** The part of the network the filters leave. A link needs both of its profiles. */
  static filterNetwork(network: FriendshipNetwork, filter: FriendshipNetworkFilter): FriendshipNetwork {
    const nodes = network.nodes.filter(node => node.groupSize >= filter.minGroupSize);
    const visible = new Set(nodes.map(node => node.id));
    const links = network.links.filter(link => {
      const statusShown = link.status === FriendshipNetworkLinkStatus.ACCEPTED ? filter.showAccepted : filter.showPending;
      return statusShown && visible.has(link.sourceId) && visible.has(link.targetId);
    });
    return { nodes, links };
  }

  /** Key figures of the given (usually filtered) network, counted from its nodes and links. */
  static getStats(network: FriendshipNetwork): FriendshipNetworkStats {
    const friendships = network.links.filter(link => link.status === FriendshipNetworkLinkStatus.ACCEPTED).length;
    const profilesWithFriends = network.nodes.filter(node => node.friendCount > 0).length;
    return {
      profilesWithFriends,
      friendships,
      pendingRequests: network.links.length - friendships,
      largestGroupSize: network.nodes.reduce((max, node) => Math.max(max, node.groupSize), 0),
      averageFriends: profilesWithFriends === 0 ? 0 : (2 * friendships) / profilesWithFriends,
    };
  }

  /** Grows with the square root, so a profile with 40 friends does not cover the whole network. */
  static getNodeRadius(friendCount: number): number {
    const radius = FriendshipNetworkHelper.MIN_NODE_RADIUS + Math.sqrt(Math.max(0, friendCount)) * 4;
    return Math.min(FriendshipNetworkHelper.MAX_NODE_RADIUS, radius);
  }

  /** Friends of a profile, longest friendship first. */
  static getFriends(network: FriendshipNetwork, profileId: string): FriendshipNetworkFriend[] {
    const profiles = FriendshipNetworkHelper.getProfileMap(network);
    return FriendshipNetworkHelper.sortByDateCreated(network.links.filter(link => link.status === FriendshipNetworkLinkStatus.ACCEPTED && (link.sourceId === profileId || link.targetId === profileId))).flatMap(link => {
      const profile = profiles.get(link.sourceId === profileId ? link.targetId : link.sourceId);
      return profile ? [{ profile, dateCreated: link.dateCreated }] : [];
    });
  }

  /** Open requests of a profile, `sent` when the profile asked. */
  static getRequests(network: FriendshipNetwork, profileId: string): FriendshipNetworkRequest[] {
    const profiles = FriendshipNetworkHelper.getProfileMap(network);
    return FriendshipNetworkHelper.sortByDateCreated(network.links.filter(link => link.status === FriendshipNetworkLinkStatus.PENDING && (link.sourceId === profileId || link.targetId === profileId))).flatMap(link => {
      const sent = link.sourceId === profileId;
      const profile = profiles.get(sent ? link.targetId : link.sourceId);
      return profile ? [{ profile, sent, dateCreated: link.dateCreated }] : [];
    });
  }

  /** Profiles whose nickname contains the search text (case-insensitive), the best match first. */
  static searchNodes(nodes: FriendshipNetworkNode[], search: string): FriendshipNetworkNode[] {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) {
      return [];
    }
    const rank = (node: FriendshipNetworkNode) => {
      const nickname = (node.profile.nickname ?? '').trim().toLocaleLowerCase();
      if (nickname === needle) {
        return 0;
      }
      return nickname.startsWith(needle) ? 1 : nickname.includes(needle) ? 2 : -1;
    };
    return nodes
      .map(node => ({ node, rank: rank(node) }))
      .filter(entry => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank || b.node.friendCount - a.node.friendCount)
      .map(entry => entry.node);
  }

  private static getProfileMap(network: FriendshipNetwork): Map<string, FriendshipNetworkProfile> {
    return new Map(network.nodes.map(node => [node.id, node.profile]));
  }

  /** A row with the related profile loaded beats one with only its id. */
  private static rememberProfile(profiles: Map<string, FriendshipNetworkProfile>, profile: FriendshipNetworkProfile) {
    const known = profiles.get(profile.id);
    if (!known || Object.keys(profile).length > Object.keys(known).length) {
      profiles.set(profile.id, profile);
    }
  }

  /** Oldest first, rows without a date last, otherwise the given order. */
  private static sortByDateCreated<T extends { date_created?: string | null } | { dateCreated?: string | null }>(items: T[]): T[] {
    const time = (item: T) => {
      const date = 'date_created' in item ? item.date_created : 'dateCreated' in item ? item.dateCreated : undefined;
      const value = date ? new Date(date).getTime() : Number.NaN;
      return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
    };
    return items
      .map((item, order) => ({ item, order, time: time(item) }))
      .sort((a, b) => (a.time === b.time ? a.order - b.order : a.time - b.time))
      .map(entry => entry.item);
  }
}
