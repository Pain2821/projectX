import React from "react";
import { NavLink } from "react-router-dom";
import { TOP_NAV_ITEMS } from "../common/constants";

export default function TopNav() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "#dbeafe" : "#9fb5d9",
    textDecoration: "none",
    fontSize: "clamp(13px, 1.1vw, 15px)",
    padding: "8px 12px",
    borderRadius: "8px",
    background: isActive ? "rgba(56, 189, 248, 0.2)" : "transparent",
    border: isActive ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid transparent",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: "max(8px, env(safe-area-inset-top))",
        left: "max(12px, env(safe-area-inset-left))",
        right: "max(12px, env(safe-area-inset-right))",
        zIndex: 1400,
      }}
    >
      <nav
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "flex-start",
          gap: "8px",
          padding: "6px",
          borderRadius: "12px",
          border: "1px solid rgba(124, 148, 183, 0.35)",
          backgroundColor: "rgba(6, 10, 20, 0.68)",
          backdropFilter: "blur(8px)",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
        }}
      >
        {TOP_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} style={linkStyle}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
