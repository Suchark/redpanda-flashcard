import React, { useEffect, useState } from "react";
import {
  getDecks,
  getCards,
  createDeck,
  createCard,
  getStats,
  unlockOutfit,
  equipOutfit,
} from "../api";

const OUTFITS = [
  { id: "default", name: "ชุดพื้นฐาน", cost: 0, emoji: "🐼" },
  { id: "hat", name: "หมวกน่ารัก", cost: 1, emoji: "🎩🐼" },
  { id: "scarf", name: "ผ้าพันคอ", cost: 1, emoji: "🧣🐼" },
  { id: "crown", name: "มงกุฎ", cost: 2, emoji: "👑🐼" },
];

export default function Settings() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const [stats, setStats] = useState(null);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const handleExport = async () => {
    const [decks, cards] = await Promise.all([getDecks(), getCards()]);
    const data = { decks, cards, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redpanda-flashcards-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportMsg("กำลังนำเข้าข้อมูล...");
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const deckIdMap = {};
      for (const deck of data.decks || []) {
        const created = await createDeck({
          name: deck.name,
          description: deck.description,
          color: deck.color,
        });
        deckIdMap[deck.id] = created.id;
      }

      for (const card of data.cards || []) {
        const newDeckId = deckIdMap[card.deckId] || card.deckId;
        await createCard({ ...card, deckId: newDeckId, id: undefined });
      }

      setImportMsg(
        `นำเข้าสำเร็จ: ${data.decks?.length || 0} ชุด, ${data.cards?.length || 0} คำ`
      );
    } catch (err) {
      setImportMsg("นำเข้าไม่สำเร็จ: " + err.message);
    }
  };

  const handleUnlock = async (outfit) => {
    try {
      const updated = await unlockOutfit(outfit.id, outfit.cost);
      setStats(updated);
    } catch (err) {
      alert("ปลดล็อกไม่สำเร็จ: " + err.message);
    }
  };

  const handleEquip = async (outfit) => {
    const updated = await equipOutfit(outfit.id);
    setStats(updated);
  };

  return (
    <div className="page">
      <h1>ตั้งค่า</h1>

      <section className="settings-section">
        <h2>ธีม</h2>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          Dark Mode / โทนสีพาสเทลกลางคืน
        </label>
      </section>

      <section className="settings-section">
        <h2>สำรอง / นำเข้าข้อมูล</h2>
        <button className="btn-secondary" onClick={handleExport}>
          ⬇️ Export ข้อมูลทั้งหมด (JSON)
        </button>
        <div style={{ marginTop: "0.75rem" }}>
          <label className="btn-secondary" style={{ cursor: "pointer" }}>
            ⬆️ Import ข้อมูล
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
        </div>
        {importMsg && <div className="lookup-msg">{importMsg}</div>}
      </section>

      <section className="settings-section">
        <h2>ร้านแต่งตัวน้องแพนด้าแดง</h2>
        {stats && (
          <>
            <div className="stat-value" style={{ marginBottom: "1rem" }}>
              🍃 ใบไม้ทองคำ: {stats.leaves}
            </div>
            <div className="outfit-grid">
              {OUTFITS.map((o) => {
                const unlocked = stats.unlockedOutfits.includes(o.id);
                const equipped = stats.currentOutfit === o.id;
                return (
                  <div className="outfit-card" key={o.id}>
                    <div className="outfit-emoji">{o.emoji}</div>
                    <div>{o.name}</div>
                    {equipped ? (
                      <span className="badge-equipped">กำลังสวมใส่</span>
                    ) : unlocked ? (
                      <button className="btn-secondary" onClick={() => handleEquip(o)}>
                        สวมใส่
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={() => handleUnlock(o)}>
                        ปลดล็อก ({o.cost} 🍃)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
