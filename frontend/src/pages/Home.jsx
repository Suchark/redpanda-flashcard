import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Mascot from "../components/Mascot.jsx";
import { getStats, getDueCards } from "../api";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getDueCards()])
      .then(([s, due]) => {
        setStats(s);
        setDueCount(due.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-center">กำลังโหลด...</div>;

  const mood = dueCount === 0 ? "happy" : "idle";
  const message =
    dueCount === 0
      ? "วันนี้ทบทวนครบแล้ว เก่งมาก!"
      : `วันนี้มีคำรอทบทวน ${dueCount} คำนะ`;

  return (
    <div className="page">
      <Mascot mood={mood} message={message} size="lg" />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">🔥 {stats.streakDays}</div>
          <div className="stat-label">วันติดต่อกัน</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">⭐ {stats.totalPoints}</div>
          <div className="stat-label">แต้มสะสม</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">🍃 {stats.leaves}</div>
          <div className="stat-label">ใบไม้ทองคำ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">📚 {stats.totalCardsLearned}</div>
          <div className="stat-label">คำที่จำได้</div>
        </div>
      </div>

      <div className="home-actions">
        <Link className="btn-primary" to="/study">
          เริ่มทบทวน ({dueCount} คำ)
        </Link>
        <Link className="btn-secondary" to="/decks">
          ดูชุดคำศัพท์ทั้งหมด
        </Link>
      </div>
    </div>
  );
}
