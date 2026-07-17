import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Album,
  ArrowUpDown,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Crown,
  Dog,
  Hammer,
  Info,
  PackageOpen,
  PawPrint,
  RotateCcw,
  Shovel,
  Sparkles,
  Star,
  Waves,
  Zap,
} from "lucide-react";
import "./styles.css";

const SUITS = {
  CHARM: { label: "재롱", icon: Crown, emoji: "🎭", color: "#c77823" },
  CRAFT: { label: "꾸미기", icon: Hammer, emoji: "🎀", color: "#2f7f58" },
  DIG: { label: "땅파기", icon: Shovel, emoji: "🪵", color: "#8a633d" },
  WATER: { label: "물놀이", icon: Waves, emoji: "💦", color: "#2878b8" },
  LEARN: { label: "배우기", icon: BookOpen, emoji: "📘", color: "#6953a5" },
  RUN: { label: "달리기", icon: Zap, emoji: "🛹", color: "#bd4b4b" },
  WILD: { label: "자유놀이", icon: PawPrint, emoji: "🐾", color: "#56616d" },
};

const PHASES = {
  SELECT: "SELECT",
  FOLLOW: "FOLLOW",
  RECRUIT: "RECRUIT",
  CLEANUP: "CLEANUP",
  GAME_END: "GAME_END",
};

const STEPS = ["동물 선택", "행동 선택", "같이 놀기", "친해지기"];
const levelScores = [0, 1, 3, 9, 16, 23];
const levelCosts = [
  { any: 2 },
  { treats: 1, toys: 1, any: 1 },
  { treats: 2, toys: 2, any: 1 },
  { treats: 3, toys: 3 },
  { treats: 3, toys: 3, any: 1 },
];

const E = {
  none: () => ({ type: "NONE" }),
  gain: (resource, amount = 1) => ({ type: "GAIN", resource, amount }),
  gainSuit: (suit, resource = "choice") => ({ type: "GAIN_SUIT", suit, resource, scaled: true }),
  scoreSuit: (suit) => ({ type: "SCORE_SUIT", suit, scaled: true }),
  albumSuit: (suit) => ({ type: "ALBUM_SUIT", suit, scaled: true }),
  moveSuit: (suit) => ({ type: "MOVE_SUIT", suit, scaled: true }),
  trashSuit: (suit, reward = null) => ({ type: "TRASH_SUIT", suit, reward, scaled: true }),
  level: () => ({ type: "LEVEL" }),
  levelDiscount: () => ({ type: "LEVEL_DISCOUNT" }),
  bagScore: () => ({ type: "SCORE_BAG" }),
  albumScore: () => ({ type: "SCORE_ALBUM" }),
  levelScore: () => ({ type: "SCORE_LEVEL" }),
  trashRival: (reward = 0) => ({ type: "TRASH_RIVAL", reward }),
  albumOne: () => ({ type: "ALBUM_ONE" }),
  matchBag: (rival = false) => ({ type: rival ? "MATCH_RIVAL_BAG" : "MATCH_BAG" }),
  exchangeSuit: (suit) => ({ type: "EXCHANGE_SUIT", suit, scaled: true }),
  recruitSuit: (suit) => ({ type: "RECRUIT_SUIT", suit, reward: "toys", scaled: true }),
  selfTrashScore: (suit) => ({ type: "SELF_TRASH_SCORE", suit, scaled: true }),
  repeatGainScore: (suit, resource) => ({ type: "REPEAT_GAIN_SCORE", suit, resource, scaled: true }),
};

const C = (name, count, suits, together, home, togetherEffect, homeEffect) => ({
  name, count, suits, together, home, togetherEffect, homeEffect,
});

