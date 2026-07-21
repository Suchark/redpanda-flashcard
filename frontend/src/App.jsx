import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Decks from "./pages/Decks.jsx";
import DeckDetail from "./pages/DeckDetail.jsx";
import AddCard from "./pages/AddCard.jsx";
import Study from "./pages/Study.jsx";
import Quiz from "./pages/Quiz.jsx";
import Matching from "./pages/Matching.jsx";
import Mixedgame from "./pages/Mixedgame.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:deckId" element={<DeckDetail />} />
          <Route path="/add" element={<AddCard />} />
          <Route path="/study" element={<Study />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/mixed" element={<Mixedgame />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
}