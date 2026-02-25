import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const buttonStyle = {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid rgba(124, 148, 183, 0.45)",
    background: "rgba(8, 23, 44, 0.85)",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "180px",
    textAlign: "center",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(124, 148, 183, 0.35)",
          borderRadius: "14px",
          background: "rgba(5, 10, 22, 0.62)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "260px",
        }}
      >
        <Link to="/liveiss" style={buttonStyle}>
          Track ISS
        </Link>
        <Link to="/satellites" style={buttonStyle}>
          Track Satellites
        </Link>
      </div>
    </div>
  );
}
