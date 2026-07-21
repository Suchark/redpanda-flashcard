import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FlashCard from "../components/FlashCard.jsx";
import Mascot from "../components/Mascot.jsx";
import {
  getDueCards,
  getWeaknessCards,
  getCards,
  submitReview,
  archiveCard,
} from "../api";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// modes:
//  - "srs"      : Daily Review, smart spaced-repetition queue (default)
//  - "weakness" : คลังจุดอ่อน, cards you keep getting wrong
//  - "cram"     : Quick Practice / คละทบทวน — all cards in the deck, shuffled.
//                 Never calls submitReview, so it never touches SRS scheduling
//                 or streak/points. Main learning progress stays untouched.
export default function Study() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "cram" ? "cram" : modeParam === "weakness" ? "weakness" : "srs";
  const isCram = mode === "cram";

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("idle");
  const [doneCount, setDoneCount] = useState(0);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setIndex(0);
    setDoneCount(0);

    const fetcher =
      mode === "cram" ? getCards : mode === "weakness" ? getWeaknessCards : getDueCards;

    fetcher(deckId)
      .then((cards) => setQueue(isCram ? shuffle(cards) : cards))
      .finally(() => setLoading(false));
  }, [deckId, mode]);

  const currentCard = queue[index];

  // quality: 1 = Again, 3 = Hard, 4 = Good, 5 = Easy
  const MOOD_BY_QUALITY = { 1: "sad", 3: "thinking", 4: "happy", 5: "excited" };

  const handleAnswer = async (quality) => {
    if (!currentCard) return;
    setMood(MOOD_BY_QUALITY[quality] || "idle");

    // Cram mode is a free practice pass: it never reports back to the SRS
    // engine, so the daily review schedule and stats stay exactly as they were.
    if (!isCram) {
      await submitReview(currentCard.id, quality);
    }
    setDoneCount((c) => c + 1);

    setTimeout(() => {
      setMood("idle");
      setIndex((i) => i + 1);
    }, 600);
  };

  const handleMastered = async () => {
    if (!currentCard || archiving) return;
    setArchiving(true);
    try {
      await archiveCard(currentCard.id);
      setMood("excited");
      setTimeout(() => {
        setMood("idle");
        setIndex((i) => i + 1);
      }, 500);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <div className="page-center">กำลังโหลด...</div>;

  if (queue.length === 0) {
    return (
      <div className="page">
        <Mascot
          mood="happy"
          message={
            isCram
              ? "ยังไม่มีคำในชุดนี้ให้ฝึกฝนเลย"
              : "ไม่มีคำที่ต้องทบทวนตอนนี้เลย เก่งมาก!"
          }
          size="lg"
        />
        <Link className="btn-primary" to="/decks">
          กลับไปหน้าชุดคำศัพท์
        </Link>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="page">
        <Mascot
          mood="excited"
          message={
            isCram
              ? `ฝึกฝนครบ ${doneCount} คำแล้ว! (ไม่กระทบสถิติทบทวนหลัก)`
              : `ทบทวนครบ ${doneCount} คำแล้ว สุดยอด!`
          }
          size="lg"
        />
        <Link className="btn-primary" to="/">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      {isCram && (
        <div className="mode-banner mode-banner-cram">
          ⚡ โหมดฝึกฝนด่วน (Cram) — ไม่กระทบสถิติหรือคิวทบทวนหลัก
        </div>
      )}
      {mode === "weakness" && (
        <div className="mode-banner mode-banner-weakness">🎯 คลังจุดอ่อน</div>
      )}

      <Mascot mood={mood} size="sm" />
      <div className="study-progress">
        {index + 1} / {queue.length}
      </div>

      <FlashCard card={currentCard} />

      <div className="study-actions study-actions-5">
        <button className="btn-again" onClick={() => handleAnswer(1)}>
          💥 ยังไม่ได้
        </button>
        <button className="btn-hard" onClick={() => handleAnswer(3)}>
          🤔 ยาก
        </button>
        <button className="btn-good" onClick={() => handleAnswer(4)}>
          🙂 จำได้
        </button>
        <button className="btn-easy" onClick={() => handleAnswer(5)}>
          ✨ ง่ายมาก
        </button>
        {!isCram && (
          <button className="btn-master" onClick={handleMastered} disabled={archiving}>
            🌟 เชี่ยวชาญแล้ว
          </button>
        )}
      </div>
    </div>
  );
}