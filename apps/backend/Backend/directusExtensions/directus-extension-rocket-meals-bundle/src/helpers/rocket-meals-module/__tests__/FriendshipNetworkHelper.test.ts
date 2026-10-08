import { describe, expect, it } from '@jest/globals';
import { FriendshipStatus } from 'repo-depkit-common';
import { FriendshipNetworkHelper, FriendshipNetworkLinkStatus, type FriendshipNetworkFriendship } from '../FriendshipNetworkHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';

let rowCounter = 0;

function row(requester: string, receiver: string, status: string = FriendshipStatus.ACCEPTED, dateCreated?: string): FriendshipNetworkFriendship {
  rowCounter++;
  return {
    id: `f${rowCounter}`,
    friendship_status: status,
    date_created: dateCreated ?? new Date(Date.UTC(2026, 0, 1, 0, rowCounter)).toISOString(),
    requester_profiles_id: { id: requester, nickname: requester.toUpperCase(), avatar: null },
    receiver_profiles_id: { id: receiver, nickname: receiver.toUpperCase(), avatar: null },
  };
}

function node(network: ReturnType<typeof FriendshipNetworkHelper.buildNetwork>, id: string) {
  const found = network.nodes.find(entry => entry.id === id);
  if (!found) {
    throw new Error(`node ${id} missing`);
  }
  return found;
}

