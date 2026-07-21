import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FlashCard from "../components/FlashCard.jsx";
import Mascot from "../components/Mascot.jsx";
import { getCards, submitReview } from "../api";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Build a queue of mixed rounds out of a shuffled card list.
// Each round is { type: "flashcard" | "choice" | "match", cards: [...] }
function buildRounds(cards) {
  const pool = shuffle(cards);
  const rounds = [];

  while (pool.length > 0) {
    const roll = Math.random();

    if (pool.length >= 3 && roll < 0.2) {
      // match round: take up to 4 cards at once
      const take = Math.min(4, pool.length);
      rounds.push({ type: "match", cards: pool.splice(0, take) });
    } else if (roll < 0.6) {
      rounds.push({ type: "choice", cards: [pool.shift()] });
    } else {
      rounds.push({ type: "flashcard", cards: [pool.shift()] });
    }
  }
  return rounds;
}

export default function MixedGame() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;

  const [allCards, setAllCards] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("idle");
  const [score, setScore] = useState(0);

  useEffect(() => {
    getCards(deckId)
      .then((cards) => {
        setAllCards(cards);
        setRounds(buildRounds(cards));
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  if (loading) return <div className="page-center">กำลังโหลด...</div>;

  if (allCards.length < 3) {
    return (
      <div className="page">
        <Mascot mood="idle" message="ต้องมีอย่างน้อย 3 คำในชุดเพื่อเล่นโหมดคละเกม" />
        <Link className="btn-primary" to="/decks">กลับไปเพิ่มคำศัพท์</Link>
      </div>
    );
  }

  if (roundIndex >= rounds.length) {
    return (
      <div className="page">
        <Mascot mood="excited" message={`เล่นครบทุกด่านแล้ว! ได้คะแนน ${score} แต้ม`} size="lg" />
        <Link className="btn-primary" to="/">กลับหน้าแรก</Link>
      </div>
    );
  }

  const round = rounds[roundIndex];
  const next = () => setRoundIndex((i) => i + 1);

  return (
    <div className="page">
      <Mascot mood={mood} size="sm" />
      <div className="mixed-round-label">
        ด่านที่ {roundIndex + 1} / {rounds.length} · คะแนน {score}
      </div>

      {round.type === "flashcard" && (
        <FlashcardRound
          card={round.cards[0]}
          onDone={(quality) => {
            setMood(quality >= 4 ? "happy" : quality === 3 ? "thinking" : "sad");
            if (quality >= 3) setScore((s) => s + 5);
            setTimeout(() => {
              setMood("idle");
              next();
            }, 600);
          }}
        />
      )}

      {round.type === "choice" && (
        <ChoiceRound
          card={round.cards[0]}
          allCards={allCards}
          onDone={(correct) => {
            setMood(correct ? "happy" : "sad");
            if (correct) setScore((s) => s + 10);
            setTimeout(() => {
              setMood("idle");
              next();
            }, 700);
          }}
        />
      )}

      {round.type === "match" && (
        <MiniMatchRound
          cards={round.cards}
          onDone={() => {
            setMood("excited");
            setScore((s) => s + round.cards.length * 8);
            setTimeout(() => {
              setMood("idle");
              next();
            }, 500);
          }}
        />
      )}
    </div>
  );
}

// ---- Round: single flashcard with 4-level SM-2 review ----
function FlashcardRound({ card, onDone }) {
  const [answered, setAnswered] = useState(false);

  const handleAnswer = async (quality) => {
    if (answered) return;
    setAnswered(true);
    await submitReview(card.id, quality);
    onDone(quality);
  };

  return (
    <>
      <FlashCard card={card} />
      <div className="study-actions study-actions-4">
        <button className="btn-again" onClick={() => handleAnswer(1)} disabled={answered}>💥 ยังไม่ได้</button>
        <button className="btn-hard" onClick={() => handleAnswer(3)} disabled={answered}>🤔 ยาก</button>
        <button className="btn-good" onClick={() => handleAnswer(4)} disabled={answered}>🙂 จำได้</button>
        <button className="btn-easy" onClick={() => handleAnswer(5)} disabled={answered}>✨ ง่ายมาก</button>
      </div>
    </>
  );
}

// ---- Round: multiple choice question ----
function ChoiceRound({ card, allCards, onDone }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [choices] = useState(() => {
    const wrong = shuffle(allCards.filter((c) => c.id !== card.id)).slice(0, 3);
    return shuffle([card, ...wrong]);
  });

  const handlePick = async (choice) => {
    if (feedback) return;
    const correct = choice.id === card.id;
    setSelected(choice.id);
    setFeedback(correct ? "correct" : "wrong");
    await submitReview(card.id, correct ? 4 : 1);
    onDone(correct);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-question">{card.meaningTh || card.meaningEn}</div>
      <div className="quiz-choices">
        {choices.map((c) => (
          <button
            key={c.id}
            className={`quiz-choice ${
              selected === c.id ? (feedback === "correct" ? "choice-correct" : "choice-wrong") : ""
            }`}
            onClick={() => handlePick(c)}
            disabled={!!feedback}
          >
            {c.word}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Round: mini matching (up to 4 pairs) ----
function MiniMatchRound({ cards, onDone }) {
  const [wordOrder] = useState(() => shuffle(cards));
  const [meaningOrder] = useState(() => shuffle(cards));
  const [selectedWord, setSelectedWord] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  const handleWordClick = (card) => {
    if (matchedIds.includes(card.id)) return;
    setSelectedWord(card);
  };

  const handleMeaningClick = (card) => {
    if (!selectedWord || matchedIds.includes(card.id)) return;

    if (selectedWord.id === card.id) {
      const updated = [...matchedIds, card.id];
      setMatchedIds(updated);
      setSelectedWord(null);
      if (updated.length === cards.length) onDone();
    } else {
      setWrongPair(card.id);
      setTimeout(() => setWrongPair(null), 500);
      setSelectedWord(null);
    }
  };

  return (
    <div className="mini-match-grid">
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
              matchedIds.includes(c.id) ? "matched" : wrongPair === c.id ? "choice-wrong" : ""
            }`}
            onClick={() => handleMeaningClick(c)}
            disabled={matchedIds.includes(c.id)}
          >
            {c.meaningTh || c.meaningEn}
          </button>
        ))}
      </div>
    </div>
  );
}