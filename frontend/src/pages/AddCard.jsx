import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDecks, lookupWord, createCard } from "../api";

const emptyForm = {
  word: "",
  partOfSpeech: "",
  phonetic: "",
  meaningEn: "",
  meaningTh: "",
  exampleSentence: "",
  relatedWords: "",
  tags: "",
};

export default function AddCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [decks, setDecks] = useState([]);
  const [deckId, setDeckId] = useState(searchParams.get("deckId") || "");
  const [form, setForm] = useState(emptyForm);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDecks().then((d) => {
      setDecks(d);
      if (!deckId && d.length > 0) setDeckId(d[0].id);
    });
  }, []);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAutoAnalyze = async () => {
    if (!form.word.trim()) return;
    setLookingUp(true);
    setLookupMsg("");
    try {
      const result = await lookupWord(form.word.trim());
      if (result.found === false) {
        setLookupMsg(result.error || "ไม่พบคำนี้ กรุณากรอกข้อมูลเอง");
      }
      setForm((f) => ({
        ...f,
        partOfSpeech: result.partOfSpeech || f.partOfSpeech,
        phonetic: result.phonetic || f.phonetic,
        meaningEn: result.meaningEn || f.meaningEn,
        meaningTh: result.meaningTh || f.meaningTh,
        exampleSentence: result.exampleSentence || f.exampleSentence,
        relatedWords: result.relatedWords?.join(", ") || f.relatedWords,
      }));
    } catch (err) {
      setLookupMsg("เรียก API ไม่สำเร็จ: " + err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deckId) {
      alert("กรุณาสร้างชุดคำศัพท์ก่อน");
      return;
    }
    setSaving(true);
    try {
      await createCard({
        deckId,
        word: form.word.trim(),
        partOfSpeech: form.partOfSpeech,
        phonetic: form.phonetic,
        meaningEn: form.meaningEn,
        meaningTh: form.meaningTh,
        exampleSentence: form.exampleSentence,
        relatedWords: form.relatedWords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      navigate(`/decks/${deckId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>เพิ่มคำศัพท์ใหม่</h1>

      <form className="card-form" onSubmit={handleSubmit}>
        <label>ชุดคำศัพท์</label>
        <select value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          {decks.length === 0 && <option value="">-- ยังไม่มีชุด --</option>}
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <label>คำศัพท์ (ภาษาอังกฤษ)</label>
        <div className="input-with-button">
          <input
            value={form.word}
            onChange={handleChange("word")}
            placeholder="เช่น abandon"
            required
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={handleAutoAnalyze}
            disabled={lookingUp || !form.word.trim()}
          >
            {lookingUp ? "กำลังค้นหา..." : "🤖 วิเคราะห์อัตโนมัติ"}
          </button>
        </div>
        {lookupMsg && <div className="lookup-msg">{lookupMsg}</div>}

        <label>ประเภทคำ (Part of Speech)</label>
        <input value={form.partOfSpeech} onChange={handleChange("partOfSpeech")} />

        <label>คำอ่าน (Phonetic)</label>
        <input value={form.phonetic} onChange={handleChange("phonetic")} />

        <label>ความหมายภาษาไทย</label>
        <input value={form.meaningTh} onChange={handleChange("meaningTh")} />

        <label>ความหมายภาษาอังกฤษ</label>
        <input value={form.meaningEn} onChange={handleChange("meaningEn")} />

        <label>ตัวอย่างประโยค</label>
        <textarea value={form.exampleSentence} onChange={handleChange("exampleSentence")} />

        <label>คำเพื่อนบ้าน (คั่นด้วย comma)</label>
        <input value={form.relatedWords} onChange={handleChange("relatedWords")} />

        <label>แท็ก (คั่นด้วย comma)</label>
        <input
          value={form.tags}
          onChange={handleChange("tags")}
          placeholder="เช่น คำยาก, ต้องท่องซ้ำ"
        />

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกคำศัพท์"}
        </button>
      </form>
    </div>
  );
}