// 최종 확정 카드 목록의 60장. 이름, 수량, 성향, 행동 문구를 원문 그대로 관리한다.
const FINAL_NORMAL_CARDS = [
  C("왕관앵무", 2, ["CHARM"], "없음", "놀이 성향 하나를 선택한다. 선택한 성향 아이콘 수만큼 간식 또는 장난감을 얻는다.", E.none(), E.gainSuit("CHARM")),
  C("황금리트리버", 2, ["CHARM"], "재롱 아이콘 수만큼 자원 1개를 다른 종류로 바꾼다.", "상대 놀이터 입구의 일반 동물 1장과 작별한다.", E.exchangeSuit("CHARM"), E.trashRival()),
  C("꼬마공작", 2, ["CHARM"], "재롱 아이콘 수만큼 손의 카드를 단골 사진첩에 등록한다.", "단골 사진첩의 카드 수만큼 인기 점수를 얻는다.", E.albumSuit("CHARM"), E.albumScore()),
  C("푸딩냥", 2, ["CHARM", "WILD"], "없음", "없음", E.none(), E.none()),
  C("조그미", 2, ["CHARM"], "간식 또는 장난감 1개를 얻는다.", "상대 입구의 일반 동물 1장과 작별한 후, 간식 또는 장난감 1개를 얻는다.", E.gain("choice"), E.trashRival(1)),
  C("낙서앵무", 2, ["CRAFT"], "꾸미기 아이콘 수만큼 장난감을 얻는다.", "소풍 가방의 자원 수만큼 인기 점수를 얻는다.", E.gainSuit("CRAFT", "toys"), E.bagScore()),
  C("점박이", 1, ["CRAFT"], "놀이터를 1단계 확장한다.", "필요한 자원을 1개 적게 내고 놀이터를 1단계 확장한다.", E.level(), E.levelDiscount()),
  C("방긋이", 1, ["CRAFT"], "내 소풍 가방과 같은 구성의 자원을 바구니에 얻는다.", "장난감 1개를 얻는다.", E.matchBag(), E.gain("toys")),
  C("찰싹남매", 1, ["CRAFT", "CRAFT"], "없음", "없음", E.none(), E.none()),
  C("냥냥이", 1, ["CRAFT"], "꾸미기 아이콘 수만큼 장난감을 얻는다.", "꾸미기 아이콘 수만큼 장난감 1개를 얻은 후 인기 1점을 반복한다.", E.gainSuit("CRAFT", "toys"), E.repeatGainScore("CRAFT", "toys")),
  C("동전이", 1, ["CRAFT"], "꾸미기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "소풍 가방의 자원 수만큼 인기 점수를 얻는다.", E.moveSuit("CRAFT"), E.bagScore()),
  C("완두콩", 1, ["CRAFT"], "꾸미기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "꾸미기 아이콘 수만큼 장난감을 얻는다.", E.moveSuit("CRAFT"), E.gainSuit("CRAFT", "toys")),
  C("땜장이", 2, ["CRAFT"], "꾸미기 아이콘 수만큼 장난감을 얻는다.", "꾸미기 아이콘 수만큼 자원 1개를 다른 종류로 바꾼다.", E.gainSuit("CRAFT", "toys"), E.exchangeSuit("CRAFT")),
  C("풍뎅이", 2, ["DIG"], "땅파기 아이콘 수만큼 간식을 얻는다.", "현재 놀이터 레벨만큼 인기 점수를 얻는다.", E.gainSuit("DIG", "treats"), E.levelScore()),
  C("외발이", 1, ["DIG"], "놀이터를 1단계 확장한 후 인기 2점을 얻는다.", "손의 카드 1장을 단골 사진첩에 등록한다.", { type: "LEVEL_SCORE", amount: 2 }, E.albumOne()),
  C("무스", 1, ["DIG"], "땅파기 아이콘 수만큼 손의 카드를 단골 사진첩에 등록한다.", "놀이터를 1단계 확장한다.", E.albumSuit("DIG"), E.level()),
  C("대장이", 1, ["DIG"], "땅파기 아이콘 수만큼 장난감을 얻는다.", "땅파기 아이콘 수만큼 손의 카드를 단골 사진첩에 등록한다.", E.gainSuit("DIG", "toys"), E.albumSuit("DIG")),
  C("정찰이", 2, ["DIG"], "땅파기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "장난감 2개를 얻는다.", E.moveSuit("DIG"), E.gain("toys", 2)),
  C("두더지 가족", 1, ["DIG", "DIG"], "없음", "없음", E.none(), E.none()),
  C("사마귀", 1, ["DIG"], "간식 1개를 얻는다.", "땅파기 아이콘 수만큼 인기 점수를 얻은 후, 이 카드와 작별한다.", E.gain("treats"), E.selfTrashScore("DIG")),
  C("꿈틀이", 1, ["DIG"], "단골 사진첩의 카드 수만큼 간식 또는 장난감을 얻는다.", "땅파기 아이콘 수만큼 손의 카드를 단골 사진첩에 등록한다.", { type: "GAIN_ALBUM" }, E.albumSuit("DIG")),
  C("장난꾸러기 수달", 2, ["WATER"], "없음", "물놀이 아이콘 수만큼 간식 또는 장난감을 얻는다.", E.none(), E.gainSuit("WATER")),
  C("번개오리", 2, ["WATER"], "물놀이 아이콘 수만큼 간식 또는 장난감을 얻는다.", "물놀이 아이콘 수만큼 내 카드 1장과 작별한 후 장난감 1개 획득을 반복한다.", E.gainSuit("WATER"), E.trashSuit("WATER", "toys")),
  C("첨벙이 삼총사", 1, ["WATER", "WATER"], "없음", "없음", E.none(), E.none()),
  C("아기물개", 2, ["WATER"], "물놀이 아이콘 수만큼 동물 1장과 친해진 후 장난감 1개 획득을 반복한다.", "장난감 1개를 얻는다.", E.recruitSuit("WATER"), E.gain("toys")),
  C("돌진수달", 2, ["WATER"], "물놀이 아이콘 수만큼 내 카드와 작별한다.", "간식 또는 장난감 2개를 얻는다.", E.trashSuit("WATER"), E.gain("choice", 2)),
  C("꼬마대장", 1, ["WATER"], "장난감 1개를 얻는다.", "물놀이 아이콘 수만큼 인기 점수를 얻은 후, 이 카드와 작별한다.", E.gain("toys"), E.selfTrashScore("WATER")),
  C("박사부엉이", 2, ["LEARN"], "손의 카드 1장을 사진첩에 등록한 후, 바구니의 자원 1개를 소풍 가방에 넣는다.", "단골 사진첩의 카드 수만큼 인기 점수를 얻는다.", { type: "ALBUM_THEN_MOVE" }, E.albumScore()),
  C("선장앵무", 2, ["LEARN"], "놀이터를 1단계 확장한다.", "상대 한 명의 소풍 가방과 같은 구성의 자원을 바구니에 얻는다.", E.level(), E.matchBag(true)),
  C("천재햄스터", 1, ["LEARN"], "간식 또는 장난감 1개를 얻는다.", "배우기 아이콘 수만큼 인기 점수를 얻은 후, 이 카드와 작별한다.", E.gain("choice"), E.selfTrashScore("LEARN")),
  C("뼈다귀", 1, ["LEARN"], "배우기 아이콘 수만큼 내 카드 1장과 작별한 후 인기 1점 획득을 반복한다.", "간식 또는 장난감 1개를 얻는다.", E.trashSuit("LEARN", "score"), E.gain("choice")),
  C("반창고", 1, ["LEARN"], "배우기 아이콘 수만큼 장난감을 얻는다.", "꾸미기 아이콘 수만큼 장난감을 얻는다.", E.gainSuit("LEARN", "toys"), E.gainSuit("CRAFT", "toys")),
  C("요리왕", 1, ["LEARN"], "배우기 아이콘 수만큼 간식을 얻는다.", "달리기 아이콘 수만큼 간식을 얻는다.", E.gainSuit("LEARN", "treats"), E.gainSuit("RUN", "treats")),
  C("국수쌍둥이", 1, ["LEARN", "LEARN"], "없음", "없음", E.none(), E.none()),
  C("연기구름", 1, ["WILD"], "없음", "상대 한 명의 소풍 가방과 같은 구성의 자원을 바구니에 얻는다.", E.none(), E.matchBag(true)),
  C("질주견", 2, ["RUN"], "달리기 아이콘 수만큼 간식을 얻는다.", "소풍 가방의 자원 수만큼 인기 점수를 얻는다.", E.gainSuit("RUN", "treats"), E.bagScore()),
  C("먹보웰시", 1, ["RUN"], "달리기 아이콘 수만큼 간식을 얻는다.", "달리기 아이콘 수만큼 간식 1개를 사용한 후 인기 1점 획득을 반복한다.", E.gainSuit("RUN", "treats"), E.repeatGainScore("RUN", "treats")),
  C("로켓형제", 1, ["RUN", "RUN"], "없음", "없음", E.none(), E.none()),
  C("미끄럼이", 1, ["RUN"], "달리기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "놀이터를 1단계 확장한다.", E.moveSuit("RUN"), E.level()),
  C("뾰족이", 2, ["RUN"], "달리기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "상대 한 명의 소풍 가방과 같은 구성의 자원을 바구니에 얻는다.", E.moveSuit("RUN"), E.matchBag(true)),
  C("꼬마개미", 1, ["RUN"], "달리기 아이콘 수만큼 바구니의 자원을 소풍 가방으로 옮긴다.", "소풍 가방의 자원 수만큼 인기 점수를 얻는다.", E.moveSuit("RUN"), E.bagScore()),
  C("천둥이", 2, ["RUN"], "내 소풍 가방과 같은 구성의 자원을 바구니에 얻는다.", "간식 1개를 얻는다.", E.matchBag(), E.gain("treats")),
];

const BEST_FRIENDS = [
  C("알콩이", 1, ["WILD"], "간식 2개 또는 장난감 2개를 얻는다.", "내 카드 1장과 작별한다.", E.gain("choice", 2), E.trashSuit("WILD")),
  C("달콩이", 1, ["WILD"], "간식 2개 또는 장난감 2개를 얻는다.", "내 카드 1장과 작별한다.", E.gain("choice", 2), E.trashSuit("WILD")),
  C("밤콩이", 1, ["WILD"], "간식 2개 또는 장난감 2개를 얻는다.", "내 카드 1장과 작별한다.", E.gain("choice", 2), E.trashSuit("WILD")),
  C("새콩이", 1, ["WILD"], "간식 2개 또는 장난감 2개를 얻는다.", "내 카드 1장과 작별한다.", E.gain("choice", 2), E.trashSuit("WILD")),
  C("찰떡이", 1, ["CRAFT"], "놀이터를 1단계 확장한다.", "없음", E.level(), E.none()),
  C("땅콩이", 1, ["DIG"], "놀이터를 1단계 확장한다.", "없음", E.level(), E.none()),
  C("쌩쌩이", 1, ["RUN"], "놀이터를 1단계 확장한다.", "없음", E.level(), E.none()),
  C("첨벙이", 1, ["WATER"], "놀이터를 1단계 확장한다.", "없음", E.level(), E.none()),
];

const ART_BY_NAME = {
  왕관앵무: 17, 황금리트리버: 0, 꼬마공작: 32, 푸딩냥: 1, 조그미: 14,
  낙서앵무: 2, 점박이: 45, 방긋이: 33, 찰싹남매: 29, 냥냥이: 16,
  동전이: 3, 완두콩: 34, 땜장이: 9, 풍뎅이: 25, 외발이: 40,
  무스: 12, 대장이: 30, 정찰이: 35, "두더지 가족": 24, 사마귀: 40,
  꿈틀이: 44, "장난꾸러기 수달": 5, 번개오리: 6, "첨벙이 삼총사": 21,
  아기물개: 7, 돌진수달: 20, 꼬마대장: 36, 박사부엉이: 47, 선장앵무: 32,
  천재햄스터: 18, 뼈다귀: 15, 반창고: 23, 요리왕: 2, 국수쌍둥이: 3,
  연기구름: 29, 질주견: 15, 먹보웰시: 30, 로켓형제: 11, 미끄럼이: 36,
  뾰족이: 38, 꼬마개미: 40, 천둥이: 45, 알콩이: 0, 달콩이: 1,
  밤콩이: 3, 새콩이: 2, 찰떡이: 4, 땅콩이: 8, 쌩쌩이: 11, 첨벙이: 6,
};

function expandCards(defs, prefix, bestFriend = false, artOffset = 0) {
  let id = 0;
  return defs.flatMap((def, defIndex) => Array.from({ length: def.count }, () => ({
    ...def,
    id: `${prefix}-${String(++id).padStart(2, "0")}`,
    artIndex: ART_BY_NAME[def.name] ?? artOffset + defIndex,
    bestFriend,
  })));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clone(value) { return structuredClone(value); }

function draw(player, count) {
  const next = clone(player);
  for (let i = 0; i < count; i += 1) {
    if (!next.deck.length && next.discard.length) {
      next.deck = shuffle(next.discard);
      next.discard = [];
    }
    const card = next.deck.shift();
    if (card) next.hand.push(card);
  }
  return next;
}

function newGame(playerCount = 2) {
  const parkDeck = shuffle(expandCards(FINAL_NORMAL_CARDS, "N"));
  const friends = expandCards(BEST_FRIENDS, "BF", true, FINAL_NORMAL_CARDS.length);
  const players = Array.from({ length: playerCount }, (_, index) => {
    const deck = shuffle([...parkDeck.splice(0, 8), friends[index], friends[index + 4]]);
    return draw({
      id: `P${index + 1}`,
      name: `플레이어 ${index + 1}`,
      deck, hand: [], discard: [], entrance: [], album: [],
      storage: { treats: 0, toys: 0 },
      picnicBag: { treats: 0, toys: 0 },
      playgroundLevel: 0, popularity: 0, hasGoldenPaw: false,
    }, 5);
  });
  return {
    players,
    parkDeck,
    parkRow: parkDeck.splice(0, 3),
    currentPlayerIndex: 0,
    turn: 1,
    phase: PHASES.SELECT,
    selectedCardId: null,
    selectedActions: { together: true, home: true },
    actionOrder: ["together", "home"],
    resourceChoice: "treats",
    addedCardIds: [],
    playedCard: null,
    followQueue: [],
    followCardId: null,
    cleanupStep: 0,
    trashPlayedCard: false,
    toast: "첫 차례입니다. 함께 놀 동물을 선택하세요.",
    log: ["게임을 준비했습니다."],
  };
}

function capacity(player) { return player.playgroundLevel + 1; }
function totalResources(player) { return player.storage.treats + player.storage.toys + player.picnicBag.treats + player.picnicBag.toys; }
function suitCount(cards, suit) {
  return cards.reduce((sum, card) => sum + card.suits.filter((s) => s === suit || s === "WILD").length, 0);
}
function sharesSuit(a, b) {
  return a.suits.some((s) => s === "WILD" || b.suits.includes(s) || b.suits.includes("WILD"));
}
function canPayLevel(player, discount = 0) {
  if (player.playgroundLevel >= 5) return false;
  const cost = levelCosts[player.playgroundLevel];
  return totalResources(player) >= Math.max(0, (cost.treats || 0) + (cost.toys || 0) + (cost.any || 0) - discount);
}

function payLevelCost(player, discount = 0) {
  const cost = levelCosts[player.playgroundLevel];
  let discountLeft = discount;
  const spend = (resource, amount) => {
    let left = Math.max(0, amount - discountLeft);
    discountLeft = Math.max(0, discountLeft - amount);
    const fromStorage = Math.min(player.storage[resource], left);
    player.storage[resource] -= fromStorage;
    left -= fromStorage;
    const fromBag = Math.min(player.picnicBag[resource], left);
    player.picnicBag[resource] -= fromBag;
  };
  spend("treats", cost.treats || 0);
  spend("toys", cost.toys || 0);
  let any = Math.max(0, (cost.any || 0) - discountLeft);
  for (const zone of ["storage", "picnicBag"]) {
    for (const resource of ["treats", "toys"]) {
      const used = Math.min(player[zone][resource], any);
      player[zone][resource] -= used;
      any -= used;
    }
  }
}

function levelCostText(player, discount = 0) {
  if (player.playgroundLevel >= 5) return "최고 레벨";
  const cost = levelCosts[player.playgroundLevel];
  const pieces = [];
  if (cost.treats) pieces.push(`간식 ${cost.treats}`);
  if (cost.toys) pieces.push(`장난감 ${cost.toys}`);
  if (cost.any) pieces.push(`아무 자원 ${cost.any}`);
  return `${pieces.join(" + ")}${discount ? `에서 1개 할인` : ""}`;
}

function actionAvailability(state, playerIndex, card, effect, selectedCardId = null) {
  const player = state.players[playerIndex];
  const otherHand = player.hand.filter((c) => c.id !== selectedCardId);
  const room = player.picnicBag.treats + player.picnicBag.toys < capacity(player);
  const required = effect.scaled ? suitCount([card], effect.suit) : 1;
  const bagRoom = capacity(player) - player.picnicBag.treats - player.picnicBag.toys;
  switch (effect.type) {
    case "NONE": return { ok: false, reason: "이 행동은 없습니다." };
    case "LEVEL":
    case "LEVEL_SCORE": return { ok: canPayLevel(player), reason: player.playgroundLevel >= 5 ? "놀이터가 이미 최고 레벨입니다." : "놀이터 확장 비용이 부족합니다." };
    case "LEVEL_DISCOUNT": return { ok: canPayLevel(player, 1), reason: "할인된 놀이터 확장 비용이 부족합니다." };
    case "TRASH_RIVAL": return { ok: state.players.some((p, i) => i !== playerIndex && p.entrance.some((c) => !c.bestFriend)), reason: "상대 입구에 작별할 동물이 없습니다." };
    case "ALBUM_ONE":
    case "ALBUM_SUIT": return { ok: otherHand.length >= required && capacity(player) - player.album.length >= required, reason: otherHand.length < required ? "사진첩에 넣을 손 카드가 부족합니다." : "사진첩에 빈자리가 부족합니다." };
    case "ALBUM_THEN_MOVE": return { ok: otherHand.length >= 1 && player.album.length < capacity(player) && player.storage.treats + player.storage.toys >= 1 && room, reason: otherHand.length < 1 ? "사진첩에 넣을 손 카드가 없습니다." : !room ? "소풍 가방이 가득 찼습니다." : "소풍 가방에 넣을 자원이 없습니다." };
    case "MOVE_SUIT": return { ok: bagRoom >= required && player.storage.treats + player.storage.toys >= required, reason: bagRoom < required ? "소풍 가방의 빈자리가 부족합니다." : "보관함에 옮길 자원이 부족합니다." };
    case "TRASH_SUIT": return { ok: otherHand.length >= required, reason: "작별할 다른 손 카드가 부족합니다." };
    case "MATCH_BAG": return { ok: player.picnicBag.treats + player.picnicBag.toys > 0 && (player.storage.treats < 4 || player.storage.toys < 4), reason: "소풍 가방이 비어 있거나 보관함에 자리가 없습니다." };
    case "MATCH_RIVAL_BAG": return { ok: state.players.some((p, i) => i !== playerIndex && p.picnicBag.treats + p.picnicBag.toys > 0), reason: "자원을 참고할 상대 소풍 가방이 비어 있습니다." };
    case "SCORE_BAG": return { ok: player.picnicBag.treats + player.picnicBag.toys > 0, reason: "소풍 가방에 점수로 바꿀 자원이 없습니다." };
    case "SCORE_ALBUM": return { ok: player.album.length > 0, reason: "사진첩에 점수로 바꿀 카드가 없습니다." };
    case "SCORE_LEVEL": return { ok: player.playgroundLevel > 0, reason: "현재 놀이터 레벨이 0입니다." };
    case "REPEAT_GAIN_SCORE": return { ok: player.storage[effect.resource] >= required, reason: `${effect.resource === "treats" ? "간식" : "장난감"}이 부족합니다.` };
    case "GAIN_ALBUM": return { ok: player.album.length > 0, reason: "사진첩에 카드가 없습니다." };
    case "RECRUIT_SUIT": return { ok: state.parkDeck.length >= required, reason: "반복해서 친해질 동물이 공원 덱에 부족합니다." };
    default: return { ok: true, reason: "" };
  }
}

function cardAvailability(state, card) {
  const together = actionAvailability(state, state.currentPlayerIndex, card, card.togetherEffect, card.id);
  const home = actionAvailability(state, state.currentPlayerIndex, card, card.homeEffect, card.id);
  return { together, home, ok: together.ok || home.ok, reason: together.reason === home.reason ? together.reason : `${together.reason} ${home.reason}` };
}

function addResource(player, resource, amount) {
  const target = resource === "choice" ? "treats" : resource;
  const gained = Math.min(amount, 4 - player.storage[target]);
  player.storage[target] += gained;
  return { target, gained };
}

function effectAmount(state, card, addedCards, effect) {
  if (!effect.scaled) return effect.amount || 1;
  return suitCount([card, ...addedCards, ...state.players[state.currentPlayerIndex].album], effect.suit);
}

function calculation(state, card, addedCards, effect) {
  if (!effect.scaled) return null;
  const lead = suitCount([card], effect.suit);
  const added = suitCount(addedCards, effect.suit);
  const album = suitCount(state.players[state.currentPlayerIndex].album, effect.suit);
  return { suit: effect.suit, lead, added, album, total: lead + added + album };
}

function boostIsPerformable(state, card, addedCards, candidate, effect) {
  const player = state.players[state.currentPlayerIndex];
  const extras = [...addedCards, candidate];
  const amount = suitCount([card, ...extras, ...player.album], effect.suit);
  const remainingHand = player.hand.filter((c) => c.id !== card.id && !extras.some((extra) => extra.id === c.id)).length;
  const bagRoom = capacity(player) - player.picnicBag.treats - player.picnicBag.toys;
  if (effect.type === "ALBUM_SUIT") return remainingHand >= amount && capacity(player) - player.album.length >= amount;
  if (effect.type === "MOVE_SUIT") return player.storage.treats + player.storage.toys >= amount && bagRoom >= amount;
  if (effect.type === "TRASH_SUIT") return remainingHand >= amount;
  if (effect.type === "RECRUIT_SUIT") return state.parkDeck.length >= amount;
  if (effect.type === "REPEAT_GAIN_SCORE") return player.storage[effect.resource] >= amount;
  return true;
}

function expectedText(state, card, addedCards, effect, choice) {
  const amount = effectAmount(state, card, addedCards, effect);
  if (["GAIN", "GAIN_SUIT", "GAIN_ALBUM"].includes(effect.type)) {
    const resource = effect.resource === "toys" ? "장난감" : effect.resource === "treats" ? "간식" : choice === "toys" ? "장난감" : "간식";
    return `${resource} ${effect.type === "GAIN_ALBUM" ? state.players[state.currentPlayerIndex].album.length : amount}개 획득`;
  }
  if (["SCORE_SUIT", "SCORE_BAG", "SCORE_ALBUM", "SCORE_LEVEL", "SELF_TRASH_SCORE"].includes(effect.type)) return `인기 점수 ${amount}점 획득`;
  if (["LEVEL", "LEVEL_DISCOUNT", "LEVEL_SCORE"].includes(effect.type)) return "놀이터 1단계 확장";
  if (effect.type === "NONE") return "결과 없음";
  return `${amount}회 행동 수행`;
}

function applyEffect(next, playerIndex, card, effect, addedCards, choice, label) {
  const player = next.players[playerIndex];
  const amount = effect.scaled ? suitCount([card, ...addedCards, ...player.album], effect.suit) : effect.amount || 1;
  let message = "행동을 완료했습니다.";
  if (effect.type === "GAIN" || effect.type === "GAIN_SUIT") {
    const resource = effect.resource === "choice" || !effect.resource ? choice : effect.resource;
    const result = addResource(player, resource, amount);
    message = `${result.target === "treats" ? "간식" : "장난감"} ${result.gained}개를 얻었습니다.`;
  } else if (effect.type === "MATCH_BAG") {
    const treats = Math.min(player.picnicBag.treats, 4 - player.storage.treats);
    const toys = Math.min(player.picnicBag.toys, 4 - player.storage.toys);
    player.storage.treats += treats; player.storage.toys += toys;
    message = `소풍 가방과 같은 구성으로 간식 ${treats}, 장난감 ${toys}개를 얻었습니다.`;
  } else if (effect.type === "MATCH_RIVAL_BAG") {
    const rival = next.players.find((p, i) => i !== playerIndex && p.picnicBag.treats + p.picnicBag.toys > 0);
    if (rival) { player.storage.treats = Math.min(4, player.storage.treats + rival.picnicBag.treats); player.storage.toys = Math.min(4, player.storage.toys + rival.picnicBag.toys); }
    message = "상대 소풍 가방과 같은 구성의 자원을 얻었습니다.";
  } else if (["LEVEL", "LEVEL_DISCOUNT", "LEVEL_SCORE"].includes(effect.type)) {
    payLevelCost(player, effect.type === "LEVEL_DISCOUNT" ? 1 : 0);
    player.playgroundLevel = Math.min(5, player.playgroundLevel + 1);
    if (effect.type === "LEVEL_SCORE") player.popularity += effect.amount;
    message = `놀이터를 ${player.playgroundLevel}레벨로 확장했습니다.`;
  } else if (effect.type === "SCORE_BAG") {
    const points = player.picnicBag.treats + player.picnicBag.toys; player.popularity += points; message = `인기 ${points}점을 얻었습니다.`;
  } else if (effect.type === "SCORE_ALBUM") {
    player.popularity += player.album.length; message = `인기 ${player.album.length}점을 얻었습니다.`;
  } else if (effect.type === "SCORE_LEVEL") {
    player.popularity += player.playgroundLevel; message = `인기 ${player.playgroundLevel}점을 얻었습니다.`;
  } else if (["SCORE_SUIT", "SELF_TRASH_SCORE"].includes(effect.type)) {
    player.popularity += amount;
    if (effect.type === "SELF_TRASH_SCORE") next.trashPlayedCard = true;
    message = effect.type === "SELF_TRASH_SCORE" ? `인기 ${amount}점을 얻고 이 카드와 작별했습니다.` : `인기 ${amount}점을 얻었습니다.`;
  } else if (["ALBUM_ONE", "ALBUM_SUIT", "ALBUM_THEN_MOVE"].includes(effect.type)) {
    const moves = effect.type === "ALBUM_SUIT" ? amount : 1;
    for (let i = 0; i < moves && player.hand.length && player.album.length < capacity(player); i += 1) player.album.push(player.hand.shift());
    if (effect.type === "ALBUM_THEN_MOVE" && player.picnicBag.treats + player.picnicBag.toys < capacity(player)) {
      const resource = player.storage.treats ? "treats" : player.storage.toys ? "toys" : null;
      if (resource) { player.storage[resource] -= 1; player.picnicBag[resource] += 1; }
    }
    message = effect.type === "ALBUM_THEN_MOVE" ? "카드를 사진첩에 등록하고 자원 1개를 소풍 가방에 넣었습니다." : "카드를 사진첩에 등록했습니다.";
  } else if (effect.type === "MOVE_SUIT") {
    for (let i = 0; i < amount && player.picnicBag.treats + player.picnicBag.toys < capacity(player); i += 1) {
      const key = player.storage.treats ? "treats" : "toys"; if (!player.storage[key]) break; player.storage[key] -= 1; player.picnicBag[key] += 1;
    }
    message = "자원을 소풍 가방으로 옮겼습니다.";
  } else if (effect.type === "TRASH_RIVAL") {
    const rival = next.players.find((p, i) => i !== playerIndex && p.entrance.length); const removed = rival?.entrance.shift();
    if (effect.reward) addResource(player, choice, effect.reward);
    message = removed ? `${removed.name}과 작별했습니다.` : message;
  } else if (effect.type === "TRASH_SUIT") {
    const removed = player.hand.splice(0, Math.min(amount, player.hand.length));
    if (effect.reward === "toys") addResource(player, "toys", removed.length);
    if (effect.reward === "score") player.popularity += removed.length;
    message = `카드 ${removed.length}장과 작별했습니다.`;
  } else if (effect.type === "REPEAT_GAIN_SCORE") {
    const repeats = Math.min(amount, player.storage[effect.resource]); player.storage[effect.resource] -= repeats; player.popularity += repeats; message = `자원 ${repeats}개를 사용하고 인기 ${repeats}점을 얻었습니다.`;
  } else if (effect.type === "EXCHANGE_SUIT") {
    const exchanges = Math.min(amount, player.storage.treats + player.storage.toys); const from = player.storage.treats ? "treats" : "toys"; const to = from === "treats" ? "toys" : "treats"; const n = Math.min(exchanges, player.storage[from], 4 - player.storage[to]); player.storage[from] -= n; player.storage[to] += n; message = `자원 ${n}개를 다른 종류로 바꿨습니다.`;
  } else if (effect.type === "GAIN_ALBUM") {
    const result = addResource(player, choice, player.album.length);
    message = `${result.target === "treats" ? "간식" : "장난감"} ${result.gained}개를 얻었습니다.`;
  } else if (effect.type === "RECRUIT_SUIT") {
    let recruited = 0;
    for (let i = 0; i < amount; i += 1) {
      const newFriend = next.parkDeck.shift();
      if (!newFriend) break;
      player.discard.push(newFriend);
      recruited += 1;
    }
    if (effect.reward) addResource(player, effect.reward, recruited);
    message = `동물 ${recruited}장과 친해지고 장난감 ${recruited}개를 얻었습니다.`;
  }
  next.log.unshift(`${player.name}: ${label} - ${message}`);
  next.toast = message;
}

function scorePlayer(player) { return player.popularity + levelScores[player.playgroundLevel] + (player.hasGoldenPaw ? 4 : 0); }
function activeStep(state) {
  if (state.phase === PHASES.SELECT) return state.selectedCardId ? 1 : 0;
  if (state.phase === PHASES.FOLLOW) return 2;
  if (state.phase === PHASES.RECRUIT || state.phase === PHASES.CLEANUP) return 3;
  return 0;
}
function instruction(state) {
  if (state.phase === PHASES.SELECT && !state.selectedCardId) return ["함께 놀 동물 1장을 선택하세요.", "카드를 선택하면 사용할 행동과 예상 결과를 확인할 수 있어요."];
  if (state.phase === PHASES.SELECT) return ["사용할 행동과 순서를 선택하세요.", "강화 카드를 더하거나 빼면 예상 결과가 바로 바뀝니다."];
  if (state.phase === PHASES.FOLLOW) return ["다른 플레이어가 같이 놀지 결정합니다.", "같은 성향 카드 1장을 버리면 함께 놀기 행동을 따라 할 수 있어요."];
  if (state.phase === PHASES.RECRUIT) return ["새 동물 한 마리와 친해지세요.", "동네 공원, 다른 놀이터 입구, 공원 덱 중 한 곳을 선택하세요."];
  if (state.phase === PHASES.CLEANUP) return ["차례를 정리하고 있습니다.", "카드 이동과 새 카드 뽑기는 자동으로 처리됩니다."];
  return ["게임이 끝났습니다.", "현재 최종 점수를 확인하세요."];
}

export default function App() {
  const [playerCount, setPlayerCount] = useState(2);
  const [state, setState] = useState(() => newGame(2));
  const current = state.players[state.currentPlayerIndex];
  const selectedCard = current.hand.find((c) => c.id === state.selectedCardId) || null;
  const addedCards = current.hand.filter((c) => state.addedCardIds.includes(c.id));
  const [title, helper] = instruction(state);

  useEffect(() => {
    if (state.phase !== PHASES.CLEANUP) return undefined;
    const timer = setTimeout(() => {
      setState((previous) => {
        const next = clone(previous);
        if (next.cleanupStep < 3) {
          next.cleanupStep += 1;
          next.toast = cleanupMessages(next)[next.cleanupStep];
          return next;
        }
        const player = next.players[next.currentPlayerIndex];
        if (next.playedCard && !next.trashPlayedCard) player.discard.push(next.playedCard);
        player.discard.push(...player.hand.filter((c) => c.bestFriend));
        player.entrance.push(...player.hand.filter((c) => !c.bestFriend));
        player.hand = [];
        next.players[next.currentPlayerIndex] = draw(player, 5);
        const roundEnd = next.currentPlayerIndex === next.players.length - 1;
        next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length;
        if (roundEnd) next.turn += 1;
        const entrant = next.players[next.currentPlayerIndex];
        if (entrant.entrance.length) { entrant.discard.push(...entrant.entrance); entrant.entrance = []; }
        next.phase = PHASES.SELECT; next.selectedCardId = null; next.addedCardIds = []; next.playedCard = null; next.cleanupStep = 0; next.trashPlayedCard = false;
        next.toast = `${entrant.name} 차례입니다. 함께 놀 동물을 선택하세요.`;
        next.log.unshift(`${entrant.name}이 새 카드 5장을 준비했습니다.`);
        return next;
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [state.phase, state.cleanupStep]);

  function reset(count = playerCount) { setState(newGame(count)); }
  function selectCard(card) {
    const availability = cardAvailability(state, card);
    if (!availability.ok) return;
    const next = clone(state);
    next.selectedCardId = next.selectedCardId === card.id ? null : card.id;
    next.addedCardIds = [];
    if (next.selectedCardId) {
      const checks = cardAvailability(next, card);
      next.selectedActions = { together: checks.together.ok, home: checks.home.ok };
      next.toast = `${card.name}을 선택했습니다. 사용할 행동을 확인하세요.`;
    }
    setState(next);
  }
  function toggleAction(key) { const next = clone(state); next.selectedActions[key] = !next.selectedActions[key]; setState(next); }
  function swapActionOrder() { const next = clone(state); next.actionOrder.reverse(); setState(next); }
  function setChoice(choice) { const next = clone(state); next.resourceChoice = choice; setState(next); }
  function toggleAdded(card) {
    const next = clone(state);
    if (next.addedCardIds.includes(card.id)) next.addedCardIds = next.addedCardIds.filter((id) => id !== card.id);
    else next.addedCardIds.push(card.id);
    setState(next);
  }
  function startActions() {
    if (!selectedCard) return;
    let next = clone(state);
    const player = next.players[next.currentPlayerIndex];
    next.playedCard = player.hand.splice(player.hand.findIndex((c) => c.id === selectedCard.id), 1)[0];
    const extras = player.hand.filter((c) => next.addedCardIds.includes(c.id));
    player.hand = player.hand.filter((c) => !next.addedCardIds.includes(c.id));
    player.discard.push(...extras);
    for (const action of next.actionOrder) {
      if (!next.selectedActions[action]) continue;
      const isTogether = action === "together";
      applyEffect(next, next.currentPlayerIndex, next.playedCard, isTogether ? next.playedCard.togetherEffect : next.playedCard.homeEffect, extras, next.resourceChoice, isTogether ? "함께 놀기" : "우리 집 행동");
    }
    next.followQueue = next.selectedActions.together && next.playedCard.togetherEffect.type !== "NONE" ? next.players.map((_, i) => i).filter((i) => i !== next.currentPlayerIndex) : [];
    next.phase = next.followQueue.length ? PHASES.FOLLOW : PHASES.RECRUIT;
    next.selectedCardId = null;
    setState(next);
  }
  function skipCard() {
    const next = clone(state); next.playedCard = null; next.phase = PHASES.RECRUIT; next.toast = "카드를 내지 않고 친해지기 단계로 넘어갑니다."; next.log.unshift(`${current.name}이 카드 내기를 넘겼습니다.`); setState(next);
  }
  function follow(pass = false) {
    let next = clone(state); const followerIndex = next.followQueue[0]; const follower = next.players[followerIndex];
    if (!pass && next.followCardId) {
      const index = follower.hand.findIndex((c) => c.id === next.followCardId); const [paid] = follower.hand.splice(index, 1); follower.discard.push(paid);
      applyEffect(next, followerIndex, next.playedCard, next.playedCard.togetherEffect, [], next.resourceChoice, "같이 놀기");
      next.log.unshift(`${follower.name}이 함께 놀기 행동을 따라 했습니다.`);
      next.toast = `${follower.name}이 함께 놀았습니다.`;
    } else { next.log.unshift(`${follower.name}이 같이 놀기를 넘겼습니다.`); next.toast = `${follower.name}이 넘겼습니다.`; }
    next.followQueue.shift(); next.followCardId = null; next.phase = next.followQueue.length ? PHASES.FOLLOW : PHASES.RECRUIT; setState(next);
  }
  function recruit(source, cardId, ownerIndex) {
    const next = clone(state); let card;
    if (source === "park") { const i = next.parkRow.findIndex((c) => c.id === cardId); card = next.parkRow.splice(i, 1)[0]; const refill = next.parkDeck.shift(); if (refill) next.parkRow.push(refill); }
    if (source === "entrance") { const i = next.players[ownerIndex].entrance.findIndex((c) => c.id === cardId); card = next.players[ownerIndex].entrance.splice(i, 1)[0]; }
    if (source === "deck") card = next.parkDeck.shift();
    if (card) { next.players[next.currentPlayerIndex].discard.push(card); next.toast = `${card.name}과 친해졌습니다.`; next.log.unshift(`${current.name}이 ${card.name}과 친해졌습니다.`); }
    next.phase = PHASES.CLEANUP; next.cleanupStep = 0; setState(next);
  }

  return (
    <main>
      <header className="topbar">
        <div><p className="eyebrow">Pet Playground</p><h1>우리 집 동물놀이터</h1></div>
        <div className="setup">
          <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} aria-label="플레이어 수"><option value={2}>2명</option><option value={3}>3명</option><option value={4}>4명</option></select>
          <button onClick={() => reset(playerCount)}><RotateCcw size={17} /> 새 게임</button>
        </div>
      </header>

      <section className="turn-guide" aria-live="polite">
        <div className="turn-meta"><span>턴 {state.turn}</span><strong>{current.name}</strong><span>공원 덱 {state.parkDeck.length}장</span></div>
        <div className="progress">{STEPS.map((step, i) => <React.Fragment key={step}><div className={`progress-step ${i === activeStep(state) ? "active" : ""} ${i < activeStep(state) ? "done" : ""}`}><span>{i < activeStep(state) ? <Check size={14} /> : i + 1}</span>{step}</div>{i < STEPS.length - 1 && <ChevronRight size={16} />}</React.Fragment>)}</div>
        <h2>{title}</h2><p>{helper}</p>
      </section>

      {state.turn <= 3 && <Tutorial turn={state.turn} phase={state.phase} />}
      {state.toast && <div className="toast" role="status"><Info size={16} /> {state.toast}</div>}

      <section className="layout">
        <aside className="players">{state.players.map((player, index) => <PlayerPanel key={player.id} player={player} active={index === state.currentPlayerIndex} />)}</aside>

        <section className="table">
          <HandArea state={state} current={current} selectedCard={selectedCard} onSelect={selectCard} />
          <ParkArea state={state} onRecruit={recruit} />
          {state.phase === PHASES.RECRUIT && <RecruitZones state={state} onRecruit={recruit} />}
          {state.phase === PHASES.CLEANUP && <CleanupSequence state={state} />}
        </section>

        <DetailPanel state={state} card={selectedCard} addedCards={addedCards} onToggleAction={toggleAction} onSwapOrder={swapActionOrder} onChoice={setChoice} onToggleAdded={toggleAdded} onStart={startActions} onSkip={skipCard} />
      </section>

      {state.phase === PHASES.FOLLOW && <FollowOverlay state={state} onSelect={(id) => setState({ ...state, followCardId: id })} onFollow={() => follow(false)} onPass={() => follow(true)} />}
    </main>
  );
}

function cleanupMessages(state) {
  const player = state.players[state.currentPlayerIndex];
  const normal = player.hand.filter((c) => !c.bestFriend).length;
  return [
    state.trashPlayedCard ? `${state.playedCard?.name || "사용한 카드"} → 작별` : `${state.playedCard?.name || "사용한 카드"} → 버린 카드 더미`,
    `남은 반려동물 → 버린 카드 더미`,
    `남은 일반 동물 ${normal}장 → 놀이터 입구`,
    `새 카드 5장을 뽑습니다.`,
  ];
}

function Tutorial({ turn, phase }) {
  const copy = {
    1: ["1턴 안내", "카드를 고르고 같은 성향 카드로 행동을 강화해 보세요."],
    2: ["2턴 안내", phase === PHASES.FOLLOW ? "같은 성향 카드를 버리면 상대의 함께 놀기 행동을 따라 할 수 있어요." : "이번 턴에는 다른 플레이어의 함께 놀기 행동에 주목하세요."],
    3: ["3턴 안내", phase === PHASES.RECRUIT ? "다른 놀이터 입구의 동물도 데려올 수 있어요." : "남은 일반 동물은 턴이 끝날 때 내 놀이터 입구로 이동해요."],
  }[turn];
  return <aside className="tutorial"><Sparkles size={18} /><div><strong>{copy[0]}</strong><span>{copy[1]}</span></div></aside>;
}

function HandArea({ state, current, selectedCard, onSelect }) {
  const active = state.phase === PHASES.SELECT;
  return <section className={`hand-area ${active ? "focus" : "muted"}`}>
    <div className="zone-head"><div><span className="zone-kicker">지금 선택할 곳</span><h2>내 손패</h2></div><span>{current.hand.length}장</span></div>
    <div className="hand">{current.hand.map((card) => {
      const available = cardAvailability(state, card);
      return <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} blocked={!active || !available.ok} blockReason={!active ? "지금은 손패를 선택하는 단계가 아닙니다." : available.reason} onClick={() => active && onSelect(card)} />;
    })}</div>
  </section>;
}

function ParkArea({ state, onRecruit }) {
  const active = state.phase === PHASES.RECRUIT;
  return <section className={`park-area ${active ? "focus" : "muted"}`}>
    <div className="zone-head"><div><span className="zone-kicker">공개 카드</span><h2>동네 공원</h2></div></div>
    <div className="park-row">{state.parkRow.map((card) => <CardView key={card.id} card={card} compact blocked={!active} blockReason="친해지기 단계에서 선택할 수 있습니다." onClick={() => active && onRecruit("park", card.id)} />)}</div>
    {!active && <div className="zone-lock"><PackageOpen size={22} />친해지기 단계에서 선택할 수 있습니다</div>}
  </section>;
}

function RecruitZones({ state, onRecruit }) {
  const rivals = state.players.flatMap((p, owner) => owner === state.currentPlayerIndex ? [] : p.entrance.map((card) => ({ card, owner, player: p.name })));
  return <section className="recruit-zones">
    <div className="recruit-option"><h3>다른 놀이터 입구</h3>{rivals.length ? rivals.map(({ card, owner, player }) => <button key={card.id} onClick={() => onRecruit("entrance", card.id, owner)}><Dog size={16} /> {player} · {card.name}</button>) : <DisabledHint reason="다른 놀이터 입구에 데려올 동물이 없습니다." />}</div>
    <div className="recruit-option"><h3>공원 덱에서 무작위</h3><button className="primary" disabled={!state.parkDeck.length} title={!state.parkDeck.length ? "공원 덱이 비어 있습니다." : "공원 덱 맨 위 카드와 친해집니다."} onClick={() => onRecruit("deck")}><PackageOpen size={17} /> 무작위 동물과 친해지기</button></div>
  </section>;
}

function DetailPanel({ state, card, addedCards, onToggleAction, onSwapOrder, onChoice, onToggleAdded, onStart, onSkip }) {
  const current = state.players[state.currentPlayerIndex];
  if (!card) return <aside className="detail-panel"><div className="detail-empty"><PawPrint size={30} /><h2>동물을 선택해 주세요</h2><p>손패에서 함께 놀 동물 한 마리를 선택하면 행동과 예상 결과가 이곳에 표시됩니다.</p><div className="rule-note">턴 종료 시 남은 반려동물은 버림 더미로, 남은 일반 동물은 내 놀이터 입구로 이동합니다.</div>{state.phase === PHASES.SELECT && <button onClick={onSkip}>카드 내지 않고 넘어가기</button>}</div><RecentLog log={state.log} /></aside>;
  const available = cardAvailability(state, card);
  const effects = [{ key: "together", title: "함께 놀기", note: "다른 플레이어도 따라 할 수 있어요.", text: card.together, effect: card.togetherEffect, available: available.together }, { key: "home", title: "우리 집 행동", note: "이 행동은 나만 사용할 수 있어요.", text: card.home, effect: card.homeEffect, available: available.home }];
  const selectableExtras = current.hand.filter((c) => c.id !== card.id);
  const needsChoice = effects.some(({ key, effect }) => state.selectedActions[key] && (effect.resource === "choice" || effect.type === "GAIN_ALBUM" || effect.type === "TRASH_RIVAL"));
  const orderedEffects = state.actionOrder.map((key) => effects.find((item) => item.key === key));
  return <aside className="detail-panel">
    <div className="detail-head"><span>선택한 동물</span><h2>{card.name}</h2><SuitPills suits={card.suits} named /></div>
    <div className="action-order-head"><strong>행동 순서</strong>{state.selectedActions.together && state.selectedActions.home && <button onClick={onSwapOrder} title="두 행동의 실행 순서를 바꿉니다."><ArrowUpDown size={15} /> 순서 바꾸기</button>}</div>
    <div className="action-list">{orderedEffects.map((item, orderIndex) => {
      const calc = calculation(state, card, addedCards, item.effect);
      return <section className={`action-choice ${item.available.ok ? "available" : "unavailable"}`} key={item.key} title={!item.available.ok ? item.available.reason : ""}>
        <label><input type="checkbox" checked={state.selectedActions[item.key]} disabled={!item.available.ok} onChange={() => onToggleAction(item.key)} /><span><strong>{item.title}</strong><small>{item.note}</small></span><em>{item.available.ok ? "사용 가능" : "사용 불가"}</em></label>
        <p><b className="order-number">{orderIndex + 1}</b>{item.text}</p>{["LEVEL", "LEVEL_DISCOUNT", "LEVEL_SCORE"].includes(item.effect.type) && <div className="level-cost">확장 비용: {levelCostText(current, item.effect.type === "LEVEL_DISCOUNT" ? 1 : 0)}</div>}{!item.available.ok && <div className="reason">{item.available.reason}</div>}
        {state.selectedActions[item.key] && calc && <Calculation calc={calc} result={expectedText(state, card, addedCards, item.effect, state.resourceChoice)} />}
      </section>;
    })}</div>
    {needsChoice && <div className="resource-choice"><strong>받을 자원</strong><div className="segmented"><button className={state.resourceChoice === "treats" ? "selected" : ""} onClick={() => onChoice("treats")}>간식</button><button className={state.resourceChoice === "toys" ? "selected" : ""} onClick={() => onChoice("toys")}>장난감</button></div></div>}
    <div className="boosters"><strong>행동 강화 카드</strong><p>실제 결과를 늘리는 같은 성향 카드만 추가할 수 있습니다.</p>{selectableExtras.map((extra) => {
      const alreadySelected = state.addedCardIds.includes(extra.id);
      const increases = effects.some(({ key, effect }) => state.selectedActions[key] && effect.scaled && sharesSuit(extra, { suits: [effect.suit] }));
      const scaled = alreadySelected || effects.some(({ key, effect }) => state.selectedActions[key] && effect.scaled && sharesSuit(extra, { suits: [effect.suit] }) && boostIsPerformable(state, card, addedCards, extra, effect));
      const reason = !sharesSuit(extra, card) ? "주도 카드와 성향이 다릅니다." : increases ? "결과는 늘지만 행동 전체를 수행할 자원이나 카드가 부족합니다." : "선택한 행동의 결과를 증가시키지 않습니다.";
      return <button key={extra.id} className={alreadySelected ? "selected-extra" : ""} disabled={!scaled} title={!scaled ? reason : alreadySelected ? `${extra.name} 강화를 해제합니다.` : `${extra.name}으로 결과를 강화합니다.`} onClick={() => onToggleAdded(extra)}><SuitPills suits={extra.suits} /> {extra.name}</button>;
    })}</div>
    <button className="primary start" disabled={!state.selectedActions.together && !state.selectedActions.home} title={!state.selectedActions.together && !state.selectedActions.home ? "사용할 행동을 하나 이상 선택하세요." : "선택한 행동을 순서대로 수행합니다."} onClick={onStart}>행동 시작</button>
    <RecentLog log={state.log} />
  </aside>;
}

function Calculation({ calc, result }) {
  return <div className="calculation"><strong>{SUITS[calc.suit].label} 성향 계산</strong><div><span>주도 카드</span><b>+{calc.lead}</b></div><div><span>추가 카드</span><b>+{calc.added}</b></div><div><span>사진첩</span><b>+{calc.album}</b></div><div className="total"><span>총합</span><b>{calc.total}</b></div><p>예상 결과: {result}</p></div>;
}

function FollowOverlay({ state, onSelect, onFollow, onPass }) {
  const index = state.followQueue[0]; const player = state.players[index]; const candidates = player.hand.filter((c) => sharesSuit(c, state.playedCard));
  return <div className="overlay"><section className="follow-modal" role="dialog" aria-modal="true"><span className="modal-kicker">같이 놀기 · {player.name}</span><h2>{state.playedCard.name}의 행동을 따라 할까요?</h2><div className="copied-action"><strong>복사할 함께 놀기</strong><p>{state.playedCard.together}</p><small>같은 성향 카드 1장을 버려야 합니다.</small></div><h3>버릴 카드 선택</h3><div className="follow-cards">{candidates.length ? candidates.map((card) => <button key={card.id} className={state.followCardId === card.id ? "selected-extra" : ""} onClick={() => onSelect(card.id)}><SuitPills suits={card.suits} />{card.name}</button>) : <DisabledHint reason="같은 성향의 카드가 없어 같이 놀 수 없습니다." />}</div><div className="modal-actions"><button onClick={onPass}>넘기기</button><button className="primary" disabled={!state.followCardId} title={!state.followCardId ? "먼저 버릴 카드를 선택하세요." : "선택한 카드를 버리고 행동을 따라 합니다."} onClick={onFollow}>같이 놀기</button></div></section></div>;
}

function CleanupSequence({ state }) {
  const messages = cleanupMessages(state);
  return <section className="cleanup"><h2>턴 종료 처리</h2>{messages.map((message, index) => <div className={`${index < state.cleanupStep ? "done" : ""} ${index === state.cleanupStep ? "active" : ""}`} key={message}><span>{index < state.cleanupStep ? <Check size={15} /> : index + 1}</span>{message}</div>)}</section>;
}

function PlayerPanel({ player, active }) {
  return <article className={`player ${active ? "active" : ""}`}><div className="player-title"><Dog size={19} /><strong>{player.name}</strong>{active && <span>현재 차례</span>}</div><InfoGroup label="인기 점수"><b>{player.popularity}점</b></InfoGroup><InfoGroup label="놀이터"><span>레벨 {player.playgroundLevel}</span><span>종료 점수 +{levelScores[player.playgroundLevel]}</span><b>현재 최종 점수 {scorePlayer(player)}점</b></InfoGroup><InfoGroup label="보관함"><span>간식 {player.storage.treats}/4</span><span>장난감 {player.storage.toys}/4</span></InfoGroup><InfoGroup label="소풍 가방과 사진첩"><span>가방 {player.picnicBag.treats + player.picnicBag.toys}/{capacity(player)}</span><span>사진첩 {player.album.length}/{capacity(player)}</span></InfoGroup><InfoGroup label="카드 더미"><span>덱 {player.deck.length}</span><span>버림 {player.discard.length}</span><span>입구 {player.entrance.length}</span></InfoGroup></article>;
}
function InfoGroup({ label, children }) { return <div className="info-group"><small>{label}</small><div>{children}</div></div>; }

function CardView({ card, selected = false, blocked = false, blockReason = "", compact = false, onClick }) {
  const artColumn = card.artIndex % 5;
  const artRow = Math.floor(card.artIndex / 5);
  const artStyle = { "--art-x": `${(artColumn / 4) * 100}%`, "--art-y": `${(artRow / 9) * 100}%` };
  return <article className={`card ${selected ? "selected" : ""} ${blocked ? "blocked" : ""} ${compact ? "compact" : ""}`} onClick={!blocked ? onClick : undefined} tabIndex={!blocked && onClick ? 0 : undefined} onKeyDown={(e) => { if (!blocked && onClick && (e.key === "Enter" || e.key === " ")) onClick(); }} aria-disabled={blocked} title={blocked ? blockReason : "카드를 선택해 자세히 봅니다."}><div className="card-art" style={artStyle} role="img" aria-label={`${card.name} 동물 일러스트`}><div className="card-top"><SuitPills suits={card.suits} named />{card.bestFriend && <span className="tag">반려동물</span>}</div></div><div className="card-name"><h3>{card.name}</h3></div><div className="card-copy"><div className="card-action-copy together"><strong>함께 놀기</strong><p>{card.together}</p><small>다른 플레이어도 따라 할 수 있어요.</small></div><div className="card-action-copy home"><strong>우리 집 행동</strong><p>{card.home}</p><small>이 행동은 나만 사용할 수 있어요.</small></div></div>{selected && <div className="selected-mark"><Check size={15} /> 선택됨</div>}{blocked && <div className="card-block"><Info size={17} />{blockReason}</div>}</article>;
}

function SuitPills({ suits, named = false }) {
  const groups = suits.reduce((acc, suit) => ({ ...acc, [suit]: (acc[suit] || 0) + 1 }), {});
  return <div className={`suits ${named ? "named" : ""}`} title="같은 성향 카드와 사진첩 아이콘으로 일부 행동을 강화할 수 있습니다.">{Object.entries(groups).map(([suit, count]) => { const Icon = SUITS[suit].icon; return <span key={suit} style={{ "--suit": SUITS[suit].color }}><Icon size={14} />{named && <>{SUITS[suit].label}{count > 1 ? ` ${count}` : ""}</>}</span>; })}</div>;
}
function DisabledHint({ reason }) { return <div className="disabled-hint" title={reason}><Info size={16} />{reason}</div>; }
function RecentLog({ log }) { return <details className="recent-log"><summary>최근 기록</summary>{log.slice(0, 10).map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</details>; }

if (typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (root) createRoot(root).render(<App />);
}
