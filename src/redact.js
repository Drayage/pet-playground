// Produces the network-safe view of game state sent to a given seat.
//
// Only the host ever calls this (host authority: it holds the one true,
// fully-populated `state`). Everything here is pure/pointer-free so it is
// safe to call on every host mutation before broadcasting.
//
// Hidden rules:
//  - A player's `hand` is only visible to that same seat. Every other
//    seat's hand is replaced with same-length placeholders (card count
//    stays accurate for UI, identities do not).
//  - `deck` order is hidden for every seat, host's own seat included --
//    nobody should be able to read ahead into a draw pile, own or not.
//  - The shared `parkDeck` order is hidden the same way (only `parkRow`,
//    the face-up cards, is public).
//  - Public zones (discard, entrance, album, resources, popularity,
//    playgroundLevel, phase, log, parkRow, ...) pass through untouched.
function hiddenPile(length, kind) {
  return Array.from({ length }, (_, index) => ({ id: `hidden-${kind}-${index}`, hidden: true }));
}

export function redactStateForViewer(state, viewerIndex) {
  return {
    ...state,
    parkDeck: hiddenPile(state.parkDeck.length, "park"),
    players: state.players.map((player, index) => ({
      ...player,
      hand: index === viewerIndex ? player.hand : hiddenPile(player.hand.length, `hand${index}`),
      deck: hiddenPile(player.deck.length, `deck${index}`),
    })),
  };
}

// Firebase RTDB has no way to represent an empty array: writing `[]` removes
// that key entirely, so it comes back as `undefined` on read. discard/
// entrance/album (per player) and parkDeck/parkRow are all legitimately
// empty at real points in a game (start of game, park deck run dry, ...),
// and the guest applies `roomValue.state` straight into React state — every
// unguarded `.length`/`.map` on those fields throughout main.jsx would then
// throw only on the guest's screen (the host renders its own in-memory
// state, which never round-trips through the network). Restore them before
// the guest's `setState` call.
export function hydrateNetworkState(view) {
  if (!view) return view;
  view.parkDeck = view.parkDeck || [];
  view.parkRow = view.parkRow || [];
  view.log = view.log || [];
  (view.players || []).forEach((player) => {
    player.hand = player.hand || [];
    player.deck = player.deck || [];
    player.discard = player.discard || [];
    player.entrance = player.entrance || [];
    player.album = player.album || [];
  });
  return view;
}