describe('FriendshipNetworkHelper', () => {
  it('is a page of the module', () => {
    expect(RocketMealsModulePages.PAGES).toContain(RocketMealsModulePages.FRIENDSHIP_NETWORK);
    expect(RocketMealsModulePages.getRoute(RocketMealsModulePages.FRIENDSHIP_NETWORK)).toBe('/rocket-meals/friendship-network');
  });

  it('loads all friendships with both profiles, oldest first', () => {
    const query = FriendshipNetworkHelper.buildFriendshipsQuery();
    expect(query.limit).toBe(-1);
    expect(query.sort).toBe('date_created');
    expect(query.fields.split(',')).toEqual(expect.arrayContaining(['id', 'friendship_status', 'date_created', 'requester_profiles_id.id', 'requester_profiles_id.nickname', 'requester_profiles_id.avatar', 'receiver_profiles_id.id', 'receiver_profiles_id.avatar']));
  });

  describe('buildNetwork', () => {
    it('merges both directions of a friendship into one link and keeps the oldest date', () => {
      const network = FriendshipNetworkHelper.buildNetwork([row('b', 'a', FriendshipStatus.ACCEPTED, '2026-03-01T00:00:00Z'), row('a', 'b', FriendshipStatus.ACCEPTED, '2026-02-01T00:00:00Z')]);
      expect(network.links).toHaveLength(1);
      expect(network.links[0]!.dateCreated).toBe('2026-02-01T00:00:00Z');
      expect(node(network, 'a').friendCount).toBe(1);
      expect(node(network, 'b').friendCount).toBe(1);
    });

    it('keeps an open request directed and drops it once the two are friends', () => {
      const network = FriendshipNetworkHelper.buildNetwork([row('a', 'b', FriendshipStatus.PENDING), row('c', 'a', FriendshipStatus.PENDING), row('b', 'a')]);
      const pending = network.links.filter(link => link.status === FriendshipNetworkLinkStatus.PENDING);
      expect(pending).toEqual([expect.objectContaining({ sourceId: 'c', targetId: 'a' })]);
      expect(node(network, 'a').pendingCount).toBe(1);
      expect(node(network, 'c').friendCount).toBe(0);
    });

    it('skips rows without both profiles, with itself as friend or with an unknown status', () => {
      const broken: FriendshipNetworkFriendship = { id: 'x', friendship_status: FriendshipStatus.ACCEPTED, requester_profiles_id: 'a', receiver_profiles_id: null };
      const network = FriendshipNetworkHelper.buildNetwork([broken, row('a', 'a'), row('a', 'b', 'declined')]);
      expect(network.nodes).toEqual([]);
      expect(network.links).toEqual([]);
    });

    it('accepts profile ids instead of loaded profiles', () => {
      const network = FriendshipNetworkHelper.buildNetwork([{ id: 'x', friendship_status: FriendshipStatus.ACCEPTED, requester_profiles_id: 'a', receiver_profiles_id: 'b' }]);
      expect(network.nodes.map(entry => entry.profile)).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('numbers the groups by size, open requests do not connect groups', () => {
      const network = FriendshipNetworkHelper.buildNetwork([row('x', 'y'), row('a', 'b'), row('b', 'c'), row('c', 'x', FriendshipStatus.PENDING), row('p', 'q', FriendshipStatus.PENDING)]);
      expect(node(network, 'a')).toMatchObject({ groupIndex: 0, groupSize: 3 });
      expect(node(network, 'c')).toMatchObject({ groupIndex: 0, groupSize: 3 });
      expect(node(network, 'x')).toMatchObject({ groupIndex: 1, groupSize: 2 });
      expect(node(network, 'p').groupSize).toBe(1);
      expect(node(network, 'q').groupSize).toBe(1);
    });
  });

  describe('filterNetwork and getStats', () => {
    const network = FriendshipNetworkHelper.buildNetwork([row('a', 'b'), row('a', 'c'), row('b', 'c'), row('a', 'd'), row('x', 'y'), row('d', 'x', FriendshipStatus.PENDING), row('p', 'a', FriendshipStatus.PENDING)]);

    const ids = (filtered: { nodes: { id: string }[] }) => filtered.nodes.map(entry => entry.id).sort();

    it('shows friendships of large enough groups and every open request with its profiles', () => {
      const filtered = FriendshipNetworkHelper.filterNetwork(network, { showAccepted: true, showPending: true, minGroupSize: 3 });
      expect(ids(filtered)).toEqual(['a', 'b', 'c', 'd', 'p', 'x']);
      expect(
        filtered.links
          .filter(link => link.status === FriendshipNetworkLinkStatus.PENDING)
          .map(link => link.key)
          .sort()
      ).toEqual(['d>x', 'p>a']);
    });

    it('shows only the requests and their profiles when only open requests are checked', () => {
      const filtered = FriendshipNetworkHelper.filterNetwork(network, { showAccepted: false, showPending: true, minGroupSize: 2 });
      expect(ids(filtered)).toEqual(['a', 'd', 'p', 'x']);
      expect(filtered.links.map(link => link.key).sort()).toEqual(['d>x', 'p>a']);
    });

    it('shows only the friendships when only accepted is checked', () => {
      const filtered = FriendshipNetworkHelper.filterNetwork(network, { showAccepted: true, showPending: false, minGroupSize: 2 });
      expect(ids(filtered)).toEqual(['a', 'b', 'c', 'd', 'x', 'y']);
      expect(filtered.links.every(link => link.status === FriendshipNetworkLinkStatus.ACCEPTED)).toBe(true);
    });

    it('shows nothing without a checkbox', () => {
      expect(FriendshipNetworkHelper.filterNetwork(network, { showAccepted: false, showPending: false, minGroupSize: 2 })).toEqual({ nodes: [], links: [] });
    });

    it('counts the key figures, the group size only changes the friendship figures', () => {
      expect(FriendshipNetworkHelper.getStats(network, 2)).toEqual({ profilesWithFriends: 6, friendships: 5, pendingRequests: 2, largestGroupSize: 4, averageFriends: 10 / 6 });
      expect(FriendshipNetworkHelper.getStats(network, 3)).toEqual({ profilesWithFriends: 4, friendships: 4, pendingRequests: 2, largestGroupSize: 4, averageFriends: 2 });
      expect(FriendshipNetworkHelper.getStats({ nodes: [], links: [] }, 2)).toEqual({ profilesWithFriends: 0, friendships: 0, pendingRequests: 0, largestGroupSize: 0, averageFriends: 0 });
    });
  });

  it('lists the friends of a profile longest friendship first, and its open requests', () => {
    const network = FriendshipNetworkHelper.buildNetwork([row('b', 'a', FriendshipStatus.ACCEPTED, '2026-05-01T00:00:00Z'), row('a', 'c', FriendshipStatus.ACCEPTED, '2026-04-01T00:00:00Z'), row('a', 'd', FriendshipStatus.PENDING), row('e', 'a', FriendshipStatus.PENDING)]);
    expect(FriendshipNetworkHelper.getFriends(network, 'a').map(friend => friend.profile.id)).toEqual(['c', 'b']);
    expect(FriendshipNetworkHelper.getRequests(network, 'a').map(request => [request.profile.id, request.sent])).toEqual([
      ['d', true],
      ['e', false],
    ]);
  });

  it('grows the node with the square root of the friends, within bounds', () => {
    expect(FriendshipNetworkHelper.getNodeRadius(0)).toBe(FriendshipNetworkHelper.MIN_NODE_RADIUS);
    expect(FriendshipNetworkHelper.getNodeRadius(4)).toBeGreaterThan(FriendshipNetworkHelper.getNodeRadius(1));
    expect(FriendshipNetworkHelper.getNodeRadius(10_000)).toBe(FriendshipNetworkHelper.MAX_NODE_RADIUS);
  });

  it('finds profiles by nickname, exact and prefix matches first', () => {
    const network = FriendshipNetworkHelper.buildNetwork([
      { id: '1', friendship_status: FriendshipStatus.ACCEPTED, requester_profiles_id: { id: 'a', nickname: 'Annalena' }, receiver_profiles_id: { id: 'b', nickname: 'Lena' } },
      { id: '2', friendship_status: FriendshipStatus.ACCEPTED, requester_profiles_id: { id: 'c', nickname: 'Lenard' }, receiver_profiles_id: { id: 'd', nickname: 'Tom' } },
    ]);
    expect(FriendshipNetworkHelper.searchNodes(network.nodes, ' LENA ').map(entry => entry.id)).toEqual(['b', 'c', 'a']);
    expect(FriendshipNetworkHelper.searchNodes(network.nodes, 'nale').map(entry => entry.id)).toEqual(['a']);
    expect(FriendshipNetworkHelper.searchNodes(network.nodes, '  ')).toEqual([]);
  });
});
