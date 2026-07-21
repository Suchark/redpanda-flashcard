import React, { useState } from "react";
import { speak } from "../api";

export default function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false);

  if (!card) return null;

  return (
    <div className="flashcard-wrap">
      <div
        className={`flashcard ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-word">{card.word}</div>
          {card.phonetic && <div className="flashcard-phonetic">{card.phonetic}</div>}
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              speak(card.word, "en-US");
            }}
            title="ฟังเสียงอ่าน"
          >
            🔊
          </button>
          <div className="flashcard-hint">แตะเพื่อดูความหมาย</div>
        </div>

        <div className="flashcard-face flashcard-back">
          <div className="flashcard-pos">{card.partOfSpeech}</div>
          <div className="flashcard-meaning-th">{card.meaningTh}</div>
          {/* <div className="flashcard-meaning-en">{card.meaningEn}</div> */}
          {card.exampleSentence && (
            <div className="flashcard-example">
              <span
                className="btn-icon-inline"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.exampleSentence, "en-US");
                }}
              >
                🔊
              </span>
              "{card.exampleSentence}"
            </div>
          )}
          {/* {card.relatedWords?.length > 0 && (
            <div className="flashcard-related">
              คำเพื่อนบ้าน: {card.relatedWords.join(", ")}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
