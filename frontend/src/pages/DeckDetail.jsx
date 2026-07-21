import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDeck, getCards, deleteCard, resetDeckProgress, unarchiveCard } from "../api";

export default function DeckDetail() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getDeck(deckId), getCards(deckId)])
      .then(([d, c]) => {
        setDeck(d);
        setCards(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [deckId]);

  const handleDeleteCard = async (id) => {
    if (!confirm("ลบคำนี้ใช่ไหม?")) return;
    await deleteCard(id);
    load();
  };

  const handleUnarchive = async (id) => {
    await unarchiveCard(id);
    load();
  };

  const handleResetProgress = async () => {
    if (
      !confirm(
        "รีเซ็ตความคืบหน้าการทบทวนของชุดนี้? คำทั้งหมด (ที่ยังไม่เชี่ยวชาญ) จะถูกดึงกลับมาทบทวนใหม่ตั้งแต่ต้น แต่สถิติสะสม (แต้ม/สตรีค) จะไม่ถูกลบ"
      )
    )
      return;
    setResetting(true);
    setResetMsg("");
    try {
      await resetDeckProgress(deckId);
      setResetMsg("รีเซ็ตความคืบหน้าเรียบร้อยแล้ว คำในชุดนี้พร้อมทบทวนใหม่ทั้งหมด");
      load();
    } catch (err) {
      setResetMsg("รีเซ็ตไม่สำเร็จ: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="page-center">กำลังโหลด...</div>;
  if (!deck) return <div className="page-center">ไม่พบชุดคำศัพท์นี้</div>;

  const activeCount = cards.filter((c) => !c.isArchived).length;
  const masteredCount = cards.filter((c) => c.isArchived).length;

  return (
    <div className="page">
      <h1 style={{ color: deck.color }}>{deck.name}</h1>
      <p className="deck-desc">{deck.description}</p>

      <div className="home-actions">
        <Link className="btn-primary" to={`/study?deckId=${deckId}`}>
          ทบทวนชุดนี้
        </Link>
        <Link className="btn-secondary" to={`/quiz?deckId=${deckId}`}>
          ควิซ
        </Link>
        <Link className="btn-secondary" to={`/matching?deckId=${deckId}`}>
          เกมจับคู่
        </Link>
        <Link className="btn-secondary" to={`/mixed?deckId=${deckId}`}>
          🎲 คละเกม
        </Link>
        <Link className="btn-secondary" to={`/study?deckId=${deckId}&mode=cram`}>
          ⚡ ฝึกฝนด่วน (Cram)
        </Link>
        <Link className="btn-secondary" to={`/add?deckId=${deckId}`}>
          + เพิ่มคำใหม่
        </Link>
      </div>

      <div className="deck-toolbar">
        <div className="deck-toolbar-stats">
          <span>คำที่ยังทบทวนอยู่: {activeCount}</span>
          <span>🌟 เชี่ยวชาญแล้ว: {masteredCount}</span>
        </div>
        <button className="btn-reset" onClick={handleResetProgress} disabled={resetting}>
          🔄 {resetting ? "กำลังรีเซ็ต..." : "รีเซ็ตความคืบหน้า"}
        </button>
      </div>
      {resetMsg && <div className="lookup-msg">{resetMsg}</div>}

      {cards.length === 0 ? (
        <div className="empty-state">ยังไม่มีคำศัพท์ในชุดนี้ ลองเพิ่มคำแรกกันเลย!</div>
      ) : (
        <table className="card-table">
          <thead>
            <tr>
              <th>คำศัพท์</th>
              <th>ความหมาย</th>
              <th>ประเภทคำ</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className={c.isArchived ? "row-mastered" : ""}>
                <td>{c.word}</td>
                <td>{c.meaningTh}</td>
                <td>{c.partOfSpeech}</td>
                <td>
                  {c.isArchived
                    ? "🌟 เชี่ยวชาญแล้ว"
                    : c.repetitions === 0
                    ? "ยังไม่ได้ท่อง"
                    : `ทบทวนแล้ว ${c.repetitions} ครั้ง`}
                </td>
                <td className="card-table-actions">
                  {c.isArchived && (
                    <button className="btn-secondary-sm" onClick={() => handleUnarchive(c.id)}>
                      นำกลับมาทบทวน
                    </button>
                  )}
                  <button className="btn-danger-sm" onClick={() => handleDeleteCard(c.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}