import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDecks, createDeck, deleteDeck } from "../api";

const COLORS = ["#E8846B", "#F2B880", "#8BB89F", "#7FA8D9", "#C88BC4"];

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDecks()
      .then(setDecks)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const color = COLORS[decks.length % COLORS.length];
    await createDeck({ name, description, color });
    setName("");
    setDescription("");
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบชุดคำศัพท์นี้ (และคำศัพท์ทั้งหมดในชุด) ใช่ไหม?")) return;
    await deleteDeck(id);
    load();
  };

  return (
    <div className="page">
      <h1>ชุดคำศัพท์ของฉัน</h1>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="ชื่อชุดคำศัพท์ เช่น ศัพท์ธุรกิจ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="คำอธิบาย (ไม่บังคับ)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="btn-primary" type="submit">
          + สร้างชุด
        </button>
      </form>

      {loading ? (
        <div className="page-center">กำลังโหลด...</div>
      ) : decks.length === 0 ? (
        <div className="empty-state">ยังไม่มีชุดคำศัพท์ ลองสร้างชุดแรกกันเลย!</div>
      ) : (
        <div className="deck-grid">
          {decks.map((d) => (
            <div className="deck-card" key={d.id} style={{ borderColor: d.color }}>
              <Link to={`/decks/${d.id}`} className="deck-card-link">
                <div className="deck-card-name" style={{ color: d.color }}>
                  {d.name}
                </div>
                <div className="deck-card-desc">{d.description}</div>
              </Link>
              <button className="btn-danger-sm" onClick={() => handleDelete(d.id)}>
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
