import React from "react";
import { NavLink } from "react-router-dom";
import { TOP_NAV_ITEMS } from "../common/constants";

export default function TopNav() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "#dbeafe" : "#9fb5d9",
    textDecoration: "none",
    fontSize: "13px",
    padding: "6px 10px",
    borderRadius: "8px",
    background: isActive ? "rgba(56, 189, 248, 0.2)" : "transparent",
    border: isActive ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid transparent",
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        display: "flex",
        gap: "8px",
        padding: "6px",
        borderRadius: "12px",
        border: "1px solid rgba(124, 148, 183, 0.35)",
        backgroundColor: "rgba(6, 10, 20, 0.68)",
        backdropFilter: "blur(8px)",
      }}
    >
      {TOP_NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} style={linkStyle}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
