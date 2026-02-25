import React from "react";
import "./RocketLoader.css";

export default function RocketLoader({ label = "Preparing launch...", compact = false }) {
  const rocketSize = compact ? 18 : 26;
  const flameWidth = compact ? 10 : 14;
  const flameHeight = compact ? 14 : 22;

  return (
    <div
      className="rocket-loader"
      style={{
        gap: compact ? "8px" : "12px",
        fontSize: compact ? "12px" : "14px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${rocketSize}px`,
          height: `${Math.round(rocketSize * 2.2)}px`,
          animation: "rocket-liftoff 1s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: `${rocketSize}px`,
            height: `${Math.round(rocketSize * 1.45)}px`,
            borderRadius: `${Math.round(rocketSize * 0.5)}px ${Math.round(rocketSize * 0.5)}px ${Math.round(rocketSize * 0.3)}px ${Math.round(rocketSize * 0.3)}px`,
            background: "linear-gradient(180deg, #f8fafc 0%, #dbeafe 75%, #93c5fd 100%)",
            boxShadow: "0 0 12px rgba(56, 189, 248, 0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${Math.round(rocketSize * 0.45)}px`,
            transform: "translateX(-50%)",
            width: `${Math.round(rocketSize * 0.35)}px`,
            height: `${Math.round(rocketSize * 0.35)}px`,
            borderRadius: "50%",
            backgroundColor: "#0ea5e9",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${Math.round(rocketSize * 0.15)}px`,
            bottom: `${Math.round(rocketSize * 0.35)}px`,
            width: 0,
            height: 0,
            borderLeft: `${Math.round(rocketSize * 0.2)}px solid transparent`,
            borderRight: `${Math.round(rocketSize * 0.2)}px solid transparent`,
            borderTop: `${Math.round(rocketSize * 0.32)}px solid #60a5fa`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: `${Math.round(rocketSize * 0.15)}px`,
            bottom: `${Math.round(rocketSize * 0.35)}px`,
            width: 0,
            height: 0,
            borderLeft: `${Math.round(rocketSize * 0.2)}px solid transparent`,
            borderRight: `${Math.round(rocketSize * 0.2)}px solid transparent`,
            borderTop: `${Math.round(rocketSize * 0.32)}px solid #60a5fa`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${Math.round(rocketSize * 0.12)}px`,
            transform: "translateX(-50%)",
            width: `${flameWidth}px`,
            height: `${flameHeight}px`,
            borderRadius: "50% 50% 75% 75%",
            background: "linear-gradient(180deg, #fb7185 0%, #f59e0b 70%, #fde68a 100%)",
            transformOrigin: "top center",
            animation: "rocket-flame 0.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: `${Math.round(rocketSize * 0.55)}px`,
            height: `${Math.round(rocketSize * 0.4)}px`,
            borderRadius: "50%",
            background: "rgba(148, 163, 184, 0.5)",
            filter: "blur(1px)",
            animation: "rocket-smoke 1s ease-out infinite",
          }}
        />
      </div>

      <span>{label}</span>
    </div>
  );
}
