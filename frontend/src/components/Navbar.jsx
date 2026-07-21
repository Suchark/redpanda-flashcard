import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">🐼 Red Panda</div>
      <div className="navbar-links">
        <NavLink to="/" end>หน้าแรก</NavLink>
        <NavLink to="/decks">ชุดคำศัพท์</NavLink>
        <NavLink to="/add">เพิ่มคำ</NavLink>
        <NavLink to="/settings">ตั้งค่า</NavLink>
      </div>
    </nav>
  );
}
