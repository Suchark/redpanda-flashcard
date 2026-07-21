import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Mascot from "../components/Mascot.jsx";
import { getCards } from "../api";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const BATCH_SIZE = 5;

export default function Matching() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;

  const [allCards, setAllCards] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedWord, setSelectedWord] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  useEffect(() => {
    getCards(deckId)
      .then(setAllCards)
      .finally(() => setLoading(false));
  }, [deckId]);

  const batch = allCards.slice(batchIndex * BATCH_SIZE, batchIndex * BATCH_SIZE + BATCH_SIZE);
  const [wordOrder, setWordOrder] = useState([]);
  const [meaningOrder, setMeaningOrder] = useState([]);

  useEffect(() => {
    setWordOrder(shuffle(batch));
    setMeaningOrder(shuffle(batch));
    setMatchedIds([]);
    setSelectedWord(null);
  }, [batchIndex, allCards.length]);

  const handleWordClick = (card) => {
    if (matchedIds.includes(card.id)) return;
    setSelectedWord(card);
  };

  const handleMeaningClick = (card) => {
    if (!selectedWord || matchedIds.includes(card.id)) return;

    if (selectedWord.id === card.id) {
      setMatchedIds((m) => [...m, card.id]);
      setSelectedWord(null);
    } else {
      setWrongPair(card.id);
      setTimeout(() => setWrongPair(null), 500);
      setSelectedWord(null);
    }
  };

  if (loading) return <div className="page-center">กำลังโหลด...</div>;

  if (allCards.length < 2) {
    return (
      <div className="page">
        <Mascot mood="idle" message="ต้องมีอย่างน้อย 2 คำเพื่อเล่นเกมจับคู่" />
        <Link className="btn-primary" to="/decks">กลับไปเพิ่มคำศัพท์</Link>
      </div>
    );
  }

  const allBatchesDone = batchIndex * BATCH_SIZE >= allCards.length;
  const batchComplete = batch.length > 0 && matchedIds.length === batch.length;

  if (allBatchesDone) {
    return (
      <div className="page">
        <Mascot mood="excited" message="จับคู่ครบทุกคำแล้ว เก่งมาก!" size="lg" />
        <Link className="btn-primary" to="/">กลับหน้าแรก</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Mascot mood={batchComplete ? "happy" : "idle"} size="sm" />
      <div className="quiz-progress">
        ชุดที่ {batchIndex + 1} ({matchedIds.length}/{batch.length} คู่)
      </div>

      <div className="matching-grid">
        <div className="matching-col">
          {wordOrder.map((c) => (
            <button
              key={c.id}
              className={`matching-item ${
                matchedIds.includes(c.id) ? "matched" : selectedWord?.id === c.id ? "selected" : ""
              }`}
              onClick={() => handleWordClick(c)}
              disabled={matchedIds.includes(c.id)}
            >
              {c.word}
            </button>
          ))}
        </div>
        <div className="matching-col">
          {meaningOrder.map((c) => (
            <button
              key={c.id}
              className={`matching-item ${
                matchedIds.includes(c.id)
                  ? "matched"
                  : wrongPair === c.id
                  ? "choice-wrong"
                  : ""
              }`}
              onClick={() => handleMeaningClick(c)}
              disabled={matchedIds.includes(c.id)}
            >
              {c.meaningTh || c.meaningEn}
            </button>
          ))}
        </div>
      </div>

      {batchComplete && (
        <button className="btn-primary" onClick={() => setBatchIndex((i) => i + 1)}>
          ชุดต่อไป →
        </button>
      )}
    </div>
  );
}
