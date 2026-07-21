import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Mascot from "../components/Mascot.jsx";
import { getCards } from "../api";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || undefined;

  const [allCards, setAllCards] = useState([]);
  const [mode, setMode] = useState("choice"); // "choice" | "blank"
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    getCards(deckId)
      .then((cards) => {
        setAllCards(cards);
        setQueue(shuffle(cards));
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  const current = queue[0];

  const getChoices = () => {
    if (!current) return [];
    const wrongOptions = shuffle(
      allCards.filter((c) => c.id !== current.id)
    ).slice(0, 3);
    return shuffle([current, ...wrongOptions]);
  };

  const [choices, setChoices] = useState([]);
  useEffect(() => {
    if (mode === "choice" && current) setChoices(getChoices());
  }, [current, mode]);

  const handleChoiceAnswer = (choice) => {
    setSelected(choice.id);
    const isCorrect = choice.id === current.id;
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setQueue((q) => q.slice(1));
      } else {
        // wrong -> send this card to the back of the queue to try again later
        setQueue((q) => [...q.slice(1), current]);
      }
    }, 900);
  };

  const handleBlankSubmit = (e) => {
    e.preventDefault();
    const isCorrect =
      textAnswer.trim().toLowerCase() === current.word.trim().toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      setTextAnswer("");
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setQueue((q) => q.slice(1));
      } else {
        setQueue((q) => [...q.slice(1), current]);
      }
    }, 900);
  };

  if (loading) return <div className="page-center">กำลังโหลด...</div>;

  if (allCards.length < 4 && mode === "choice") {
    return (
      <div className="page">
        <Mascot mood="idle" message="ต้องมีอย่างน้อย 4 คำในชุดเพื่อเล่นควิซแบบเลือกตอบ" />
        <Link className="btn-primary" to="/decks">
          กลับไปเพิ่มคำศัพท์
        </Link>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="page">
        <Mascot mood="excited" message={`ตอบถูกครบทุกคำแล้ว! (${correctCount} คำ)`} size="lg" />
        <Link className="btn-primary" to="/">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="quiz-mode-switch">
        <button
          className={mode === "choice" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("choice")}
        >
          เลือกตอบ
        </button>
        <button
          className={mode === "blank" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("blank")}
        >
          เติมคำ
        </button>
      </div>

      <Mascot
        mood={feedback === "correct" ? "happy" : feedback === "wrong" ? "sad" : "idle"}
        size="sm"
      />

      <div className="quiz-progress">เหลืออีก {queue.length} คำ | ตอบถูกแล้ว {correctCount}</div>

      {mode === "choice" ? (
        <div className="quiz-card">
          <div className="quiz-question">{current.meaningTh || current.meaningEn}</div>
          <div className="quiz-choices">
            {choices.map((c) => (
              <button
                key={c.id}
                className={`quiz-choice ${
                  selected === c.id ? (feedback === "correct" ? "choice-correct" : "choice-wrong") : ""
                }`}
                onClick={() => !feedback && handleChoiceAnswer(c)}
                disabled={!!feedback}
              >
                {c.word}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form className="quiz-card" onSubmit={handleBlankSubmit}>
          <div className="quiz-question">
            {current.meaningTh || current.meaningEn}
            {current.exampleSentence && (
              <div className="quiz-example">
                {current.exampleSentence.replace(
                  new RegExp(current.word, "i"),
                  "_____"
                )}
              </div>
            )}
          </div>
          <input
            className={`quiz-input ${
              feedback === "correct" ? "choice-correct" : feedback === "wrong" ? "choice-wrong" : ""
            }`}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="พิมพ์คำศัพท์ภาษาอังกฤษ"
            disabled={!!feedback}
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={!!feedback}>
            ตรวจคำตอบ
          </button>
        </form>
      )}
    </div>
  );
}
