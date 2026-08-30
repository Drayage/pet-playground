// Firebase Realtime Database online layer for Pet Playground.
//
// Host-authority pattern: the host is the only client that ever mutates
// game state (newGame/shuffle/applyEffect/action handlers). The guest
// sends action-intent messages through `sendIntent`; the host applies
// them locally and re-broadcasts a redacted view through `writeState`.
//
// Shared cross-repo convention: this game's rooms live under
// `games/pet-playground/rooms/<roomCode>` -- every sibling game keeps its
// own namespace inside the one shared Firebase project.
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  get,
  getDatabase,
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { FIREBASE_CONFIG } from "./firebaseConfig.js";

const ROOMS_PATH = "games/pet-playground/rooms";

let dbInstance = null;
function db() {
  if (!dbInstance) {
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    dbInstance = getDatabase(app);
  }
  return dbInstance;
}

const roomPath = (code) => `${ROOMS_PATH}/${code}`;

// RTDB rejects `undefined` anywhere in a write payload -- scrub it to null
// recursively so callers never have to think about it.
export function sanitize(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const out = {};
  for (const [key, val] of Object.entries(value)) out[key] = sanitize(val);
  return out;
}

function makeRoomCode(length = 5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Creates a fresh room (seq 0, no game state yet) with the caller as host.
export async function createRoom(hostId) {
  const code = makeRoomCode();
  const room = sanitize({
    seq: 0,
    createdAt: serverTimestamp(),
    hostId,
    guestId: null,
    state: null,
    players: { [hostId]: { online: true, role: "host" } },
  });
  await set(ref(db(), roomPath(code)), room);
  return code;
}

// Joins an existing room as guest. One host + one guest per room.
export async function joinRoom(code, guestId) {
  const roomRef = ref(db(), roomPath(code));
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) throw new Error(`방을 찾을 수 없습니다: ${code}`);
  const room = snapshot.val();
  if (room.guestId && room.guestId !== guestId) throw new Error("이미 다른 플레이어가 참가한 방입니다.");
  await update(roomRef, sanitize({ guestId, [`players/${guestId}`]: { online: true, role: "guest" } }));
  return room;
}

// Seq-guarded write: commits only if the room's server-side seq still
// equals `baseSeq` (the seq the host last observed), so a write that
// raced behind a newer one never clobbers it. Returns whether it committed.
export async function writeState(code, baseSeq, nextState) {
  const result = await runTransaction(ref(db(), roomPath(code)), (room) => {
    if (!room) return room; // room no longer exists -- give up
    if ((room.seq || 0) !== baseSeq) return undefined; // stale -- abort, caller retries with fresh seq
    return { ...room, seq: baseSeq + 1, state: sanitize(nextState) };
  });
  return { committed: result.committed, seq: result.snapshot.val()?.seq ?? baseSeq };
}

// Subscribes to the whole room document (state, seq, players, ids).
// Invoked with `null` if the room does not exist / gets deleted.
export function subscribeRoom(code, onRoom) {
  const roomRef = ref(db(), roomPath(code));
  const listener = (snapshot) => onRoom(snapshot.val());
  onValue(roomRef, listener);
  return () => off(roomRef, "value", listener);
}

// Guest -> host action-intent channel. Guests never write `state`
// directly; they push an intent here and the host applies + rebroadcasts.
export async function sendIntent(code, intent) {
  await push(ref(db(), `${roomPath(code)}/intents`), sanitize({ ...intent, ts: serverTimestamp() }));
}

// Host-side: fires once per pending intent (oldest first) and removes it
// immediately so it is never re-applied on the next snapshot.
export function subscribeIntents(code, onIntent) {
  const intentsRef = ref(db(), `${roomPath(code)}/intents`);
  const listener = (snapshot) => {
    const value = snapshot.val();
    if (!value) return;
    for (const [intentId, intent] of Object.entries(value).sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0))) {
      onIntent(intent, intentId);
      remove(ref(db(), `${roomPath(code)}/intents/${intentId}`));
    }
  };
  onValue(intentsRef, listener);
  return () => off(intentsRef, "value", listener);
}

// Presence: never destructive. onDisconnect only flips `online` off so a
// refresh or brief network drop doesn't tear the room down; the game
// itself decides what a temporarily-offline seat means.
export function setupPresence(code, playerId) {
  const presenceRef = ref(db(), `${roomPath(code)}/players/${playerId}`);
  update(presenceRef, { online: true });
  onDisconnect(presenceRef).update({ online: false });
}

export async function leaveRoom(code, playerId) {
  await update(ref(db(), `${roomPath(code)}/players/${playerId}`), { online: false });
}
