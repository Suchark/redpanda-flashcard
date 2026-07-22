const BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : "http://localhost:5080/api";
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Decks ----
export const getDecks = () => request("/decks");
export const getDeck = (id) => request(`/decks/${id}`);
export const createDeck = (deck) =>
  request("/decks", { method: "POST", body: JSON.stringify(deck) });
export const updateDeck = (id, deck) =>
  request(`/decks/${id}`, { method: "PUT", body: JSON.stringify(deck) });
export const deleteDeck = (id) => request(`/decks/${id}`, { method: "DELETE" });

// ---- Cards ----
export const getCards = (deckId) =>
  request(`/cards${deckId ? `?deckId=${deckId}` : ""}`);
export const getCard = (id) => request(`/cards/${id}`);
export const lookupWord = (word) =>
  request(`/cards/lookup?word=${encodeURIComponent(word)}`);
export const createCard = (card) =>
  request("/cards", { method: "POST", body: JSON.stringify(card) });
export const updateCard = (id, card) =>
  request(`/cards/${id}`, { method: "PUT", body: JSON.stringify(card) });
export const deleteCard = (id) => request(`/cards/${id}`, { method: "DELETE" });

// ---- Study ----
export const getDueCards = (deckId) =>
  request(`/study/due${deckId ? `?deckId=${deckId}` : ""}`);
export const getWeaknessCards = (deckId) =>
  request(`/study/weakness${deckId ? `?deckId=${deckId}` : ""}`);
// quality: 1 = Again, 3 = Hard, 4 = Good, 5 = Easy
export const submitReview = (cardId, quality) =>
  request("/study/review", {
    method: "POST",
    body: JSON.stringify({ cardId, quality }),
  });

// ---- Stats ----
export const getStats = () => request("/stats");
export const unlockOutfit = (outfitId, cost) =>
  request("/stats/unlock-outfit", {
    method: "POST",
    body: JSON.stringify({ outfitId, cost }),
  });
export const equipOutfit = (outfitId) =>
  request("/stats/equip-outfit", {
    method: "POST",
    body: JSON.stringify({ outfitId }),
  });

// ---- Free browser TTS (Web Speech API, no cost, no backend) ----
export function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// Mark a card as "Mastered" — removes it from Daily Review / Weakness queues
// for good, until manually un-archived.
export function archiveCard(cardId) {
  return request(`/study/archive`, {
    method: "POST",
    body: JSON.stringify({ cardId }),
  });
}

// Bring a mastered card back into normal review rotation.
export function unarchiveCard(cardId) {
  return request(`/study/unarchive`, {
    method: "POST",
    body: JSON.stringify({ cardId }),
  });
}

// List mastered/archived cards, optionally scoped to a deck.
export function getArchivedCards(deckId) {
  const q = deckId ? `?deckId=${encodeURIComponent(deckId)}` : "";
  return request(`/study/archived${q}`);
}

// "Restart Deck" — resets SM-2 scheduling for every non-mastered card in the
// deck so they're all due again, without touching CorrectCount/WrongCount or
// streak/points.
export function resetDeckProgress(deckId) {
  return request(`/study/reset-deck`, {
    method: "POST",
    body: JSON.stringify({ deckId }),
  });
}