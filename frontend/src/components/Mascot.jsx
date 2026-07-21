import React from "react";

// Simple emoji-based mascot (zero cost, no image assets needed).
// mood: "idle" | "happy" | "sad" | "excited"
const FACES = {
  idle: "🐾  (｡•ᴗ•｡)",
  happy: "🐾  (＾▽＾)",
  sad: "🐾  (；ω；)",
  excited: "🐾  ヽ(≧▽≦)ノ",
  thinking: "🐾  (・_・?)",
};

const MESSAGES = {
  idle: "พร้อมท่องศัพท์กันยัง~",
  happy: "เก่งมากเลย! 🎉",
  sad: "ไม่เป็นไรนะ ลองใหม่อีกครั้ง 💪",
  excited: "สุดยอดไปเลย!! ✨",
  thinking: "ใกล้ๆ แล้ว ทวนอีกนิดนะ 🤔",
};

export default function Mascot({ mood = "idle", message, size = "md" }) {
  const sizeClass = size === "lg" ? "mascot-lg" : size === "sm" ? "mascot-sm" : "mascot-md";

  return (
    <div className={`mascot ${sizeClass} mascot-${mood}`}>
      <div className="mascot-face">{FACES[mood] || FACES.idle}</div>
      <div className="mascot-bubble">{message || MESSAGES[mood] || MESSAGES.idle}</div>
    </div>
  );
}