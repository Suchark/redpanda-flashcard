# 🐼 Red Panda Flashcard App

แอปแฟลชการ์ดท่องศัพท์ ธีมน้องแพนด้าแดง — ใช้ฟรี 100% ไม่มีค่า subscription
Stack: **React (Vite) + C# (ASP.NET Core Web API) + MongoDB**

## ฟีเจอร์ที่ทำไว้ในเวอร์ชันนี้

- ✅ เพิ่มคำศัพท์แบบพิมพ์เอง + ปุ่ม "วิเคราะห์อัตโนมัติ" (เรียก Free Dictionary API + MyMemory Translation API ฟรี ไม่ต้องมี API key)
- ✅ จัดชุดคำศัพท์ (Decks) + แท็ก
- ✅ ระบบทบทวนแบบ Spaced Repetition (SM-2 algorithm เหมือน Anki)
- ✅ ฟังเสียงอ่านคำศัพท์/ประโยค (Web Speech API ของเบราว์เซอร์ ฟรี ไม่ต้องมี backend)
- ✅ ควิซแบบเลือกตอบ + เติมคำในช่องว่าง (ตอบผิดจะวนกลับมาถามใหม่)
- ✅ เกมจับคู่คำศัพท์กับความหมาย (ทีละ 5 คำ)
- ✅ มาสคอตน้องแพนด้าแดง เปลี่ยนอารมณ์ตามผลตอบ
- ✅ Streak รายวัน / แต้มสะสม / ใบไม้ทองคำ ปลดล็อกชุดแต่งตัวให้มาสคอต
- ✅ Export / Import ข้อมูลเป็นไฟล์ JSON (สำรองข้อมูล)
- ✅ Dark mode / โทนสีพาสเทล

### ฟีเจอร์ที่ยังไม่ได้ทำ (ตั้งใจเว้นไว้)
- **Photo Text Scanner (OCR สแกนรูป + ขีดเส้นใต้)**: ของฟรีจริงๆ อย่าง Tesseract.js ความแม่นยำต่ำกว่ามาก ถ้าอยากได้ฟีเจอร์นี้ทีหลังบอกได้ เดี๋ยวเพิ่มให้ (จะรันฝั่ง browser ได้ฟรี แต่ผลลัพธ์อาจไม่แม่นเท่า Photo Text Scanner แบบพรีเมียม)

---

## สิ่งที่ต้องติดตั้งก่อน (ฟรีทั้งหมด)

1. **.NET SDK 8** — https://dotnet.microsoft.com/download/dotnet/8.0
2. **Node.js 18+** — https://nodejs.org
3. **Docker Desktop** (สำหรับรัน MongoDB บนเครื่อง ฟรี) — https://www.docker.com/products/docker-desktop
   - ถ้าไม่อยากลง Docker ใช้ **MongoDB Atlas free tier** แทนได้ (สมัครฟรีที่ mongodb.com/cloud/atlas แล้วเอา connection string มาใส่แทน)

---

## วิธีรัน

### 1) เปิด MongoDB (เลือกวิธีใดวิธีหนึ่ง)

**วิธี A: ใช้ Docker (แนะนำ ง่ายสุด)**
```bash
docker compose up -d
```
จะได้ MongoDB รันที่ `mongodb://localhost:27017`

**วิธี B: ใช้ MongoDB Atlas (cloud ฟรี)**
- สมัคร cluster ฟรีที่ https://mongodb.com/cloud/atlas
- คัดลอก connection string มาแก้ในไฟล์ `backend/RedPandaApi/appsettings.json` ตรง `MongoSettings.ConnectionString`

### 2) รัน Backend (C# API)

```bash
cd backend/RedPandaApi
dotnet restore
dotnet run
```
API จะรันที่ `http://localhost:5080` (ดู Swagger ทดสอบ API ได้ที่ `http://localhost:5080/swagger`)

### 3) รัน Frontend (React)

เปิด terminal ใหม่:
```bash
cd frontend
npm install
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

---

## โครงสร้างโปรเจกต์

```
redpanda-flashcard/
├── docker-compose.yml          # MongoDB local (ฟรี)
├── backend/RedPandaApi/
│   ├── Models/                 # Deck, Card (SM-2 fields), Stats
│   ├── Services/               # Mongo, SM-2 algorithm, free dictionary lookup
│   ├── Controllers/            # /api/decks, /api/cards, /api/study, /api/stats
│   └── Program.cs
└── frontend/
    └── src/
        ├── api.js              # เรียก backend + Web Speech API (ฟรี)
        ├── components/         # Mascot, FlashCard, Navbar
        └── pages/               # Home, Decks, DeckDetail, AddCard, Study, Quiz, Matching, Settings
```

## หมายเหตุเรื่อง API ฟรีที่ใช้

| บริการ | ใช้ทำอะไร | ต้องมี API key ไหม | ข้อจำกัด |
|---|---|---|---|
| dictionaryapi.dev | คำอ่าน/ความหมาย/ตัวอย่างประโยคภาษาอังกฤษ | ไม่ต้อง | เฉพาะคำศัพท์ทั่วไปที่มีในพจนานุกรม |
| mymemory.translated.net | แปล EN→TH | ไม่ต้อง | มี rate limit ~ไม่กี่พันคำ/วัน (เพียงพอสำหรับใช้คนเดียว) |
| Web Speech API | อ่านออกเสียง | ไม่ต้อง (built-in เบราว์เซอร์) | คุณภาพเสียงขึ้นกับเบราว์เซอร์/OS |

ถ้าคำไหน AI วิเคราะห์อัตโนมัติหาไม่เจอ ก็แค่กรอกข้อมูลเองในฟอร์มได้เลยค่ะ ไม่กระทบการใช้งาน
