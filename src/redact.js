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
